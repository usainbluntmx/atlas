pub mod initialize_world;
pub mod initialize_leaderboard;
pub mod mint_character;
pub mod collect_resource;

// Re-exportar solo los tipos de contexto (Accounts structs)
// No usamos glob * porque todos los módulos tienen una función `handler`
// y causaría ambigüedad. lib.rs llama cada handler con su ruta completa.
pub use initialize_world::InitializeWorld;
pub use initialize_leaderboard::InitializeLeaderboard;
pub use mint_character::MintCharacter;
pub use collect_resource::CollectResource;
