// Tipos derivados del contrato Atlas v2
// Una vez que hagas `anchor build`, estos se pueden generar automáticamente
// desde target/types/atlas.ts y reemplazar este archivo.

export interface WorldState {
  authority: string;
  totalResources: number;
  resourcesCollected: number;
  epoch: number;
  startedAt: number;
  bump: number;
}

export interface Character {
  owner: string;
  name: string;
  metadataUri: string;
  level: number;
  resourcesCollected: number;
  lastCollectTime: number;
  bump: number;
}

export interface LeaderboardEntry {
  owner: string;
  name: string;
  resourcesCollected: number;
  level: number;
}

export interface Leaderboard {
  epoch: number;
  entries: LeaderboardEntry[];
  bump: number;
}

// Estado de la UI — lo que maneja page.tsx
export interface GameState {
  worldState: WorldState | null;
  character: Character | null;
  leaderboard: LeaderboardEntry[];
  leaderboardReady: boolean;
  epoch: number;
}

// Toast de transacción
export interface TxToast {
  id: number;
  signature: string;
  resourceType: number;
  points: number;
}

// Resultado de una recolecta
export interface CollectResult {
  signature: string;
  resourceType: number;
  points: number;
  newWorldState: WorldState;
  newCharacter: Character;
  newLeaderboard: LeaderboardEntry[];
  epochReset: boolean;
}

// Error tipado para mostrar al usuario
export interface AtlasError {
  code: number;
  message: string;
  raw?: unknown;
}
