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

    pub fn initialize_leaderboard(ctx: Context<InitializeLeaderboard>) -> Result<()> {
        let leaderboard = &mut ctx.accounts.leaderboard;
        leaderboard.entries = Vec::new();
        leaderboard.bump = ctx.bumps.leaderboard;
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

    pub fn collect_resource(ctx: Context<CollectResource>, resource_type: u8) -> Result<()> {
        let world = &mut ctx.accounts.world;
        let character = &mut ctx.accounts.character;
        let leaderboard = &mut ctx.accounts.leaderboard;

        require!(
            world.resources_collected < world.total_resources,
            AtlasError::NoResourcesLeft
        );

        require!(
            character.owner == ctx.accounts.owner.key(),
            AtlasError::NotOwner
        );

        let _points: u64 = match resource_type {
            1 => 3,
            2 => 5,
            _ => 1,
        };

        world.resources_collected += 1;
        character.resources_collected += 1;
        character.level = 1 + (character.resources_collected / 5);

        // Update leaderboard
        let owner = ctx.accounts.owner.key();
        let name = character.name.clone();
        let collected = character.resources_collected;
        let level = character.level;

        if let Some(entry) = leaderboard.entries.iter_mut().find(|e| e.owner == owner) {
            entry.resources_collected = collected;
            entry.level = level;
        } else {
            if leaderboard.entries.len() < 10 {
                leaderboard.entries.push(LeaderboardEntry {
                    owner,
                    name,
                    resources_collected: collected,
                    level,
                });
            } else {
                // Replace lowest if current is higher
                if let Some(min_entry) = leaderboard.entries.iter_mut().min_by_key(|e| e.resources_collected) {
                    if collected > min_entry.resources_collected {
                        *min_entry = LeaderboardEntry {
                            owner,
                            name,
                            resources_collected: collected,
                            level,
                        };
                    }
                }
            }
        }

        // Sort descending
        leaderboard.entries.sort_by(|a, b| b.resources_collected.cmp(&a.resources_collected));

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
pub struct InitializeLeaderboard<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Leaderboard::INIT_SPACE,
        seeds = [b"leaderboard"],
        bump
    )]
    pub leaderboard: Account<'info, Leaderboard>,
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
    #[account(
        mut,
        seeds = [b"leaderboard"],
        bump = leaderboard.bump
    )]
    pub leaderboard: Account<'info, Leaderboard>,
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
pub struct Leaderboard {
    #[max_len(10)]
    pub entries: Vec<LeaderboardEntry>,
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

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct LeaderboardEntry {
    pub owner: Pubkey,
    #[max_len(32)]
    pub name: String,
    pub resources_collected: u64,
    pub level: u64,
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