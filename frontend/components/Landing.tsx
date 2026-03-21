"use client";

import { FC } from "react";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
    () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
    { ssr: false }
);

const Landing: FC = () => {
    return (
        <div style={{
            width: "100vw",
            height: "100vh",
            background: "#04060A",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Courier New, monospace",
            position: "relative",
            overflow: "hidden",
        }}>

            {/* Starfield background */}
            <div style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
          radial-gradient(1px 1px at 10% 20%, #E8E8E044 0%, transparent 100%),
          radial-gradient(1px 1px at 30% 60%, #E8E8E033 0%, transparent 100%),
          radial-gradient(1px 1px at 50% 10%, #E8E8E055 0%, transparent 100%),
          radial-gradient(1px 1px at 70% 80%, #E8E8E033 0%, transparent 100%),
          radial-gradient(1px 1px at 90% 40%, #E8E8E044 0%, transparent 100%),
          radial-gradient(1px 1px at 20% 90%, #E8E8E033 0%, transparent 100%),
          radial-gradient(1px 1px at 80% 15%, #E8E8E055 0%, transparent 100%),
          radial-gradient(1px 1px at 45% 50%, #E8E8E022 0%, transparent 100%),
          radial-gradient(1px 1px at 65% 35%, #E8E8E044 0%, transparent 100%),
          radial-gradient(1px 1px at 15% 70%, #E8E8E033 0%, transparent 100%)
        `,
            }} />

            {/* Ambient glow */}
            <div style={{
                position: "absolute",
                top: "30%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "600px",
                height: "600px",
                background: "radial-gradient(circle, #00C2A808 0%, transparent 70%)",
                pointerEvents: "none",
            }} />

            {/* Grid */}
            <div style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `
          linear-gradient(#0D142088 1px, transparent 1px),
          linear-gradient(90deg, #0D142088 1px, transparent 1px)
        `,
                backgroundSize: "60px 60px",
                pointerEvents: "none",
            }} />

            {/* Content */}
            <div style={{
                position: "relative",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0",
                maxWidth: "720px",
                padding: "0 24px",
                textAlign: "center",
            }}>

                {/* Badge */}
                <div style={{
                    fontSize: "11px",
                    letterSpacing: "5px",
                    color: "#00C2A8",
                    textTransform: "uppercase",
                    marginBottom: "24px",
                    padding: "6px 16px",
                    border: "1px solid #00C2A833",
                    background: "#00C2A808",
                }}>
                    Built on Solana · Devnet
                </div>

                {/* Logo mark */}
                <div style={{
                    width: "48px",
                    height: "48px",
                    border: "2px solid #00C2A8",
                    transform: "rotate(45deg)",
                    position: "relative",
                    marginBottom: "32px",
                }}>
                    <div style={{
                        position: "absolute",
                        inset: "6px",
                        background: "#00C2A8",
                    }} />
                </div>

                {/* Title */}
                <h1 style={{
                    fontSize: "clamp(56px, 8vw, 96px)",
                    fontWeight: 900,
                    fontFamily: "Georgia, serif",
                    color: "#F0EDE8",
                    letterSpacing: "-3px",
                    lineHeight: 1,
                    margin: 0,
                    marginBottom: "16px",
                }}>
                    ATLAS
                </h1>

                <div style={{
                    fontSize: "14px",
                    letterSpacing: "6px",
                    color: "#00C2A8",
                    textTransform: "uppercase",
                    marginBottom: "32px",
                }}>
                    World Protocol
                </div>

                {/* Tagline */}
                <p style={{
                    fontSize: "18px",
                    color: "#9CA3AF",
                    lineHeight: 1.7,
                    marginBottom: "48px",
                    maxWidth: "540px",
                }}>
                    El primer framework para mundos persistentes en Solana.
                    Explora, recolecta recursos y compite en un mundo compartido
                    donde cada acción queda registrada on-chain para siempre.
                </p>

                {/* Features */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "16px",
                    marginBottom: "48px",
                    width: "100%",
                }}>
                    {[
                        { icon: "◆", title: "Mundo Persistente", desc: "Estado compartido on-chain entre todos los jugadores" },
                        { icon: "⬡", title: "NFT Characters", desc: "Tu personaje vive en Solana — tuyo para siempre" },
                        { icon: "▲", title: "Leaderboard On-Chain", desc: "Rankings verificables y transparentes en Devnet" },
                    ].map((f) => (
                        <div key={f.title} style={{
                            padding: "20px 16px",
                            border: "1px solid #1A1F2E",
                            background: "#080A0F",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                        }}>
                            <div style={{
                                fontSize: "20px",
                                color: "#00C2A8",
                            }}>{f.icon}</div>
                            <div style={{
                                fontSize: "12px",
                                fontWeight: 700,
                                color: "#E8E8E0",
                                letterSpacing: "1px",
                                textTransform: "uppercase",
                            }}>{f.title}</div>
                            <div style={{
                                fontSize: "11px",
                                color: "#6B7280",
                                lineHeight: 1.5,
                            }}>{f.desc}</div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                }}>
                    <div style={{
                        fontSize: "12px",
                        color: "#6B7280",
                        letterSpacing: "2px",
                        textTransform: "uppercase",
                        marginBottom: "4px",
                    }}>
                        Conecta tu wallet para jugar
                    </div>
                    <WalletMultiButton />
                    <div style={{
                        fontSize: "10px",
                        color: "#6B7280",
                        letterSpacing: "1px",
                    }}>
                        Solana Devnet · Sin costo real · Solo curiosidad
                    </div>
                    <button
                        onClick={() => window.open("https://github.com/usainbluntmx/atlas", "_blank")}
                        style={{
                            padding: "10px 22px",
                            fontSize: "12px",
                            letterSpacing: "3px",
                            textTransform: "uppercase",
                            border: "1px solid #1A1F2E",
                            background: "transparent",
                            color: "#9CA3AF",
                            cursor: "pointer",
                            fontFamily: "Courier New, monospace",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginTop: "4px",
                        }}
                    >
                        ⌥ GitHub
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Landing;