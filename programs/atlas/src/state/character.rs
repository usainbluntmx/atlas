use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Character {
    pub owner: Pubkey,
    #[max_len(32)]
    pub name: String,
    /// URI a metadata en Arweave (subido con Irys antes de llamar mint_character)
    #[max_len(200)]
    pub metadata_uri: String,
    pub level: u64,
    /// Recursos acumulados en el epoch actual
    pub resources_collected: u64,
    /// Unix timestamp de la última recolecta — cooldown anti-bot on-chain
    pub last_collect_time: i64,
    pub bump: u8,
}
