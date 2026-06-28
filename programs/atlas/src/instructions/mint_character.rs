use anchor_lang::prelude::*;
use crate::state::Character;
use crate::errors::AtlasError;

/// Mintea un personaje único por wallet.
/// El metadata_uri debe apuntar a un JSON ya subido a Arweave via Irys
/// antes de llamar esta instrucción desde el frontend.
pub fn handler(ctx: Context<MintCharacter>, name: String, metadata_uri: String) -> Result<()> {
    require!(name.len() <= 32, AtlasError::NameTooLong);
    require!(metadata_uri.len() <= 200, AtlasError::UriTooLong);

    let character = &mut ctx.accounts.character;

    character.owner = ctx.accounts.owner.key();
    character.name = name.clone();
    character.metadata_uri = metadata_uri.clone();
    character.level = 1;
    character.resources_collected = 0;
    character.last_collect_time = 0; // Sin cooldown inicial
    character.bump = ctx.bumps.character;

    emit!(crate::events::CharacterMinted {
        owner: character.owner,
        name,
        metadata_uri,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct MintCharacter<'info> {
    /// CHECK: PDA con seeds [b"character", owner] — si ya existe, init falla
    /// automáticamente (constraint de Anchor), lo que previene duplicados.
    #[account(
        init,
        payer = owner,
        space = 8 + Character::INIT_SPACE,
        seeds = [b"character", owner.key().as_ref()],
        bump
    )]
    pub character: Account<'info, Character>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}
