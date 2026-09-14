# Kanto PvP — Clean V5

A static Gen I Kanto 6v6 PvP prototype with a deliberately modernized Ghost/Psychic interaction.

## Mechanics pass

- 151 Gen I species, 15 Gen I types and 165 Gen I moves are validated at startup.
- Every Pokémon must expose at least four Red/Blue-legal moves before the game becomes playable.
- Team Builder requires exactly six Pokémon and exactly four legal moves per Pokémon.
- The four selected moves are the exact moves instantiated in battle.
- Gen I physical/special split is type-based and Gen I uses a single Special stat.
- Corrected historical Gen I move typing: Bite, Gust, Karate Chop and Razor Wind are Normal; Sand-Attack is Ground.
- Type-chart regression tests include Normal/Ghost immunity, Fighting/Ghost immunity, Electric/Ground immunity, Ground/Flying immunity and the requested Ghost/Psychic 2x interaction in both directions.
- Level 50 Gen I stat calculation with max DV/stat experience defaults.
- PP, accuracy, stat stages, STAB, critical-hit handling, burn Attack reduction and paralysis Speed reduction.
- Major status conditions, Toxic scaling, Leech Seed, recovery, drain, recoil, fixed-damage moves, OHKO moves, multi-hit moves, charge/recharge states and common stat/status effects.
- Stat boosts, confusion and other battle volatiles are cleared appropriately on switch-out where required.
- Voluntary switching costs a turn; forced replacement after fainting is handled separately.
- Online actions are queued separately and a per-room/per-turn database lock prevents duplicate host resolution.

## Important limitation

This is a substantially more rigorous custom battle core, but it is **not claimed to be a byte-for-byte cartridge emulator for every obscure Gen I move glitch/effect**. The pkmn project documents a dedicated Gen I engine that aims at cartridge-level fidelity and is the right long-term foundation if the project eventually needs tournament-grade emulator accuracy.

The project intentionally does **not** reproduce the original Ghost → Psychic Gen I bug; both directions are super effective because that is the rule requested for this game.

## Supabase

Run `supabase_schema.sql` in Supabase SQL Editor. It is designed to be rerunnable and adds `pvp_turn_locks` for duplicate-resolution protection. Anonymous Sign-Ins must be enabled.

## Tests

Run:

```bash
node --check app.mjs
node tests.mjs
```

Both must pass.

## Hosting

Upload `index.html`, `app.mjs`, `tests.mjs`, `README.md` and `supabase_schema.sql` to the repository root. GitHub Pages only needs `index.html` and `app.mjs` at runtime.


Move-selection fix: Team Builder now starts each Pokémon with a curated, Red/Blue-legal recommended four-move set. The full legal Gen I move pool remains available so players can replace any recommendation. Quick Battle opponents also use recommended legal sets rather than the first four moves alphabetically.


V7 hotfix: corrected the Gen I learnset legality call to pass species/move names, added a raw Gen I Dex learnset fallback, and removed the silent empty-learnset failure. The app now fails loudly if verified Gen I learnsets still cannot provide four legal moves.


V9 battle hardening pass:
- Corrected Gen I sleep/freeze/confusion handling.
- Corrected RBY damage rounding, stat >255 handling, STAB, and dual-type effectiveness order.
- Corrected Toxic on switch-out, burn residuals, Substitute damage routing, and Hyper Beam recharge exceptions.
- Removed the incorrect RBY Rock Slide flinch effect.
- Fixed the online turn-lock race where the host could lock a turn before both actions had arrived.
- Added regression checks for these mechanics.


## Clean Rules (V9)
This is a Gen-I-data battler, not a cartridge-glitch emulator. It uses the 151 original Kanto species, Red/Blue-legal moves, Gen-I base stats and the Gen-I type-based physical/special split. Battle rules intentionally omit cartridge glitches: no 1/256 accuracy miss, no Focus Energy bug, no stat reapplication/overflow glitches, and no link-battle desync mechanics. Ghost and Psychic are mutually super-effective by project rule.


V10 hotfix: corrected Gen I learnset validation to use the documented @pkmn/data species-name API and the authoritative @pkmn/dex getLearnsets browser API. This fixes false illegal-move errors such as Venusaur/Razor Leaf.


V11 diagnostics/fixes: one raw Gen I learnset load per species, no duplicated secondary effects, corrected RBY recoil/crash behavior, correct end-of-turn active references after switching, and forced online replacements no longer grant a free attack.


V12 adds clean implementations for Counter, Conversion, Transform, Disable, Mimic, Psywave, Metronome, and partial trapping; tracks last-hit data for Counter; prevents disabled moves; and records state cleanly across switches.
