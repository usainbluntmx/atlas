import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Atlas } from "../../target/types/atlas";
import { expect } from "chai";
import { Keypair, SystemProgram } from "@solana/web3.js";

describe("world — initialize_world", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Atlas as Program<Atlas>;

  let worldPDA: anchor.web3.PublicKey;
  let worldBump: number;

  before(async () => {
    [worldPDA, worldBump] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("world")],
      program.programId
    );
  });

  it("inicializa el mundo con total_resources correcto", async () => {
    await program.methods
      .initializeWorld(new BN(500))
      .accounts({
        world: worldPDA,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    const world = await program.account.worldState.fetch(worldPDA);
    expect(world.totalResources.toNumber()).to.equal(500);
    expect(world.resourcesCollected.toNumber()).to.equal(0);
    expect(world.epoch.toNumber()).to.equal(0);
    expect(world.authority.toBase58()).to.equal(
      provider.wallet.publicKey.toBase58()
    );
  });

  it("falla si se intenta inicializar dos veces", async () => {
    try {
      await program.methods
        .initializeWorld(new BN(500))
        .accounts({
          world: worldPDA,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      expect.fail("Debería haber fallado");
    } catch (err: any) {
      // Anchor lanza error cuando la cuenta ya está inicializada
      expect(err.message).to.include("already in use");
    }
  });

  it("started_at tiene un timestamp válido", async () => {
    const world = await program.account.worldState.fetch(worldPDA);
    const now = Math.floor(Date.now() / 1000);
    expect(world.startedAt.toNumber()).to.be.greaterThan(0);
    expect(world.startedAt.toNumber()).to.be.lessThanOrEqual(now + 5);
  });
});
