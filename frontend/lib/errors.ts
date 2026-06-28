import { ANCHOR_ERRORS } from "./constants";
import type { AtlasError } from "./types";

/**
 * Convierte cualquier error de Anchor/Solana en un mensaje legible para el usuario.
 * Nunca muestra "something went wrong" — siempre dice qué pasó.
 */
export function parseError(err: unknown): AtlasError {
  // Error de Anchor con código tipado
  if (isAnchorError(err)) {
    const code = err.error?.errorCode?.number;
    if (code !== undefined && ANCHOR_ERRORS[code]) {
      return { code, message: ANCHOR_ERRORS[code], raw: err };
    }
    // Error de Anchor sin código reconocido — usar el mensaje del contrato
    const msg = err.error?.errorMessage ?? err.message;
    return { code: -1, message: msg ?? "Error del programa", raw: err };
  }

  // Error de Solana (RPC, red, etc.)
  if (err instanceof Error) {
    if (err.message.includes("insufficient funds")) {
      return { code: -2, message: "SOL insuficiente para pagar la transacción", raw: err };
    }
    if (err.message.includes("User rejected")) {
      return { code: -3, message: "Transacción rechazada por el usuario", raw: err };
    }
    if (err.message.includes("blockhash")) {
      return { code: -4, message: "Timeout de red — intenta de nuevo", raw: err };
    }
    if (err.message.includes("already in use")) {
      return { code: -5, message: "Esta cuenta ya existe", raw: err };
    }
    return { code: -1, message: err.message, raw: err };
  }

  return { code: -1, message: "Error desconocido — revisa la consola", raw: err };
}

// Type guard para errores de Anchor
function isAnchorError(err: unknown): err is {
  error?: { errorCode?: { number?: number }; errorMessage?: string };
  message?: string;
} {
  return typeof err === "object" && err !== null && "error" in err;
}
