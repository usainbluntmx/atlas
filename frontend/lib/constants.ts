export const PROGRAM_ID = "Baq3gzFF1oyCHZCDZ6ic8E28KQAJwyob3hJQRskqK7RV";
export const NETWORK = "https://api.devnet.solana.com";

// PDA seeds
export const WORLD_SEED = "world";
export const CHARACTER_SEED = "character";
export const LEADERBOARD_SEED = "leaderboard";

// Game config
export const COLLECT_COOLDOWN_MS = 5_000;        // debe coincidir con el contrato (5s)
export const EPOCH_MAX_DURATION_SECONDS = 604_800; // 7 días
export const TOTAL_RESOURCES = 500;

// Puntos por tipo de recurso — deben coincidir con el contrato
export const RESOURCE_POINTS: Record<number, number> = {
  0: 1, // Common
  1: 3, // Rare
  2: 5, // Epic
};

// Traducción de error codes de Anchor al español
export const ANCHOR_ERRORS: Record<number, string> = {
  6000: "Nombre demasiado largo (máximo 32 caracteres)",
  6001: "El URI no puede superar 200 caracteres",
  6002: "No eres el dueño de este personaje",
  6003: "Espera 5 segundos antes de recolectar de nuevo",
  6004: "El mundo está agotado — espera el reset",
  6005: "Solo el authority puede ejecutar esta acción",
  6006: "Error de epoch — recarga la página",
};
