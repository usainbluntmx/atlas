use anchor_lang::prelude::*;
use crate::state::WorldState;

/// Crea el mundo compartido para el epoch 0.
/// Solo puede llamarse una vez — para resets posteriores el mundo
/// se reinicia automáticamente dentro de collect_resource.
pub fn handler(ctx: Context<InitializeWorld>, total_resources: u64) -> Result<()> {
    let world = &mut ctx.accounts.world;
    let clock = Clock::get()?;

    world.authority = ctx.accounts.authority.key();
    world.total_resources = total_resources;
    world.resources_collected = 0;
    world.epoch = 0;
    world.started_at = clock.unix_timestamp;
    world.bump = ctx.bumps.world;

    emit!(crate::events::WorldInitialized {
        authority: world.authority,
        total_resources,
        epoch: 0,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeWorld<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + WorldState::INIT_SPACE,
        seeds = [b"world"],
        bump
    )]
    pub world: Account<'info, WorldState>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}
