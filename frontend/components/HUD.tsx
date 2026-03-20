"use client";

import { FC } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";

const WalletMultiButton = dynamic(
    () => import("@solana/wallet-adapter-react-ui").then((m) => m.WalletMultiButton),
    { ssr: false }
);

interface Props {
    character: {
        name: string;
        level: number;
        resourcesCollected: number;
    } | null;
    worldState: {
        totalResources: number;
        resourcesCollected: number;
    } | null;
    onMintCharacter: () => void;
    onInitWorld: () => void;
    loading: boolean;
}

const HUD: FC<Props> = ({
    character,
    worldState,
    onMintCharacter,
    onInitWorld,
    loading,
}) => {
    const { connected } = useWallet();

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px",
            background: "#080A0FCC",
            backdropFilter: "blur(8px)",
            borderBottom: "1px solid #1A1F2E",
        }}>
            {/* Logo */}
            <div>
                <span style={{
                    fontSize: "18px",
                    fontWeight: 900,
                    fontFamily: "Georgia, serif",
                    color: "#E8E8E0",
                    letterSpacing: "-1px",
                }}>
                    ATLAS
                </span>
                <span style={{
                    fontSize: "9px",
                    letterSpacing: "3px",
                    color: "#00C2A8",
                    marginLeft: "8px",
                    textTransform: "uppercase",
                }}>
                    World Protocol
                </span>
            </div>

            {/* World State */}
            {worldState && (
                <div style={{
                    display: "flex",
                    gap: "24px",
                    fontSize: "10px",
                    letterSpacing: "2px",
                    color: "#4A4A55",
                    textTransform: "uppercase",
                }}>
                    <span>
                        Recursos:{" "}
                        <span style={{ color: "#F59E0B" }}>
                            {worldState.totalResources - worldState.resourcesCollected}
                        </span>
                        /{worldState.totalResources}
                    </span>
                    <span>
                        Recolectados:{" "}
                        <span style={{ color: "#00C2A8" }}>
                            {worldState.resourcesCollected}
                        </span>
                    </span>
                </div>
            )}

            {/* Character Info */}
            {character && (
                <div style={{
                    fontSize: "10px",
                    letterSpacing: "2px",
                    color: "#4A4A55",
                    textTransform: "uppercase",
                }}>
                    <span style={{ color: "#E8E8E0" }}>{character.name}</span>
                    {" · "}
                    <span style={{ color: "#F59E0B" }}>LVL {character.level}</span>
                    {" · "}
                    <span style={{ color: "#00C2A8" }}>{character.resourcesCollected} recursos</span>
                </div>
            )}

            {/* Actions */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                {connected && !worldState && (
                    <button
                        onClick={onInitWorld}
                        disabled={loading}
                        style={{
                            padding: "6px 16px",
                            fontSize: "10px",
                            letterSpacing: "2px",
                            textTransform: "uppercase",
                            border: "1px solid #F59E0B",
                            background: "transparent",
                            color: "#F59E0B",
                            cursor: loading ? "not-allowed" : "pointer",
                            borderRadius: "2px",
                            opacity: loading ? 0.5 : 1,
                        }}
                    >
                        {loading ? "..." : "Init World"}
                    </button>
                )}
                {connected && worldState && !character && (
                    <button
                        onClick={onMintCharacter}
                        disabled={loading}
                        style={{
                            padding: "6px 16px",
                            fontSize: "10px",
                            letterSpacing: "2px",
                            textTransform: "uppercase",
                            border: "1px solid #00C2A8",
                            background: "transparent",
                            color: "#00C2A8",
                            cursor: loading ? "not-allowed" : "pointer",
                            borderRadius: "2px",
                            opacity: loading ? 0.5 : 1,
                        }}
                    >
                        {loading ? "..." : "Mint Character"}
                    </button>
                )}
                <WalletMultiButton />
            </div>
        </div>
    );
};

export default HUD;