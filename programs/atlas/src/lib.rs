use anchor_lang::prelude::*;

declare_id!("J5qe5PAK9XHLqbLmfxZ7BN1xFsPxYRKaxMc9qhw9fNxi");

#[program]
pub mod atlas {
    use super::*;

    pub fn initialize_world(ctx: Context<InitializeWorld>) -> Result<()> {
        let world = &mut ctx.accounts.world;
        world.authority = ctx.accounts.authority.key();
        world.total_resources = 100;
        world.resources_collected = 0;
        world.bump = ctx.bumps.world;
        Ok(())
    }

    pub fn mint_character(ctx: Context<MintCharacter>, name: String, metadata_uri: String) -> Result<()> {
        require!(name.len() <= 32, AtlasError::NameTooLong);
        require!(metadata_uri.len() <= 200, AtlasError::UriTooLong);

        let character = &mut ctx.accounts.character;
        character.owner = ctx.accounts.owner.key();
        character.name = name;
        character.metadata_uri = metadata_uri;
        character.level = 1;
        character.resources_collected = 0;
        character.bump = ctx.bumps.character;
        Ok(())
    }

    pub fn collect_resource(ctx: Context<CollectResource>) -> Result<()> {
        let world = &mut ctx.accounts.world;
        let character = &mut ctx.accounts.character;

        require!(
            world.resources_collected < world.total_resources,
            AtlasError::NoResourcesLeft
        );

        require!(
            character.owner == ctx.accounts.owner.key(),
            AtlasError::NotOwner
        );

        world.resources_collected += 1;
        character.resources_collected += 1;
        character.level = 1 + (character.resources_collected / 5);

        Ok(())
    }
}

// --- Contexts ---

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

#[derive(Accounts)]
pub struct MintCharacter<'info> {
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

#[derive(Accounts)]
pub struct CollectResource<'info> {
    #[account(
        mut,
        seeds = [b"world"],
        bump = world.bump
    )]
    pub world: Account<'info, WorldState>,
    #[account(
        mut,
        seeds = [b"character", owner.key().as_ref()],
        bump = character.bump
    )]
    pub character: Account<'info, Character>,
    pub owner: Signer<'info>,
}

// --- Accounts ---

#[account]
#[derive(InitSpace)]
pub struct WorldState {
    pub authority: Pubkey,
    pub total_resources: u64,
    pub resources_collected: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Character {
    pub owner: Pubkey,
    #[max_len(32)]
    pub name: String,
    #[max_len(200)]
    pub metadata_uri: String,
    pub level: u64,
    pub resources_collected: u64,
    pub bump: u8,
}

// --- Errors ---

#[error_code]
pub enum AtlasError {
    #[msg("El nombre no puede superar 32 caracteres")]
    NameTooLong,
    #[msg("El URI no puede superar 200 caracteres")]
    UriTooLong,
    #[msg("No quedan recursos en el mundo")]
    NoResourcesLeft,
    #[msg("No eres el dueño de este personaje")]
    NotOwner,
}