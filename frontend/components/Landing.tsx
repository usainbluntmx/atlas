"use client";

import { FC, useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { PROGRAM_ID, NETWORK, LEADERBOARD_SEED, WORLD_SEED } from "@/lib/constants";

const Landing: FC = () => {
  const [worldStats, setWorldStats] = useState<{
    resourcesCollected: number;
    totalResources: number;
    explorers: number;
    epoch: number;
  } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const connection = new Connection(NETWORK, "confirmed");
        const programId = new PublicKey(PROGRAM_ID);

        const [worldPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from(WORLD_SEED)],
          programId
        );

        const worldInfo = await connection.getAccountInfo(worldPDA);
        if (!worldInfo) return;

        const data = worldInfo.data;
        // Layout v2: 8 discriminator + 32 authority + 8 total_resources + 8 resources_collected + 8 epoch
        const totalResources = Number(data.readBigUInt64LE(40));
        const resourcesCollected = Number(data.readBigUInt64LE(48));
        const epoch = Number(data.readBigUInt64LE(56));

        // Leaderboard PDA del epoch actual (seed incluye epoch en v2)
        const epochBuffer = Buffer.alloc(8);
        epochBuffer.writeBigUInt64LE(BigInt(epoch));
        const [leaderboardPDA] = PublicKey.findProgramAddressSync(
          [Buffer.from(LEADERBOARD_SEED), epochBuffer],
          programId
        );

        const lbInfo = await connection.getAccountInfo(leaderboardPDA);
        let explorers = 0;
        if (lbInfo) {
          // 8 discriminator + 8 epoch + 4 vec length
          explorers = lbInfo.data.readUInt32LE(16);
        }

        setWorldStats({ totalResources, resourcesCollected, explorers, epoch });
      } catch {
        // Silent fail — stats son opcionales en la landing
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      width: "100vw", height: "100vh", background: "#04060A",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      fontFamily: "Courier New, monospace",
      position: "relative", overflow: "hidden",
    }}>

      {/* Starfield */}
      <div style={{
        position: "absolute", inset: 0,
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
        position: "absolute", top: "30%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, #00C2A808 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Grid */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(#0D142088 1px, transparent 1px),
          linear-gradient(90deg, #0D142088 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px", pointerEvents: "none",
      }} />

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 10,
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: "0",
        maxWidth: "760px", padding: "0 24px", textAlign: "center",
      }}>

        <div style={{
          fontSize: "11px", letterSpacing: "5px", color: "#00C2A8",
          textTransform: "uppercase", marginBottom: "20px",
          padding: "6px 16px", border: "1px solid #00C2A833", background: "#00C2A808",
        }}>
          Built on Solana · Devnet
        </div>

        <div style={{
          width: "40px", height: "40px",
          border: "2px solid #00C2A8", transform: "rotate(45deg)",
          position: "relative", marginBottom: "24px",
        }}>
          <div style={{ position: "absolute", inset: "5px", background: "#00C2A8" }} />
        </div>

        <h1 style={{
          fontSize: "clamp(48px, 8vw, 88px)", fontWeight: 900,
          fontFamily: "Georgia, serif", color: "#F0EDE8",
          letterSpacing: "-3px", lineHeight: 1,
          margin: 0, marginBottom: "12px",
        }}>
          ATLAS
        </h1>

        <div style={{
          fontSize: "13px", letterSpacing: "6px", color: "#00C2A8",
          textTransform: "uppercase", marginBottom: "20px",
        }}>
          World Protocol
        </div>

        <p style={{
          fontSize: "16px", color: "#9CA3AF", lineHeight: 1.7,
          marginBottom: "28px", maxWidth: "540px",
        }}>
          El primer framework para mundos persistentes en Solana.
          Explora, recolecta recursos y compite en un mundo compartido
          donde cada acción queda registrada on-chain para siempre.
        </p>

        {/* Live stats */}
        <div style={{
          display: "flex", gap: "0", marginBottom: "28px",
          border: "1px solid #1A1F2E", background: "#080A0F", overflow: "hidden",
        }}>
          {[
            {
              label: "Recursos recolectados",
              value: worldStats ? `${worldStats.resourcesCollected}/${worldStats.totalResources}` : "—",
              color: "#00C2A8",
            },
            {
              label: "Explorers en leaderboard",
              value: worldStats ? String(worldStats.explorers) : "—",
              color: "#F59E0B",
            },
            {
              label: worldStats ? `Epoch ${worldStats.epoch}` : "Red",
              value: "Solana Devnet",
              color: "#818CF8",
            },
          ].map((stat, i) => (
            <div key={stat.label} style={{
              padding: "14px 24px",
              borderRight: i < 2 ? "1px solid #1A1F2E" : "none",
              display: "flex", flexDirection: "column", gap: "4px", minWidth: "160px",
            }}>
              <div style={{ fontSize: "18px", fontWeight: 900, color: stat.color, fontFamily: "Courier New, monospace" }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "10px", color: "#9CA3AF", letterSpacing: "1px", textTransform: "uppercase" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px", marginBottom: "28px", width: "100%",
        }}>
          {[
            { icon: "◆", title: "Mundo Persistente", desc: "Estado compartido on-chain entre wallets" },
            { icon: "⬡", title: "Personaje NFT", desc: "Tu personaje vive en Solana via PDA" },
            { icon: "▲", title: "Leaderboard por Epoch", desc: "Rankings históricos verificables on-chain" },
          ].map(f => (
            <div key={f.title} style={{
              padding: "16px 14px", border: "1px solid #1A1F2E",
              background: "#080A0F", display: "flex", flexDirection: "column", gap: "6px",
            }}>
              <div style={{ fontSize: "18px", color: "#00C2A8" }}>{f.icon}</div>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#E8E8E0", letterSpacing: "1px", textTransform: "uppercase" }}>
                {f.title}
              </div>
              <div style={{ fontSize: "10px", color: "#9CA3AF", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Stack */}
        <div style={{
          display: "flex", gap: "8px", flexWrap: "wrap",
          justifyContent: "center", marginBottom: "20px",
        }}>
          {["Anchor 0.32", "Solana PDAs", "Phaser.js 3", "Next.js 16", "Irys/Arweave", "Anchor Events"].map(t => (
            <div key={t} style={{
              fontSize: "10px", letterSpacing: "1px",
              color: "#9CA3AF", padding: "4px 10px",
              border: "1px solid #1A1F2E", background: "#080A0F",
            }}>{t}</div>
          ))}
        </div>

        <div
          onClick={() => window.open(`https://solscan.io/account/${PROGRAM_ID}?cluster=devnet`, "_blank")}
          style={{
            fontSize: "10px", color: "#6B7280", letterSpacing: "1px",
            cursor: "pointer", marginBottom: "16px",
            padding: "6px 12px", border: "1px solid #0D1420",
            fontFamily: "Courier New, monospace",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = "#00C2A8")}
          onMouseLeave={e => (e.currentTarget.style.color = "#6B7280")}
        >
          PROGRAM · {PROGRAM_ID}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            fontSize: "11px", color: "#9CA3AF",
            letterSpacing: "2px", textTransform: "uppercase",
          }}>
            Conecta tu wallet desde el HUD
          </div>
          <button
            onClick={() => window.open("https://github.com/usainbluntmx/atlas", "_blank")}
            style={{
              padding: "7px 16px", fontSize: "10px", letterSpacing: "3px",
              textTransform: "uppercase", border: "1px solid #1A1F2E",
              background: "transparent", color: "#E8E8E0", cursor: "pointer",
              fontFamily: "Courier New, monospace",
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
