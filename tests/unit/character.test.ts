import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Atlas } from "../../target/types/atlas";
import { expect } from "chai";
import { Keypair, SystemProgram } from "@solana/web3.js";

describe("character — mint_character", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Atlas as Program<Atlas>;

  // Wallet secundaria para tests de duplicado
  const playerB = Keypair.generate();

  const getCharacterPDA = (wallet: anchor.web3.PublicKey) =>
    anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("character"), wallet.toBuffer()],
      program.programId
    );

  before(async () => {
    // Fondear playerB con SOL para pagar rent
    const sig = await provider.connection.requestAirdrop(
      playerB.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);
  });

  it("mintea un personaje con nombre y URI válidos", async () => {
    const [charPDA] = getCharacterPDA(playerB.publicKey);

    await program.methods
      .mintCharacter(
        "Zara",
        "https://gateway.irys.xyz/fake-test-uri"
      )
      .accounts({
        character: charPDA,
        owner: playerB.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([playerB])
      .rpc();

    const character = await program.account.character.fetch(charPDA);
    expect(character.name).to.equal("Zara");
    expect(character.level.toNumber()).to.equal(1);
    expect(character.resourcesCollected.toNumber()).to.equal(0);
    expect(character.owner.toBase58()).to.equal(playerB.publicKey.toBase58());
  });

  it("falla si el nombre supera 32 caracteres", async () => {
    const anotherPlayer = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      anotherPlayer.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    const [charPDA] = getCharacterPDA(anotherPlayer.publicKey);
    const longName = "A".repeat(33); // 33 chars — debe fallar

    try {
      await program.methods
        .mintCharacter(longName, "https://gateway.irys.xyz/test")
        .accounts({
          character: charPDA,
          owner: anotherPlayer.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([anotherPlayer])
        .rpc();
      expect.fail("Debería haber fallado con NameTooLong");
    } catch (err: any) {
      expect(err.error?.errorCode?.code).to.equal("NameTooLong");
    }
  });

  it("falla si la wallet intenta mintear un segundo personaje", async () => {
    // playerB ya tiene personaje — intentar mintear otro debe fallar
    const [charPDA] = getCharacterPDA(playerB.publicKey);

    try {
      await program.methods
        .mintCharacter("ZaraV2", "https://gateway.irys.xyz/other")
        .accounts({
          character: charPDA,
          owner: playerB.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([playerB])
        .rpc();
      expect.fail("Debería haber fallado — cuenta ya existe");
    } catch (err: any) {
      expect(err.message).to.include("already in use");
    }
  });

  it("last_collect_time inicia en 0", async () => {
    const [charPDA] = getCharacterPDA(playerB.publicKey);
    const character = await program.account.character.fetch(charPDA);
    expect(character.lastCollectTime.toNumber()).to.equal(0);
  });
});
