export async function uploadCharacterMetadata(
    _wallet: any,
    name: string,
    level: number
): Promise<string> {
    const base = `https://arweave.net/atlas-${name}-lvl${level}`.slice(0, 80);
    return base;
}