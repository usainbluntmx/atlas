import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Atlas } from "../../target/types/atlas";
import { expect } from "chai";
import { Keypair, SystemProgram } from "@solana/web3.js";

describe("leaderboard", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Atlas as Program<Atlas>;

  let worldPDA: anchor.web3.PublicKey;
  let leaderboardPDA: anchor.web3.PublicKey;

  const getLeaderboardPDA = (epoch: number) =>
    anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("leaderboard"),
        new BN(epoch).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

  before(async () => {
    [worldPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("world")],
      program.programId
    );
    [leaderboardPDA] = getLeaderboardPDA(0);
  });

  it("inicia vacío en el epoch 0", async () => {
    const leaderboard = await program.account.leaderboard.fetch(leaderboardPDA);
    expect(leaderboard.entries).to.have.lengthOf(0);
    expect(leaderboard.epoch.toNumber()).to.equal(0);
  });

  it("las entradas están ordenadas de mayor a menor score", async () => {
    const leaderboard = await program.account.leaderboard.fetch(leaderboardPDA);
    for (let i = 0; i < leaderboard.entries.length - 1; i++) {
      expect(
        leaderboard.entries[i].resourcesCollected.toNumber()
      ).to.be.greaterThanOrEqual(
        leaderboard.entries[i + 1].resourcesCollected.toNumber()
      );
    }
  });

  it("tiene máximo 25 entradas", async () => {
    const leaderboard = await program.account.leaderboard.fetch(leaderboardPDA);
    expect(leaderboard.entries.length).to.be.at.most(25);
  });

  it("el epoch del leaderboard coincide con el mundo", async () => {
    const world = await program.account.worldState.fetch(worldPDA);
    const leaderboard = await program.account.leaderboard.fetch(leaderboardPDA);
    expect(leaderboard.epoch.toNumber()).to.equal(world.epoch.toNumber());
  });
});
