# ATLAS — World Protocol

> El primer framework para mundos persistentes en Solana.

![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=flat&logo=solana)
![Anchor](https://img.shields.io/badge/Anchor-0.32.1-blue?style=flat)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)
![Phaser](https://img.shields.io/badge/Phaser-3.90-green?style=flat)

**Demo en vivo:** https://atlas-fawn-delta.vercel.app  
**Program ID:** `J5qe5PAK9XHLqbLmfxZ7BN1xFsPxYRKaxMc9qhw9fNxi`  
**Red:** Solana Devnet

---

## ¿Qué es Atlas?

Atlas es un framework para construir mundos persistentes en Solana. Cada acción del jugador — recolectar un recurso, subir de nivel, aparecer en el leaderboard — queda registrada on-chain de forma permanente e inmutable.

El mundo es compartido: lo que un jugador recolecta ya no está disponible para nadie más. El estado persiste entre sesiones, wallets y dispositivos. No hay servidor central. No hay base de datos. Solo Solana.

---

## Demo

1. Abre https://atlas-fawn-delta.vercel.app
2. Conecta tu wallet de Phantom en Devnet
3. Mintea tu personaje (NFT on-chain)
4. Explora el mundo, recolecta recursos y compite en el leaderboard
5. Cada transacción muestra su hash verificable en Solscan

---

## Features

### On-Chain
- **Mundo compartido persistente** — estado global en Solana Devnet
- **Personaje NFT** — cada wallet mintea un personaje único via PDA
- **3 tipos de recursos** — Common (+1pt), Rare (+3pts), Epic (+5pts)
- **Leaderboard on-chain** — top 10 explorers verificable públicamente
- **Reset automático** — cuando el mundo se agota, el siguiente jugador genera uno nuevo
- **Level system** — nivel calculado on-chain basado en recursos recolectados

### Frontend
- **Mundo 2D estilo Pokémon** — pixel art con Phaser.js
- **Personaje animado** — 4 direcciones de movimiento + correr (Shift)
- **HUD retro-futurista** — barra de progreso del mundo, score de sesión
- **Toast de transacciones** — hash verificable en Solscan sin salir del juego
- **Landing page** — presentación del protocolo
- **Multi-wallet** — compatible con cualquier wallet de Solana

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Blockchain | Solana Devnet |
| Smart Contracts | Anchor 0.32.1 + Rust |
| Frontend | Next.js 16 + TypeScript |
| Motor de juego | Phaser.js 3.90 |
| Wallet | @solana/wallet-adapter |
| NFTs | Metaplex Umi |
| Storage | Arweave (metadata) |
| Deploy | Vercel |

---

## Arquitectura
```
atlas/
├── programs/atlas/src/lib.rs    # Smart contract (Anchor)
│   ├── initialize_world()       # Crea el mundo compartido
│   ├── initialize_leaderboard() # Crea el leaderboard on-chain
│   ├── mint_character()         # Mintea personaje NFT por wallet
│   └── collect_resource()       # Recolecta recurso + actualiza leaderboard
│
└── frontend/
    ├── app/page.tsx             # Lógica principal + estado
    ├── components/
    │   ├── HUD.tsx              # Interface de juego
    │   ├── GameCanvas.tsx       # Canvas de Phaser
    │   ├── Landing.tsx          # Página de presentación
    │   └── TxToast.tsx          # Notificaciones de transacciones
    ├── game/
    │   ├── scenes/WorldScene.ts # Mundo 2D en Phaser
    │   └── objects/Player.ts    # Personaje animado
    └── lib/
        ├── anchor.ts            # IDL + PDAs
        └── constants.ts         # Configuración
```

---

## Accounts On-Chain

| Account | PDA Seeds | Descripción |
|---------|-----------|-------------|
| `WorldState` | `["world"]` | Estado global del mundo |
| `Character` | `["character", owner]` | Personaje por wallet |
| `Leaderboard` | `["leaderboard"]` | Top 10 explorers |

---

## Instalación Local
```bash
# Clonar repositorio
git clone https://github.com/usainbluntmx/atlas
cd atlas

# Instalar dependencias del frontend
cd frontend
npm install

# Configurar Solana en Devnet
solana config set --url devnet

# Correr en desarrollo
npm run dev
```

---

## Roadmap

- [ ] **Session Keys** — transacciones permissionless sin aprobación manual
- [ ] **Múltiples mundos** — diferentes biomas con assets únicos
- [ ] **Crafting system** — combinar recursos para crear items
- [ ] **SDK público** — framework para que otros devs construyan sobre Atlas
- [ ] **Mainnet deploy** — con economía real de tokens
- [ ] **Chat on-chain** — comunicación entre explorers en el mundo

---

## Construido en

**Hackathon Solana 2026** — Track: Gaming

Construido en 48 horas por [@usainbluntmx](https://github.com/usainbluntmx)

---

## Verificar On-Chain

- **Program:** https://solscan.io/account/J5qe5PAK9XHLqbLmfxZ7BN1xFsPxYRKaxMc9qhw9fNxi?cluster=devnet
- **World State:** https://solscan.io/account/GuwD5SwPbgDiv9p1XFAVNhvZbSpJ9xgxu3XoVVKh2DPV?cluster=devnet
- **IDL:** https://solscan.io/account/4At87p1TK7bFNUxaehFNg1AG7HtoNqSBrxfeqiJSFwVf?cluster=devnet