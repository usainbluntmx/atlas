use anchor_lang::prelude::*;
use crate::state::{WorldState, Character, Leaderboard, LeaderboardEntry};
use crate::errors::AtlasError;

/// Cooldown mínimo entre recolectas: 5 segundos on-chain.
/// El frontend puede mostrar un timer, pero el contrato es la fuente de verdad.
const COLLECT_COOLDOWN_SECONDS: i64 = 5;

/// Duración máxima de un epoch: 7 días en segundos.
const EPOCH_MAX_DURATION_SECONDS: i64 = 7 * 24 * 60 * 60; // 604_800

pub fn handler(ctx: Context<CollectResource>, resource_type: u8) -> Result<()> {
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    // --- 1. Verificar cooldown on-chain ---
    {
        let character = &ctx.accounts.character;
        require!(
            now >= character.last_collect_time + COLLECT_COOLDOWN_SECONDS,
            AtlasError::CollectCooldown
        );
    }

    // --- 2. Verificar que el mundo no esté agotado ---
    {
        let world = &ctx.accounts.world;
        require!(
            world.resources_collected < world.total_resources,
            AtlasError::WorldExhausted
        );
    }

    // --- 3. Calcular puntos según tipo de recurso ---
    // FIX v1: _points se calculaba pero nunca se usaba.
    // Ahora los puntos reales se suman al character.
    let points: u64 = match resource_type {
        1 => 3, // Rare
        2 => 5, // Epic
        _ => 1, // Common (type 0 o cualquier otro)
    };

    // --- 4. Actualizar estado del mundo ---
    let world_progress;
    let epoch_ended;
    {
        let world = &mut ctx.accounts.world;
        world.resources_collected += 1;
        world_progress = world.resources_collected;

        // El epoch termina si: mundo agotado O han pasado 7 días
        let world_exhausted = world.resources_collected >= world.total_resources;
        let time_expired = now >= world.started_at + EPOCH_MAX_DURATION_SECONDS;
        epoch_ended = world_exhausted || time_expired;
    }

    // --- 5. Actualizar character ---
    let collected;
    let level;
    let owner;
    let name;
    {
        let character = &mut ctx.accounts.character;
        character.resources_collected += points; // Suma puntos reales, no solo 1
        character.level = 1 + (character.resources_collected / 5);
        character.last_collect_time = now;

        collected = character.resources_collected;
        level = character.level;
        owner = character.owner;
        name = character.name.clone();
    }

    // --- 6. Verificar que el leaderboard pertenece al epoch actual ---
    {
        let world = &ctx.accounts.world;
        let leaderboard = &ctx.accounts.leaderboard;
        require!(
            leaderboard.epoch == world.epoch,
            AtlasError::EpochMismatch
        );
    }

    // --- 7. Actualizar leaderboard con inserción eficiente ---
    // Si la wallet ya está en el leaderboard: actualiza en O(n).
    // Si no está: inserta o reemplaza al mínimo si hay espacio/mérito.
    // Sin sort completo — mantenemos orden con búsqueda del punto de inserción.
    {
        let leaderboard = &mut ctx.accounts.leaderboard;

        if let Some(entry) = leaderboard.entries.iter_mut().find(|e| e.owner == owner) {
            // Wallet ya existe — actualizar
            entry.resources_collected = collected;
            entry.level = level;
        } else {
            let new_entry = LeaderboardEntry {
                owner,
                name,
                resources_collected: collected,
                level,
            };

            if leaderboard.entries.len() < 25 {
                // Hay espacio — insertar en posición correcta (ordered insert)
                let pos = leaderboard.entries
                    .iter()
                    .position(|e| e.resources_collected < collected)
                    .unwrap_or(leaderboard.entries.len());
                leaderboard.entries.insert(pos, new_entry);
            } else {
                // Leaderboard lleno — reemplazar solo si supera al último
                let last = leaderboard.entries.last().unwrap();
                if collected > last.resources_collected {
                    *leaderboard.entries.last_mut().unwrap() = new_entry;
                    // Re-ordenar solo el último elemento hacia arriba (bubble up)
                    let len = leaderboard.entries.len();
                    for i in (1..len).rev() {
                        if leaderboard.entries[i].resources_collected
                            > leaderboard.entries[i - 1].resources_collected
                        {
                            leaderboard.entries.swap(i, i - 1);
                        } else {
                            break;
                        }
                    }
                }
            }
        }
    }

    // --- 8. Emitir evento ---
    emit!(crate::events::ResourceCollected {
        wallet: owner,
        resource_type,
        points,
        world_progress,
        total_resources: ctx.accounts.world.total_resources,
        epoch: ctx.accounts.world.epoch,
    });

    // --- 9. Si el epoch terminó, emitir evento de reset ---
    // NOTA: El reset real (crear nuevo WorldState/Leaderboard) lo hace
    // el authority desde el frontend al recibir el evento WorldReset.
    // El contrato no puede crear nuevas cuentas en una instrucción de collect.
    if epoch_ended {
        let winner = owner; // Quien recolectó el último recurso inicia el reset
        emit!(crate::events::WorldReset {
            completed_epoch: ctx.accounts.world.epoch,
            winner,
            total_collected: world_progress,
        });
    }

    Ok(())
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
        bump = character.bump,
        constraint = character.owner == owner.key() @ AtlasError::NotOwner
    )]
    pub character: Account<'info, Character>,

    #[account(
        mut,
        seeds = [b"leaderboard", world.epoch.to_le_bytes().as_ref()],
        bump = leaderboard.bump
    )]
    pub leaderboard: Account<'info, Leaderboard>,

    pub owner: Signer<'info>,
}
