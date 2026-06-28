import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Atlas } from "../../target/types/atlas";
import { expect } from "chai";
import { Keypair, SystemProgram } from "@solana/web3.js";

/**
 * Test de integración: 3 wallets jugando simultáneamente.
 * Verifica que el leaderboard refleja el orden correcto
 * y que los puntos de cada tipo de recurso son correctos.
 */
describe("integration — full gameplay con 3 jugadores", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Atlas as Program<Atlas>;

  const playerA = Keypair.generate(); // Colectará más recursos
  const playerB = Keypair.generate();
  const playerC = Keypair.generate();

  let worldPDA: anchor.web3.PublicKey;
  let leaderboardPDA: anchor.web3.PublicKey;

  const getCharPDA = (wallet: anchor.web3.PublicKey) =>
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("character"), wallet.toBuffer()],
      program.programId
    )[0];

  const getLeaderboardPDA = (epoch: number) =>
    anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("leaderboard"),
        new BN(epoch).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    )[0];

  before(async () => {
    // Fondear los 3 jugadores
    for (const player of [playerA, playerB, playerC]) {
      const sig = await provider.connection.requestAirdrop(
        player.publicKey,
        3 * anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    }

    [worldPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("world")],
      program.programId
    );
    leaderboardPDA = getLeaderboardPDA(0);

    // Inicializar mundo (500 recursos)
    await program.methods
      .initializeWorld(new BN(500))
      .accounts({
        world: worldPDA,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Inicializar leaderboard
    await program.methods
      .initializeLeaderboard()
      .accounts({
        world: worldPDA,
        leaderboard: leaderboardPDA,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Mintear personajes
    for (const [player, name] of [
      [playerA, "Atlas"],
      [playerB, "Nova"],
      [playerC, "Zeta"],
    ] as [Keypair, string][]) {
      await program.methods
        .mintCharacter(name, `https://gateway.irys.xyz/${name.toLowerCase()}`)
        .accounts({
          character: getCharPDA(player.publicKey),
          owner: player.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([player])
        .rpc();
    }
  });

  it("3 jugadores recolectan recursos y aparecen en el leaderboard", async () => {
    // PlayerA recolecta 1 Epic (+5pts)
    await program.methods
      .collectResource(2)
      .accounts({
        world: worldPDA,
        character: getCharPDA(playerA.publicKey),
        leaderboard: leaderboardPDA,
        owner: playerA.publicKey,
      })
      .signers([playerA])
      .rpc();

    await sleep(6000);

    // PlayerB recolecta 1 Rare (+3pts)
    await program.methods
      .collectResource(1)
      .accounts({
        world: worldPDA,
        character: getCharPDA(playerB.publicKey),
        leaderboard: leaderboardPDA,
        owner: playerB.publicKey,
      })
      .signers([playerB])
      .rpc();

    await sleep(6000);

    // PlayerC recolecta 1 Common (+1pt)
    await program.methods
      .collectResource(0)
      .accounts({
        world: worldPDA,
        character: getCharPDA(playerC.publicKey),
        leaderboard: leaderboardPDA,
        owner: playerC.publicKey,
      })
      .signers([playerC])
      .rpc();

    const leaderboard = await program.account.leaderboard.fetch(leaderboardPDA);

    // Verificar que hay 3 entradas
    expect(leaderboard.entries).to.have.lengthOf(3);

    // Verificar orden: A (5pts) > B (3pts) > C (1pt)
    expect(leaderboard.entries[0].owner.toBase58()).to.equal(
      playerA.publicKey.toBase58()
    );
    expect(leaderboard.entries[1].owner.toBase58()).to.equal(
      playerB.publicKey.toBase58()
    );
    expect(leaderboard.entries[2].owner.toBase58()).to.equal(
      playerC.publicKey.toBase58()
    );

    // Verificar puntos
    expect(leaderboard.entries[0].resourcesCollected.toNumber()).to.equal(5);
    expect(leaderboard.entries[1].resourcesCollected.toNumber()).to.equal(3);
    expect(leaderboard.entries[2].resourcesCollected.toNumber()).to.equal(1);
  });

  it("el orden del leaderboard se actualiza cuando un jugador supera a otro", async () => {
    await sleep(6000);

    // PlayerC recolecta 2 Epics consecutivos (con cooldown) → 1 + 5 + 5 = 11pts total
    await program.methods
      .collectResource(2) // +5
      .accounts({
        world: worldPDA,
        character: getCharPDA(playerC.publicKey),
        leaderboard: leaderboardPDA,
        owner: playerC.publicKey,
      })
      .signers([playerC])
      .rpc();

    await sleep(6000);

    await program.methods
      .collectResource(2) // +5
      .accounts({
        world: worldPDA,
        character: getCharPDA(playerC.publicKey),
        leaderboard: leaderboardPDA,
        owner: playerC.publicKey,
      })
      .signers([playerC])
      .rpc();

    const leaderboard = await program.account.leaderboard.fetch(leaderboardPDA);

    // PlayerC ahora tiene 11pts — debe estar primero
    expect(leaderboard.entries[0].owner.toBase58()).to.equal(
      playerC.publicKey.toBase58()
    );
    expect(leaderboard.entries[0].resourcesCollected.toNumber()).to.equal(11);
  });

  it("el progreso del mundo aumenta con cada recolecta", async () => {
    const world = await program.account.worldState.fetch(worldPDA);
    // 5 recolectas en total en esta suite
    expect(world.resourcesCollected.toNumber()).to.be.greaterThan(0);
  });
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
