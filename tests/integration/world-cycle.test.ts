import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Atlas } from "../../target/types/atlas";
import { expect } from "chai";
import { Keypair, SystemProgram } from "@solana/web3.js";

/**
 * Test de ciclo de mundo: mundo se agota → evento WorldReset →
 * authority crea nuevo leaderboard → nuevo epoch.
 *
 * Usamos un mundo pequeño (3 recursos) para poder agotar rápido.
 */
describe("integration — world cycle y epoch reset", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Atlas as Program<Atlas>;

  const player = Keypair.generate();

  let worldPDA: anchor.web3.PublicKey;

  const getLeaderboardPDA = (epoch: number) =>
    anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("leaderboard"),
        new BN(epoch).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    )[0];

  const getCharPDA = (wallet: anchor.web3.PublicKey) =>
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("character"), wallet.toBuffer()],
      program.programId
    )[0];

  before(async () => {
    const sig = await provider.connection.requestAirdrop(
      player.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    [worldPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("world")],
      program.programId
    );

    // Mundo con solo 3 recursos para agotar rápido en tests
    await program.methods
      .initializeWorld(new BN(3))
      .accounts({
        world: worldPDA,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .initializeLeaderboard()
      .accounts({
        world: worldPDA,
        leaderboard: getLeaderboardPDA(0),
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    await program.methods
      .mintCharacter("Tester", "https://gateway.irys.xyz/tester")
      .accounts({
        character: getCharPDA(player.publicKey),
        owner: player.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player])
      .rpc();
  });

  it("el mundo empieza en epoch 0 con 3 recursos", async () => {
    const world = await program.account.worldState.fetch(worldPDA);
    expect(world.epoch.toNumber()).to.equal(0);
    expect(world.totalResources.toNumber()).to.equal(3);
    expect(world.resourcesCollected.toNumber()).to.equal(0);
  });

  it("recolectar cuando el mundo está agotado falla con WorldExhausted", async () => {
    // Recolectar los 3 recursos disponibles
    for (let i = 0; i < 3; i++) {
      if (i > 0) await sleep(6000); // Cooldown entre recolectas
      await program.methods
        .collectResource(0)
        .accounts({
          world: worldPDA,
          character: getCharPDA(player.publicKey),
          leaderboard: getLeaderboardPDA(0),
          owner: player.publicKey,
        })
        .signers([player])
        .rpc();
    }

    // El mundo debería estar agotado ahora
    await sleep(6000);

    try {
      await program.methods
        .collectResource(0)
        .accounts({
          world: worldPDA,
          character: getCharPDA(player.publicKey),
          leaderboard: getLeaderboardPDA(0),
          owner: player.publicKey,
        })
        .signers([player])
        .rpc();
      expect.fail("Debería haber fallado con WorldExhausted");
    } catch (err: any) {
      expect(err.error?.errorCode?.code).to.equal("WorldExhausted");
    }
  });

  it("el leaderboard del epoch 0 persiste después del agotamiento", async () => {
    // El leaderboard epoch 0 sigue existiendo con los scores históricos
    const leaderboard = await program.account.leaderboard.fetch(
      getLeaderboardPDA(0)
    );
    expect(leaderboard.entries.length).to.be.greaterThan(0);
    expect(leaderboard.epoch.toNumber()).to.equal(0);
  });
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
