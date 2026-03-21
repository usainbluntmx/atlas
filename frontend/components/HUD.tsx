"use client";

import { FC, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
    () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
    { ssr: false }
);

interface Props {
    character: { name: string; level: number; resourcesCollected: number } | null;
    worldState: { totalResources: number; resourcesCollected: number } | null;
    onMintCharacter: () => void;
    onInitWorld: () => void;
    onInitLeaderboard: () => void;
    loading: boolean;
    sessionScore: number;
    leaderboard: { owner: string; name: string; resourcesCollected: number; level: number }[];
    leaderboardReady: boolean;
    showLeaderboard: boolean;
    onToggleLeaderboard: () => void;
}

const HUD: FC<Props> = ({
    character, worldState, onMintCharacter, onInitWorld, onInitLeaderboard,
    loading, sessionScore, leaderboard, leaderboardReady, showLeaderboard, onToggleLeaderboard
}) => {
    const { connected } = useWallet();
    const [tick, setTick] = useState(0);
    const [prevLevel, setPrevLevel] = useState(character?.level ?? 1);
    const [levelUp, setLevelUp] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (character && character.level > prevLevel) {
            setLevelUp(true);
            setPrevLevel(character.level);
            setTimeout(() => setLevelUp(false), 2000);
        }
    }, [character?.level]);

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    const worldPct = worldState
        ? Math.round((worldState.resourcesCollected / worldState.totalResources) * 100)
        : 0;

    return (
        <>
            {/* Level up flash */}
            {levelUp && (
                <div style={{
                    position: "fixed", inset: 0, zIndex: 200,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    pointerEvents: "none", animation: "fadeOut 2s forwards",
                }}>
                    <div style={{ textAlign: "center", animation: "scaleIn 0.3s ease-out" }}>
                        <div style={{
                            fontSize: "14px", letterSpacing: "8px", color: "#F59E0B",
                            marginBottom: "12px", fontFamily: "Courier New, monospace",
                        }}>NIVEL ALCANZADO</div>
                        <div style={{
                            fontSize: "96px", fontWeight: 900, fontFamily: "Georgia, serif",
                            color: "#F59E0B", lineHeight: 1, textShadow: "0 0 60px #F59E0B88",
                        }}>LVL {character?.level}</div>
                    </div>
                </div>
            )}

            {/* Leaderboard panel */}
            {showLeaderboard && (
                <div style={{
                    position: "fixed", top: "72px", right: "24px", zIndex: 150,
                    width: "300px", background: "#0D1017",
                    border: "1px solid #1A1F2E", padding: "20px",
                }}>
                    <div style={{
                        fontSize: "11px", letterSpacing: "4px", color: "#00C2A8",
                        textTransform: "uppercase", fontFamily: "Courier New, monospace",
                        marginBottom: "16px",
                    }}>Leaderboard · On-Chain</div>

                    {!leaderboardReady ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <div style={{
                                fontSize: "12px", color: "#6B7280",
                                fontFamily: "Courier New, monospace", letterSpacing: "1px",
                                marginBottom: "8px",
                            }}>El leaderboard no está inicializado.</div>
                            <button onClick={onInitLeaderboard} disabled={loading} style={{
                                padding: "8px 16px", fontSize: "11px", letterSpacing: "2px",
                                textTransform: "uppercase", border: "1px solid #F59E0B",
                                background: "transparent", color: "#F59E0B",
                                cursor: loading ? "not-allowed" : "pointer",
                                fontFamily: "Courier New, monospace", opacity: loading ? 0.5 : 1,
                            }}>
                                {loading ? "..." : "Init Leaderboard"}
                            </button>
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div style={{
                            fontSize: "12px", color: "#6B7280",
                            fontFamily: "Courier New, monospace", letterSpacing: "1px",
                        }}>Sin explorers aún.</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {leaderboard.map((entry, i) => (
                                <div key={entry.owner} style={{
                                    display: "flex", alignItems: "center", gap: "10px",
                                    padding: "8px 10px",
                                    background: character?.name === entry.name ? "#00C2A808" : "transparent",
                                    border: character?.name === entry.name ? "1px solid #00C2A833" : "1px solid transparent",
                                }}>
                                    <div style={{
                                        fontSize: "13px", fontWeight: 900,
                                        color: i === 0 ? "#F59E0B" : i === 1 ? "#9CA3AF" : i === 2 ? "#CD7C2F" : "#3A4055",
                                        fontFamily: "Courier New, monospace", width: "20px",
                                    }}>{i + 1}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: "12px", color: "#E8E8E0",
                                            fontFamily: "Courier New, monospace", letterSpacing: "1px",
                                        }}>{entry.name}</div>
                                        <div style={{
                                            fontSize: "10px", color: "#6B7280",
                                            fontFamily: "Courier New, monospace", letterSpacing: "1px",
                                        }}>{entry.resourcesCollected} recursos · LVL {entry.level}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Top bar */}
            <div style={{
                position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
                height: "60px", display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: "0 24px",
                background: "linear-gradient(180deg, #080A0FEE 0%, #080A0F00 100%)",
                backdropFilter: "blur(4px)",
            }}>
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{
                        width: "30px", height: "30px",
                        border: "1px solid #00C2A8", transform: "rotate(45deg)", position: "relative",
                    }}>
                        <div style={{ position: "absolute", inset: "4px", background: "#00C2A8" }} />
                    </div>
                    <div>
                        <div style={{
                            fontSize: "18px", fontWeight: 900, fontFamily: "Georgia, serif",
                            color: "#F0EDE8", letterSpacing: "-0.5px", lineHeight: 1,
                        }}>ATLAS</div>
                        <div style={{
                            fontSize: "10px", letterSpacing: "3px", color: "#00C2A8",
                            textTransform: "uppercase", fontFamily: "Courier New, monospace",
                        }}>World Protocol</div>
                    </div>
                </div>

                {/* World state */}
                {worldState && (
                    <div style={{ textAlign: "center" }}>
                        <div style={{
                            fontSize: "10px", letterSpacing: "3px", color: "#6B7280",
                            textTransform: "uppercase", fontFamily: "Courier New, monospace", marginBottom: "5px",
                        }}>MUNDO</div>
                        <div style={{
                            width: "140px", height: "4px", background: "#1A1F2E",
                            borderRadius: "2px", overflow: "hidden",
                        }}>
                            <div style={{
                                height: "100%", width: `${worldPct}%`,
                                background: "linear-gradient(90deg, #00C2A8, #F59E0B)",
                                transition: "width 0.5s ease",
                            }} />
                        </div>
                        <div style={{
                            fontSize: "11px", color: "#9CA3AF", fontFamily: "Courier New, monospace",
                            marginTop: "4px", letterSpacing: "1px",
                        }}>
                            {worldState.totalResources - worldState.resourcesCollected} / {worldState.totalResources} restantes
                        </div>
                    </div>
                )}

                {/* Right */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {character && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: "12px",
                            padding: "8px 14px", border: "1px solid #1A1F2E", background: "#0D1017",
                        }}>
                            <div style={{
                                width: "32px", height: "32px",
                                border: `1px solid ${levelUp ? "#F59E0B" : "#00C2A8"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                transition: "border-color 0.3s",
                            }}>
                                <span style={{
                                    fontSize: "13px", fontWeight: 900,
                                    color: levelUp ? "#F59E0B" : "#00C2A8",
                                    fontFamily: "Courier New, monospace",
                                }}>{character.level}</span>
                            </div>
                            <div>
                                <div style={{
                                    fontSize: "13px", color: "#E8E8E0",
                                    fontFamily: "Courier New, monospace", letterSpacing: "1px",
                                }}>{character.name}</div>
                                <div style={{
                                    fontSize: "11px", color: "#6B7280",
                                    fontFamily: "Courier New, monospace", letterSpacing: "1px",
                                }}>
                                    {character.resourcesCollected} recursos
                                    {sessionScore > 0 && (
                                        <span style={{ color: "#F59E0B", marginLeft: "8px" }}>+{sessionScore}pts</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {connected && !worldState && (
                        <button onClick={onInitWorld} disabled={loading} style={{
                            padding: "8px 18px", fontSize: "11px", letterSpacing: "3px",
                            textTransform: "uppercase", border: "1px solid #F59E0B",
                            background: "transparent", color: "#F59E0B",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontFamily: "Courier New, monospace", opacity: loading ? 0.5 : 1,
                        }}>
                            {loading ? "..." : "Init World"}
                        </button>
                    )}

                    {connected && worldState && !character && (
                        <button onClick={onMintCharacter} disabled={loading} style={{
                            padding: "8px 18px", fontSize: "11px", letterSpacing: "3px",
                            textTransform: "uppercase", border: "1px solid #00C2A8",
                            background: "#00C2A808", color: "#00C2A8",
                            cursor: loading ? "not-allowed" : "pointer",
                            fontFamily: "Courier New, monospace", opacity: loading ? 0.5 : 1,
                        }}>
                            {loading ? "Minteando..." : "Mint Character"}
                        </button>
                    )}

                    {character && (
                        <button onClick={onToggleLeaderboard} style={{
                            padding: "8px 18px", fontSize: "11px", letterSpacing: "3px",
                            textTransform: "uppercase",
                            border: showLeaderboard ? "1px solid #00C2A8" : "1px solid #1A1F2E",
                            background: showLeaderboard ? "#00C2A808" : "transparent",
                            color: showLeaderboard ? "#00C2A8" : "#E8E8E0",
                            cursor: "pointer", fontFamily: "Courier New, monospace",
                        }}>
                            TOP
                        </button>
                    )}

                    <WalletMultiButton />
                </div>
            </div>

            {/* Bottom bar */}
            {character && worldState && (
                <div style={{
                    position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
                    height: "36px", display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "0 24px",
                    background: "linear-gradient(0deg, #080A0FCC 0%, #080A0F00 100%)",
                }}>
                    <div style={{
                        fontSize: "11px", color: "#9CA3AF",
                        fontFamily: "Courier New, monospace", letterSpacing: "2px",
                    }}>
                        ATLAS · SOLANA DEVNET · {timeStr}
                    </div>
                    <div style={{
                        fontSize: "11px", color: "#9CA3AF",
                        fontFamily: "Courier New, monospace", letterSpacing: "2px",
                    }}>
                        ↑↓←→ MOVER · SHIFT CORRER · ACÉRCATE A LOS RECURSOS PARA RECOLECTARLOS
                    </div>
                </div>
            )}

            <style>{`
        @keyframes fadeOut {
          0% { opacity: 1; }
          60% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes scaleIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
        </>
    );
};

export default HUD;