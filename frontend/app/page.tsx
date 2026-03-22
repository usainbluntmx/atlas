"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getProgram, getWorldPDA, getCharacterPDA, getLeaderboardPDA } from "@/lib/anchor";
import HUD from "@/components/HUD";
import TxToast, { type Toast } from "@/components/TxToast";
import Landing from "@/components/Landing";
import dynamic from "next/dynamic";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), { ssr: false });

const PROGRAM_ID = new PublicKey("J5qe5PAK9XHLqbLmfxZ7BN1xFsPxYRKaxMc9qhw9fNxi");

export default function Home() {
  const wallet = useWallet();
  const { connected, publicKey } = wallet;

  const [worldState, setWorldState] = useState<{
    totalResources: number;
    resourcesCollected: number;
  } | null>(null);

  const [character, setCharacter] = useState<{
    name: string;
    level: number;
    resourcesCollected: number;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<{
    owner: string;
    name: string;
    resourcesCollected: number;
    level: number;
  }[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardReady, setLeaderboardReady] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [worldExhausted, setWorldExhausted] = useState(false);
  const [generatingWorld, setGeneratingWorld] = useState(false);

  const toastIdRef = useRef(0);
  const walletRef = useRef(wallet);
  const publicKeyRef = useRef(publicKey);
  const connectedRef = useRef(connected);

  useEffect(() => { walletRef.current = wallet; }, [wallet]);
  useEffect(() => { publicKeyRef.current = publicKey; }, [publicKey]);
  useEffect(() => { connectedRef.current = connected; }, [connected]);

  const addToast = useCallback((signature: string, resourceType: number) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, {
      id, signature, resourceType,
      points: resourceType === 2 ? 5 : resourceType === 1 ? 3 : 1
    }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const fetchState = useCallback(async () => {
    if (!connected || !publicKey) return;
    try {
      const program = getProgram(wallet);
      const [worldPDA] = getWorldPDA(PROGRAM_ID);
      try {
        const world = await (program.account as any).worldState.fetch(worldPDA);
        const resourcesCollected = Number(world.resourcesCollected);
        const totalResources = Number(world.totalResources);
        setWorldState({ totalResources, resourcesCollected });
        setWorldExhausted(resourcesCollected >= totalResources);
      } catch {
        setWorldState(null);
      }

      const [characterPDA] = getCharacterPDA(publicKey, PROGRAM_ID);
      try {
        const char = await (program.account as any).character.fetch(characterPDA);
        setCharacter({
          name: char.name,
          level: Number(char.level),
          resourcesCollected: Number(char.resourcesCollected),
        });
      } catch {
        setCharacter(null);
      }

      const [leaderboardPDA] = getLeaderboardPDA(PROGRAM_ID);
      try {
        const lb = await (program.account as any).leaderboard.fetch(leaderboardPDA);
        setLeaderboard(lb.entries.map((e: any) => ({
          owner: e.owner.toBase58(),
          name: e.name,
          resourcesCollected: Number(e.resourcesCollected),
          level: Number(e.level),
        })));
        setLeaderboardReady(true);
      } catch {
        setLeaderboardReady(false);
      }
    } catch (e) {
      console.error(e);
    }
  }, [connected, publicKey, wallet]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleInitWorld = async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const program = getProgram(wallet);
      const [worldPDA] = getWorldPDA(PROGRAM_ID);
      await (program.methods as any)
        .initializeWorld()
        .accounts({ world: worldPDA, authority: publicKey })
        .rpc();
      await fetchState();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleInitLeaderboard = async () => {
    if (!connected) return;
    setLoading(true);
    try {
      const program = getProgram(wallet);
      const [leaderboardPDA] = getLeaderboardPDA(PROGRAM_ID);
      await (program.methods as any)
        .initializeLeaderboard()
        .accounts({ leaderboard: leaderboardPDA, authority: publicKey })
        .rpc();
      await fetchState();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleMintCharacter = async () => {
    if (!connected || !publicKey) return;
    setLoading(true);
    try {
      const { uploadCharacterMetadata } = await import("@/lib/arweave");
      const name = `Explorer_${publicKey.toBase58().slice(0, 4)}`;
      const metadataUri = await uploadCharacterMetadata(wallet, name, 1);
      const program = getProgram(wallet);
      const [characterPDA] = getCharacterPDA(publicKey, PROGRAM_ID);
      await (program.methods as any)
        .mintCharacter(name, metadataUri)
        .accounts({ character: characterPDA, owner: publicKey })
        .rpc();
      await fetchState();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectResource = useCallback(async (_id: number, resourceType: number = 0) => {
    const currentPublicKey = publicKeyRef.current;
    const currentWallet = walletRef.current;
    const currentConnected = connectedRef.current;
    if (!currentConnected || !currentPublicKey) return;

    const points = resourceType === 2 ? 5 : resourceType === 1 ? 3 : 1;
    setSessionScore(prev => prev + points);

    try {
      const program = getProgram(currentWallet);
      const [worldPDA] = getWorldPDA(PROGRAM_ID);
      const [characterPDA] = getCharacterPDA(currentPublicKey, PROGRAM_ID);
      const [leaderboardPDA] = getLeaderboardPDA(PROGRAM_ID);

      const signature = await (program.methods as any)
        .collectResource(resourceType)
        .accounts({
          world: worldPDA,
          character: characterPDA,
          leaderboard: leaderboardPDA,
          owner: currentPublicKey,
        })
        .rpc();

      addToast(signature, resourceType);
      await new Promise((r) => setTimeout(r, 2000));

      const program2 = getProgram(currentWallet);
      const world = await (program2.account as any).worldState.fetch(worldPDA);
      const char = await (program2.account as any).character.fetch(characterPDA);
      const lb = await (program2.account as any).leaderboard.fetch(leaderboardPDA);

      const resourcesCollected = Number(world.resourcesCollected);
      const totalResources = Number(world.totalResources);

      if (resourcesCollected === 0 || resourcesCollected < (worldState?.resourcesCollected ?? 0)) {
        setGeneratingWorld(true);
        setTimeout(() => {
          setGeneratingWorld(false);
          setWorldExhausted(false);
          setSessionScore(0);
        }, 3000);
      }

      setWorldExhausted(resourcesCollected >= totalResources);
      setWorldState({ totalResources, resourcesCollected });
      setCharacter({
        name: char.name,
        level: Number(char.level),
        resourcesCollected: Number(char.resourcesCollected),
      });
      setLeaderboard(lb.entries.map((e: any) => ({
        owner: e.owner.toBase58(),
        name: e.name,
        resourcesCollected: Number(e.resourcesCollected),
        level: Number(e.level),
      })));
      setLeaderboardReady(true);

    } catch (e) {
      console.error(e);
    }
  }, []);

  const showGame = connected && worldState !== null && character !== null;

  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#080A0F" }}>

      {generatingWorld && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "#04060A",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "24px",
        }}>
          <div style={{
            width: "40px", height: "40px",
            border: "2px solid #00C2A8",
            transform: "rotate(45deg)",
            animation: "spin 1s linear infinite",
          }} />
          <div style={{
            fontSize: "13px", letterSpacing: "6px",
            color: "#00C2A8", textTransform: "uppercase",
            fontFamily: "Courier New, monospace",
          }}>
            Generando nuevo mundo...
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(45deg); }
              100% { transform: rotate(405deg); }
            }
          `}</style>
        </div>
      )}

      {worldExhausted && !generatingWorld && showGame && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 250,
          background: "#04060ACC",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "16px", backdropFilter: "blur(4px)",
        }}>
          <div style={{
            fontSize: "40px", fontWeight: 900,
            fontFamily: "Georgia, serif", color: "#F59E0B",
            letterSpacing: "-1px",
          }}>Mundo Agotado</div>
          <div style={{
            fontSize: "13px", color: "#9CA3AF",
            fontFamily: "Courier New, monospace", letterSpacing: "2px",
            textAlign: "center", maxWidth: "400px", lineHeight: 1.7,
          }}>
            Todos los recursos han sido recolectados.<br />
            El siguiente explorador que intente recolectar<br />
            generará un nuevo mundo automáticamente.
          </div>
          <div style={{
            fontSize: "11px", color: "#4A5568",
            fontFamily: "Courier New, monospace", letterSpacing: "2px",
            marginTop: "8px",
          }}>
            {worldState?.resourcesCollected}/{worldState?.totalResources} RECURSOS RECOLECTADOS
          </div>
        </div>
      )}

      <HUD
        character={character}
        worldState={worldState}
        onMintCharacter={handleMintCharacter}
        onInitWorld={handleInitWorld}
        onInitLeaderboard={handleInitLeaderboard}
        loading={loading}
        sessionScore={sessionScore}
        leaderboard={leaderboard}
        leaderboardReady={leaderboardReady}
        showLeaderboard={showLeaderboard}
        onToggleLeaderboard={() => setShowLeaderboard(prev => !prev)}
      />

      {showGame && (
        <GameCanvas
          characterName={character.name}
          characterLevel={character.level}
          onCollectResource={handleCollectResource}
        />
      )}

      {!showGame && <Landing />}

      <TxToast toasts={toasts} onRemove={removeToast} />
    </main>
  );
}