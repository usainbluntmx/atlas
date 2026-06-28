import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Atlas } from "../../target/types/atlas";
import { expect } from "chai";
import { Keypair, SystemProgram } from "@solana/web3.js";

describe("collect_resource", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Atlas as Program<Atlas>;

  const player = Keypair.generate();

  let worldPDA: anchor.web3.PublicKey;
  let leaderboardPDA: anchor.web3.PublicKey;
  let characterPDA: anchor.web3.PublicKey;

  const getLeaderboardPDA = (epoch: number) =>
    anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("leaderboard"),
        new BN(epoch).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

  before(async () => {
    // Fondear player
    const sig = await provider.connection.requestAirdrop(
      player.publicKey,
      5 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    [worldPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("world")],
      program.programId
    );

    [leaderboardPDA] = getLeaderboardPDA(0);

    [characterPDA] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("character"), player.publicKey.toBuffer()],
      program.programId
    );

    // Inicializar mundo con pocos recursos para poder probar el reset
    await program.methods
      .initializeWorld(new BN(10))
      .accounts({
        world: worldPDA,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Inicializar leaderboard para epoch 0
    await program.methods
      .initializeLeaderboard()
      .accounts({
        world: worldPDA,
        leaderboard: leaderboardPDA,
        authority: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    // Mintear personaje
    await program.methods
      .mintCharacter("TestPlayer", "https://gateway.irys.xyz/test")
      .accounts({
        character: characterPDA,
        owner: player.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([player])
      .rpc();
  });

  it("suma puntos correctos para recurso Common (type 0, +1pt)", async () => {
    await program.methods
      .collectResource(0)
      .accounts({
        world: worldPDA,
        character: characterPDA,
        leaderboard: leaderboardPDA,
        owner: player.publicKey,
      })
      .signers([player])
      .rpc();

    const character = await program.account.character.fetch(characterPDA);
    expect(character.resourcesCollected.toNumber()).to.equal(1);
  });

  it("suma puntos correctos para recurso Rare (type 1, +3pts)", async () => {
    // Esperar cooldown (5 segundos en test — puede requerir sleep)
    await sleep(6000);

    const before = await program.account.character.fetch(characterPDA);
    const beforePts = before.resourcesCollected.toNumber();

    await program.methods
      .collectResource(1)
      .accounts({
        world: worldPDA,
        character: characterPDA,
        leaderboard: leaderboardPDA,
        owner: player.publicKey,
      })
      .signers([player])
      .rpc();

    const character = await program.account.character.fetch(characterPDA);
    expect(character.resourcesCollected.toNumber()).to.equal(beforePts + 3);
  });

  it("suma puntos correctos para recurso Epic (type 2, +5pts)", async () => {
    await sleep(6000);

    const before = await program.account.character.fetch(characterPDA);
    const beforePts = before.resourcesCollected.toNumber();

    await program.methods
      .collectResource(2)
      .accounts({
        world: worldPDA,
        character: characterPDA,
        leaderboard: leaderboardPDA,
        owner: player.publicKey,
      })
      .signers([player])
      .rpc();

    const character = await program.account.character.fetch(characterPDA);
    expect(character.resourcesCollected.toNumber()).to.equal(beforePts + 5);
  });

  it("falla si el cooldown no ha pasado", async () => {
    // Recolectar inmediatamente después — debe fallar
    try {
      await program.methods
        .collectResource(0)
        .accounts({
          world: worldPDA,
          character: characterPDA,
          leaderboard: leaderboardPDA,
          owner: player.publicKey,
        })
        .signers([player])
        .rpc();
      expect.fail("Debería haber fallado con CollectCooldown");
    } catch (err: any) {
      expect(err.error?.errorCode?.code).to.equal("CollectCooldown");
    }
  });

  it("actualiza last_collect_time después de recolectar", async () => {
    const character = await program.account.character.fetch(characterPDA);
    const now = Math.floor(Date.now() / 1000);
    expect(character.lastCollectTime.toNumber()).to.be.greaterThan(0);
    expect(character.lastCollectTime.toNumber()).to.be.lessThanOrEqual(now + 5);
  });

  it("calcula el level correctamente (1 + resources / 5)", async () => {
    const character = await program.account.character.fetch(characterPDA);
    const pts = character.resourcesCollected.toNumber();
    const expectedLevel = 1 + Math.floor(pts / 5);
    expect(character.level.toNumber()).to.equal(expectedLevel);
  });

  it("aparece en el leaderboard después de recolectar", async () => {
    const leaderboard = await program.account.leaderboard.fetch(leaderboardPDA);
    const entry = leaderboard.entries.find(
      (e) => e.owner.toBase58() === player.publicKey.toBase58()
    );
    expect(entry).to.not.be.undefined;
  });
});

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
