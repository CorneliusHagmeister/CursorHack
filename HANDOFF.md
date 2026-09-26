# IDE handoff, Indigo Lane

Continue on branch `feature/generic-shop-agents-il1` (or merge into `dev`).

| | |
| --- | --- |
| Path | worktree `~/dev/CursorHack-generic-shop` or primary checkout |
| Remote | `https://github.com/CorneliusHagmeister/CursorHack.git` |

## Shipped

- Generic Vinted-style landing (no Sam on home)
- Context resolver: anonymous, ad, login, agent
- Demo login + agent token (`il_demo_agent_token`)
- REST `/api/v1`, MCP `/api/mcp`, OpenAPI, llms.txt, markdown negotiation
- Supabase `il_*` migrations ready for CogCart (optional; fallback works without env)

## Supabase next step

1. Restore CogCart in the dashboard (paused projects).
2. `supabase login && supabase link --project-ref <ref> && supabase db push`
3. Fill `.env.local` from `.env.example`.

## Leave alone

- Seed catalogue and Pair & Perk / Bundle mechanic
- File/memory order store as the no-env fallback
- Do not require a live LLM for the stage demo
