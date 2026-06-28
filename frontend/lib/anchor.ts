/**
 * anchor.ts v2
 *
 * IMPORTANTE: El IDL en este archivo es un placeholder.
 * Después de hacer `anchor build`, copia target/idl/atlas.json aquí
 * o importa el JSON directamente:
 *   import IDL from "./atlas.json"
 *
 * Eso elimina el `as any` en getProgram() y da type safety completa.
 */

import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { NETWORK, PROGRAM_ID, WORLD_SEED, CHARACTER_SEED } from "./constants";
import type { WorldState, Character } from "./types";

const LEADERBOARD_SEED = "leaderboard";

// TODO: Reemplazar con import del IDL generado por `anchor build`
// import IDL from "./atlas.json"
// Por ahora usamos el IDL de v1 como base — se actualizará al hacer build de v2

import IDL_JSON from "./atlas.json";
export const IDL = IDL_JSON;

// ─── Conexión y programa ───────────────────────────────────────────────────

export function getConnection() {
  return new Connection(NETWORK, "confirmed");
}

export function getProgram(wallet: any) {
  const connection = getConnection();
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  setProvider(provider);
  // TODO: cuando el IDL esté generado, quitar el cast a any y usar el tipo generado
  return new Program(IDL as any, provider);
}

// ─── PDAs ─────────────────────────────────────────────────────────────────

export function getWorldPDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(WORLD_SEED)],
    new PublicKey(PROGRAM_ID)
  );
}

export function getCharacterPDA(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(CHARACTER_SEED), owner.toBuffer()],
    new PublicKey(PROGRAM_ID)
  );
}

/**
 * Leaderboard PDA — v2 incluye el epoch como seed.
 * Cada epoch tiene su propio leaderboard — el histórico persiste.
 */
export function getLeaderboardPDA(epoch: number): [PublicKey, number] {
  const epochBuffer = Buffer.alloc(8);
  epochBuffer.writeBigUInt64LE(BigInt(epoch));
  return PublicKey.findProgramAddressSync(
    [Buffer.from(LEADERBOARD_SEED), epochBuffer],
    new PublicKey(PROGRAM_ID)
  );
}

// ─── Fetch helpers tipados ────────────────────────────────────────────────

export async function fetchWorldState(
  program: ReturnType<typeof getProgram>
): Promise<WorldState | null> {
  try {
    const [worldPDA] = getWorldPDA();
    const world = await (program.account as any).worldState.fetch(worldPDA);
    return {
      authority: world.authority.toBase58(),
      totalResources: Number(world.totalResources),
      resourcesCollected: Number(world.resourcesCollected),
      epoch: Number(world.epoch),
      startedAt: Number(world.startedAt),
      bump: world.bump,
    };
  } catch {
    return null;
  }
}

export async function fetchCharacter(
  program: ReturnType<typeof getProgram>,
  owner: PublicKey
): Promise<Character | null> {
  try {
    const [characterPDA] = getCharacterPDA(owner);
    const char = await (program.account as any).character.fetch(characterPDA);
    return {
      owner: char.owner.toBase58(),
      name: char.name,
      metadataUri: char.metadataUri,
      level: Number(char.level),
      resourcesCollected: Number(char.resourcesCollected),
      lastCollectTime: Number(char.lastCollectTime),
      bump: char.bump,
    };
  } catch {
    return null;
  }
}

export async function fetchLeaderboard(
  program: ReturnType<typeof getProgram>,
  epoch: number
): Promise<{ entries: WorldState extends null ? never : any[]; ready: boolean }> {
  try {
    const [leaderboardPDA] = getLeaderboardPDA(epoch);
    const lb = await (program.account as any).leaderboard.fetch(leaderboardPDA);
    return {
      entries: lb.entries.map((e: any) => ({
        owner: e.owner.toBase58(),
        name: e.name,
        resourcesCollected: Number(e.resourcesCollected),
        level: Number(e.level),
      })),
      ready: true,
    };
  } catch {
    return { entries: [], ready: false };
  }
}

/**
 * Fetch de todo el estado en una sola pasada.
 * Reemplaza los 3 fetches separados de v1.
 */
export async function fetchAllState(
  program: ReturnType<typeof getProgram>,
  owner: PublicKey
) {
  const world = await fetchWorldState(program);
  const [character, leaderboardResult] = await Promise.all([
    fetchCharacter(program, owner),
    world ? fetchLeaderboard(program, world.epoch) : Promise.resolve({ entries: [], ready: false }),
  ]);

  return {
    world,
    character,
    leaderboard: leaderboardResult.entries,
    leaderboardReady: leaderboardResult.ready,
  };
}
