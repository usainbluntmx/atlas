"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import {
  getProgram,
  getWorldPDA,
  getCharacterPDA,
  getLeaderboardPDA,
  fetchAllState,
} from "@/lib/anchor";
import { parseError } from "@/lib/errors";
import { PROGRAM_ID, RESOURCE_POINTS, TOTAL_RESOURCES } from "@/lib/constants";
import type { WorldState, Character, LeaderboardEntry, TxToast as TxToastItem } from "@/lib/types";
import HUD from "@/components/HUD";
import TxToastComponent from "@/components/TxToast";
import Landing from "@/components/Landing";
import dynamic from "next/dynamic";

const GameCanvas = dynamic(() => import("@/components/GameCanvas"), { ssr: false });

export default function Home() {
  const wallet = useWallet();
  const { connected, publicKey } = wallet;

  // ─── Estado principal ────────────────────────────────────────────────────
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardReady, setLeaderboardReady] = useState(false);

  // ─── UI state ────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [sessionScore, setSessionScore] = useState(0);
  const [toasts, setToasts] = useState<TxToastItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatingWorld, setGeneratingWorld] = useState(false);

  // ─── Refs para callbacks estables (evita closure stale) ──────────────────
  const toastIdRef = useRef(0);
  const walletRef = useRef(wallet);
  const publicKeyRef = useRef(publicKey);
  const connectedRef = useRef(connected);
  const worldStateRef = useRef(worldState);

  useEffect(() => { walletRef.current = wallet; }, [wallet]);
  useEffect(() => { publicKeyRef.current = publicKey; }, [publicKey]);
  useEffect(() => { connectedRef.current = connected; }, [connected]);
  useEffect(() => { worldStateRef.current = worldState; }, [worldState]);

  // ─── Helpers de UI ───────────────────────────────────────────────────────
  const showError = useCallback((msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 5000);
  }, []);

  const addToast = useCallback((signature: string, resourceType: number) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev, {
      id,
      signature,
      resourceType,
      points: RESOURCE_POINTS[resourceType] ?? 1,
    }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Fetch de estado ─────────────────────────────────────────────────────
  const fetchState = useCallback(async () => {
    if (!connected || !publicKey) return;
    setInitialLoading(true);
    const program = getProgram(wallet);
    const state = await fetchAllState(program, publicKey);
    setWorldState(state.world);
    setCharacter(state.character);
    setLeaderboard(state.leaderboard);
    setLeaderboardReady(state.leaderboardReady);
    setInitialLoading(false);
  }, [connected, publicKey, wallet]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // ─── Suscripción a eventos on-chain ──────────────────────────────────────
  // Reemplaza el polling — el HUD se actualiza en tiempo real via WebSocket
  useEffect(() => {
    if (!connected || !publicKey) return;
    const program = getProgram(wallet);

    const resourceListener = program.addEventListener(
      "ResourceCollected",
      async () => {
        // Re-fetch cuando cualquier jugador recolecta (no solo nosotros)
        const state = await fetchAllState(program, publicKey);
        setWorldState(state.world);
        setLeaderboard(state.leaderboard);
      }
    );

    const resetListener = program.addEventListener(
      "WorldReset",
      async () => {
        setGeneratingWorld(true);
        setSessionScore(0);
        await fetchState();
        setTimeout(() => setGeneratingWorld(false), 3000);
      }
    );

    return () => {
      program.removeEventListener(resourceListener);
      program.removeEventListener(resetListener);
    };
  }, [connected, publicKey]);

  // ─── Acciones del contrato ───────────────────────────────────────────────

  const handleInitWorld = async () => {
    if (!connected || !publicKey) return;
    setLoading(true);
    try {
      const { BN } = await import("@coral-xyz/anchor");
      const program = getProgram(wallet);
      const [worldPDA] = getWorldPDA();
      await (program.methods as any)
        .initializeWorld(new BN(TOTAL_RESOURCES))
        .accounts({ world: worldPDA, authority: publicKey })
        .rpc();
      await fetchState();
    } catch (err) {
      const { message } = parseError(err);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInitLeaderboard = async () => {
    if (!connected || !publicKey || !worldState) return;
    setLoading(true);
    try {
      const program = getProgram(wallet);
      const [worldPDA] = getWorldPDA();
      const [leaderboardPDA] = getLeaderboardPDA(worldState.epoch);
      await (program.methods as any)
        .initializeLeaderboard()
        .accounts({
          world: worldPDA,
          leaderboard: leaderboardPDA,
          authority: publicKey,
        })
        .rpc();
      await fetchState();
    } catch (err) {
      const { message } = parseError(err);
      showError(message);
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
      const [characterPDA] = getCharacterPDA(publicKey);
      await (program.methods as any)
        .mintCharacter(name, metadataUri)
        .accounts({ character: characterPDA, owner: publicKey })
        .rpc();
      await fetchState();
    } catch (err) {
      const { message } = parseError(err);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectResource = useCallback(async (
    _id: number,
    resourceType: number = 0
  ) => {
    const currentPublicKey = publicKeyRef.current;
    const currentWallet = walletRef.current;
    const currentConnected = connectedRef.current;
    const currentWorld = worldStateRef.current;

    if (!currentConnected || !currentPublicKey || !currentWorld) return;

    // Actualización optimista del score de sesión
    const points = RESOURCE_POINTS[resourceType] ?? 1;
    setSessionScore(prev => prev + points);

    try {
      const program = getProgram(currentWallet);
      const [worldPDA] = getWorldPDA();
      const [characterPDA] = getCharacterPDA(currentPublicKey);
      const [leaderboardPDA] = getLeaderboardPDA(currentWorld.epoch);

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

      // Re-fetch estado después de confirmar
      await new Promise(r => setTimeout(r, 1500));
      const state = await fetchAllState(program, currentPublicKey);
      setWorldState(state.world);
      setCharacter(state.character);
      setLeaderboard(state.leaderboard);
      setLeaderboardReady(state.leaderboardReady);

    } catch (err) {
      // Revertir actualización optimista del score si falló
      setSessionScore(prev => prev - points);
      const { message } = parseError(err);
      showError(message);
    }
  }, [addToast, showError]);

  // ─── Render ───────────────────────────────────────────────────────────────
  const showGame = connected && worldState !== null && character !== null;
  const worldExhausted = worldState
    ? worldState.resourcesCollected >= worldState.totalResources
    : false;

  return (
    <main style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#080A0F" }}>

      {/* Loading inicial — evita flash entre Landing y Game */}
      {initialLoading && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 500, background: "#04060A",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: "32px", height: "32px", border: "2px solid #00C2A8",
            transform: "rotate(45deg)", animation: "spin 1s linear infinite",
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(45deg); } 100% { transform: rotate(405deg); } }`}</style>
        </div>
      )}

      {/* Error toast */}
      {errorMsg && (
        <div style={{
          position: "fixed", top: "72px", left: "50%", transform: "translateX(-50%)",
          zIndex: 400, background: "#1A0A0A", border: "1px solid #EF444466",
          borderLeft: "3px solid #EF4444", padding: "10px 20px",
          fontFamily: "Courier New, monospace", fontSize: "12px",
          color: "#EF4444", letterSpacing: "1px", whiteSpace: "nowrap",
        }}>
          ✕ {errorMsg}
        </div>
      )}

      {/* Generando mundo */}
      {generatingWorld && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 300, background: "#04060A",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "24px",
        }}>
          <div style={{
            width: "40px", height: "40px", border: "2px solid #00C2A8",
            transform: "rotate(45deg)", animation: "spin 1s linear infinite",
          }} />
          <div style={{
            fontSize: "13px", letterSpacing: "6px", color: "#00C2A8",
            textTransform: "uppercase", fontFamily: "Courier New, monospace",
          }}>
            Generando nuevo mundo...
          </div>
          <style>{`@keyframes spin { 0% { transform: rotate(45deg); } 100% { transform: rotate(405deg); } }`}</style>
        </div>
      )}

      {/* Mundo agotado */}
      {worldExhausted && !generatingWorld && showGame && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 250, background: "#04060ACC",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: "16px", backdropFilter: "blur(4px)",
        }}>
          <div style={{
            fontSize: "40px", fontWeight: 900,
            fontFamily: "Georgia, serif", color: "#F59E0B", letterSpacing: "-1px",
          }}>Mundo Agotado</div>
          <div style={{
            fontSize: "13px", color: "#9CA3AF",
            fontFamily: "Courier New, monospace", letterSpacing: "2px",
            textAlign: "center", maxWidth: "400px", lineHeight: 1.7,
          }}>
            Todos los recursos han sido recolectados.<br />
            El siguiente explorador generará un nuevo mundo.
          </div>
          <div style={{
            fontSize: "11px", color: "#4A5568",
            fontFamily: "Courier New, monospace", letterSpacing: "2px", marginTop: "8px",
          }}>
            EPOCH {worldState?.epoch} · {worldState?.resourcesCollected}/{worldState?.totalResources} RECURSOS
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
        epoch={worldState?.epoch ?? 0}
      />

      {showGame && (
        <GameCanvas
          characterName={character.name}
          characterLevel={character.level}
          onCollectResource={handleCollectResource}
        />
      )}

      {!showGame && <Landing />}

      <TxToastComponent toasts={toasts} onRemove={removeToast} />
    </main>
  );
}
