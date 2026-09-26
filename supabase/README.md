# Supabase: reuse CogCart

The free-plan org has **CogCart**, **Leaderboard**, and **trmnl-db** (all paused). Restore **CogCart** in the dashboard first (free plan allows two active projects).

```bash
brew install supabase/tap/supabase   # already done on this machine
supabase login                       # browser auth — you do this
supabase link --project-ref <cogcart-project-ref>
supabase db dump --schema-only -f supabase/schema-before.sql
supabase db push
supabase db execute -f supabase/seed.sql
```

Then paste URL + anon + service role into `.env.local` from `.env.example`.

All Indigo Lane tables use the `il_` prefix so they do not clash with existing CogCart tables.

Without env vars the app still runs: seed catalogue, file/memory orders, demo cookie login, and `il_demo_agent_token`.
