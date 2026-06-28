use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct WorldState {
    /// Wallet que inicializó el mundo (puede llamar funciones admin)
    pub authority: Pubkey,
    /// Recursos totales disponibles en este epoch (configurable al inicializar)
    pub total_resources: u64,
    /// Recursos recolectados en el epoch actual
    pub resources_collected: u64,
    /// ID del epoch actual — incrementa con cada reset del mundo
    pub epoch: u64,
    /// Unix timestamp cuando inició el epoch actual
    pub started_at: i64,
    pub bump: u8,
}
