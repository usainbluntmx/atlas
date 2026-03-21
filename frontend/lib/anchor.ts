import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { NETWORK, PROGRAM_ID } from "./constants";

export const IDL = {
    address: "J5qe5PAK9XHLqbLmfxZ7BN1xFsPxYRKaxMc9qhw9fNxi",
    metadata: { name: "atlas", version: "0.1.0", spec: "0.1.0", description: "Created with Anchor" },
    instructions: [
        {
            name: "collect_resource",
            discriminator: [159, 214, 149, 89, 188, 3, 225, 68],
            accounts: [
                { name: "world", writable: true, pda: { seeds: [{ kind: "const", value: [119, 111, 114, 108, 100] }] } },
                { name: "character", writable: true, pda: { seeds: [{ kind: "const", value: [99, 104, 97, 114, 97, 99, 116, 101, 114] }, { kind: "account", path: "owner" }] } },
                { name: "leaderboard", writable: true, pda: { seeds: [{ kind: "const", value: [108, 101, 97, 100, 101, 114, 98, 111, 97, 114, 100] }] } },
                { name: "owner", signer: true },
            ],
            args: [{ name: "resource_type", type: "u8" }],
        },
        {
            name: "initialize_leaderboard",
            discriminator: [47, 23, 34, 39, 46, 108, 91, 176],
            accounts: [
                { name: "leaderboard", writable: true, pda: { seeds: [{ kind: "const", value: [108, 101, 97, 100, 101, 114, 98, 111, 97, 114, 100] }] } },
                { name: "authority", writable: true, signer: true },
                { name: "system_program", address: "11111111111111111111111111111111" },
            ],
            args: [],
        },
        {
            name: "initialize_world",
            discriminator: [201, 71, 49, 97, 235, 16, 107, 186],
            accounts: [
                { name: "world", writable: true, pda: { seeds: [{ kind: "const", value: [119, 111, 114, 108, 100] }] } },
                { name: "authority", writable: true, signer: true },
                { name: "system_program", address: "11111111111111111111111111111111" },
            ],
            args: [],
        },
        {
            name: "mint_character",
            discriminator: [127, 29, 52, 229, 72, 194, 255, 67],
            accounts: [
                { name: "character", writable: true, pda: { seeds: [{ kind: "const", value: [99, 104, 97, 114, 97, 99, 116, 101, 114] }, { kind: "account", path: "owner" }] } },
                { name: "owner", writable: true, signer: true },
                { name: "system_program", address: "11111111111111111111111111111111" },
            ],
            args: [
                { name: "name", type: "string" },
                { name: "metadata_uri", type: "string" },
            ],
        },
    ],
    accounts: [
        { name: "Character", discriminator: [140, 115, 165, 36, 241, 153, 102, 84] },
        { name: "Leaderboard", discriminator: [247, 186, 238, 243, 194, 30, 9, 36] },
        { name: "WorldState", discriminator: [23, 119, 204, 118, 21, 87, 11, 102] },
    ],
    errors: [
        { code: 6000, name: "NameTooLong", msg: "El nombre no puede superar 32 caracteres" },
        { code: 6001, name: "UriTooLong", msg: "El URI no puede superar 200 caracteres" },
        { code: 6002, name: "NoResourcesLeft", msg: "No quedan recursos en el mundo" },
        { code: 6003, name: "NotOwner", msg: "No eres el dueño de este personaje" },
    ],
    types: [
        {
            name: "WorldState",
            type: {
                kind: "struct",
                fields: [
                    { name: "authority", type: "pubkey" },
                    { name: "total_resources", type: "u64" },
                    { name: "resources_collected", type: "u64" },
                    { name: "bump", type: "u8" },
                ],
            },
        },
        {
            name: "Leaderboard",
            type: {
                kind: "struct",
                fields: [
                    { name: "entries", type: { vec: { defined: { name: "LeaderboardEntry" } } } },
                    { name: "bump", type: "u8" },
                ],
            },
        },
        {
            name: "LeaderboardEntry",
            type: {
                kind: "struct",
                fields: [
                    { name: "owner", type: "pubkey" },
                    { name: "name", type: "string" },
                    { name: "resources_collected", type: "u64" },
                    { name: "level", type: "u64" },
                ],
            },
        },
        {
            name: "Character",
            type: {
                kind: "struct",
                fields: [
                    { name: "owner", type: "pubkey" },
                    { name: "name", type: "string" },
                    { name: "metadata_uri", type: "string" },
                    { name: "level", type: "u64" },
                    { name: "resources_collected", type: "u64" },
                    { name: "bump", type: "u8" },
                ],
            },
        },
    ],
} as const;

export function getConnection() {
    return new Connection(NETWORK, "confirmed");
}

export function getProgram(wallet: any) {
    const connection = getConnection();
    const provider = new AnchorProvider(connection, wallet, {
        commitment: "confirmed",
    });
    setProvider(provider);
    return new Program(IDL as any, provider);
}

export function getWorldPDA(programId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("world")],
        programId
    );
}

export function getCharacterPDA(
    owner: PublicKey,
    programId: PublicKey
): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("character"), owner.toBuffer()],
        programId
    );
}

export function getLeaderboardPDA(programId: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
        [Buffer.from("leaderboard")],
        programId
    );
}