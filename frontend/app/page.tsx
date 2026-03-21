"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getProgram, getWorldPDA, getCharacterPDA, getLeaderboardPDA } from "@/lib/anchor";
import HUD from "@/components/HUD";
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

  const walletRef = useRef(wallet);
  const publicKeyRef = useRef(publicKey);
  const connectedRef = useRef(connected);

  useEffect(() => { walletRef.current = wallet; }, [wallet]);
  useEffect(() => { publicKeyRef.current = publicKey; }, [publicKey]);
  useEffect(() => { connectedRef.current = connected; }, [connected]);

  const fetchState = useCallback(async () => {
    if (!connected || !publicKey) return;
    try {
      const program = getProgram(wallet);
      const [worldPDA] = getWorldPDA(PROGRAM_ID);
      try {
        const world = await (program.account as any).worldState.fetch(worldPDA);
        setWorldState({
          totalResources: Number(world.totalResources),
          resourcesCollected: Number(world.resourcesCollected),
        });
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
      await (program.methods as any)
        .collectResource(resourceType)
        .accounts({
          world: worldPDA,
          character: characterPDA,
          leaderboard: leaderboardPDA,
          owner: currentPublicKey,
        })
        .rpc();
      await new Promise((r) => setTimeout(r, 2000));
      const program2 = getProgram(currentWallet);
      const world = await (program2.account as any).worldState.fetch(worldPDA);
      const char = await (program2.account as any).character.fetch(characterPDA);
      const lb = await (program2.account as any).leaderboard.fetch(leaderboardPDA);
      setWorldState({
        totalResources: Number(world.totalResources),
        resourcesCollected: Number(world.resourcesCollected),
      });
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

      {!showGame && (
        <div style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "16px",
        }}>
          <div style={{
            fontSize: "48px",
            fontWeight: 900,
            fontFamily: "Georgia, serif",
            color: "#E8E8E0",
            letterSpacing: "-2px",
          }}>ATLAS</div>
          <div style={{
            fontSize: "10px",
            letterSpacing: "5px",
            color: "#00C2A8",
            textTransform: "uppercase",
          }}>World Protocol</div>
          <div style={{
            fontSize: "11px",
            letterSpacing: "2px",
            color: "#4A4A55",
            textTransform: "uppercase",
            marginTop: "16px",
          }}>
            {!connected ? "Conecta tu wallet para comenzar"
              : !worldState ? "Inicializa el mundo para continuar"
                : !character ? "Mintea tu personaje para entrar"
                  : "Cargando mundo..."}
          </div>
        </div>
      )}
    </main>
  );
}