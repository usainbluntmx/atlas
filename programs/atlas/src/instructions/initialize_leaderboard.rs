use anchor_lang::prelude::*;
use crate::state::{WorldState, Leaderboard};
use crate::errors::AtlasError;

/// Crea el leaderboard para el epoch actual del mundo.
/// Debe llamarse después de initialize_world (epoch 0) y después
/// de cada reset automático que ocurre en collect_resource.
pub fn handler(ctx: Context<InitializeLeaderboard>) -> Result<()> {
    let world = &ctx.accounts.world;
    let leaderboard = &mut ctx.accounts.leaderboard;

    leaderboard.epoch = world.epoch;
    leaderboard.entries = Vec::new();
    leaderboard.bump = ctx.bumps.leaderboard;

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeLeaderboard<'info> {
    #[account(
        seeds = [b"world"],
        bump = world.bump
    )]
    pub world: Account<'info, WorldState>,

    #[account(
        init,
        payer = authority,
        space = 8 + Leaderboard::INIT_SPACE,
        seeds = [b"leaderboard", world.epoch.to_le_bytes().as_ref()],
        bump,
        constraint = world.authority == authority.key() @ AtlasError::Unauthorized
    )]
    pub leaderboard: Account<'info, Leaderboard>,

    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
