# Kanto PvP — Clean V2

This build is a cleaned and regression-tested Gen I Kanto PvP prototype.

## What changed

- Uses the Gen I data layer for the 151 Kanto roster, Gen I base stats/types and Red/Blue learnsets.
- Team Builder locks exactly four selected legal moves to each Pokémon.
- Battle uses those exact four selected moves.
- Explicit Gen I move-type safeguards: Bite, Gust, Karate Chop and Razor Wind are Normal; Sand-Attack is Ground.
- Gen I physical/special classification is type-based.
- Type chart fixes Normal/Ghost and Fighting/Ghost immunities and deliberately makes both Ghost→Psychic and Psychic→Ghost 2× as requested.
- Level 50 stat model with Gen I single Special stat.
- PP, accuracy, STAB, criticals, status conditions, stat stages, recovery, drain and recoil are implemented for the supported move effects.
- Local 6v6 switching after fainting works; active Pokémon cannot freely switch without spending a turn.
- Online actions use a separate `pvp_actions` queue, preventing both players from overwriting the same JSON battle-state object.
- Online switching after fainting is supported.
- Room joining uses a conditional guest-slot update to reduce join races.
- Realtime room and action subscriptions are included.

## Important online note

This is a **casual online V2**. The host browser resolves the battle after receiving both validated action records. This is much safer than letting both browsers mutate the same state, but it is not the final anti-cheat/ranked architecture. A future ranked version should move the battle resolver to a Supabase Edge Function or another trusted server.

## Supabase

Run `supabase_schema.sql` in Supabase SQL Editor. It is safe to run after the original schema because it uses `IF NOT EXISTS` / policy guards and adds the `pvp_actions` table plus realtime configuration.

Anonymous Sign-Ins must be enabled under Authentication → Providers.

## Testing

Run:

```bash
node --check app.mjs
node tests.mjs
```

Both must pass before deployment.

## Hosting

The game is a static site. Upload `index.html` and `app.mjs` together to GitHub Pages. Keep `supabase_schema.sql` in the repository for reference; it is not loaded by the browser.
