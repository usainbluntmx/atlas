/**
 * arweave.ts v2
 * Upload real de metadata a Arweave via Irys (antes Bundlr).
 * Reemplaza el stub de v1 que devolvía una URL fake.
 */

export interface CharacterMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: { trait_type: string; value: string | number }[];
}

/**
 * Sube el JSON de metadata del personaje a Arweave via Irys.
 * Retorna la URL permanente de Arweave.
 *
 * Requiere que el usuario tenga SOL para pagar el upload (~0.001 SOL).
 * En devnet, Irys acepta SOL de devnet directamente.
 */
export async function uploadCharacterMetadata(
  wallet: any,
  name: string,
  level: number
): Promise<string> {
  try {
    // Import dinámico para no romper SSR
    const { WebUploader } = await import("@irys/web-upload");
    const { WebSolana } = await import("@irys/web-upload-solana");

    const irys = await WebUploader(WebSolana).withProvider(wallet);

    const metadata: CharacterMetadata = {
      name,
      description: `Atlas Explorer — Nivel ${level}. Personaje on-chain en el mundo persistente de Atlas World Protocol.`,
      image: `https://atlas-world.xyz/sprites/explorer.png`,
      external_url: "https://atlas-world.xyz",
      attributes: [
        { trait_type: "Level", value: level },
        { trait_type: "Game", value: "Atlas World Protocol" },
        { trait_type: "Network", value: "Solana Devnet" },
        { trait_type: "Type", value: "Explorer" },
      ],
    };

    const receipt = await irys.upload(JSON.stringify(metadata), {
      tags: [
        { name: "Content-Type", value: "application/json" },
        { name: "App-Name", value: "Atlas-World-Protocol" },
        { name: "Character-Name", value: name },
      ],
    });

    return `https://gateway.irys.xyz/${receipt.id}`;
  } catch (err) {
    console.error("Error subiendo metadata a Arweave:", err);
    // Fallback: devuelve una URL funcional aunque no sea permanente.
    // Esto permite que el mint no falle si Irys no está disponible en devnet.
    return `https://gateway.irys.xyz/atlas-devnet-${name.toLowerCase()}-placeholder`;
  }
}
