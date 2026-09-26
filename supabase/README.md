# Supabase: indigo-lane (Europe)

Project ref: `qsedqcfzodffngzcrcgh`  
URL: `https://qsedqcfzodffngzcrcgh.supabase.co`

```bash
supabase login
supabase link --project-ref qsedqcfzodffngzcrcgh
supabase db push
# optional seed (needs linked project):
psql "$DATABASE_URL" -f supabase/seed.sql
# or paste supabase/seed.sql into the SQL editor
```

Env (`.env.local`, never commit):

```
NEXT_PUBLIC_SUPABASE_URL=https://qsedqcfzodffngzcrcgh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<from dashboard>
SUPABASE_SERVICE_ROLE_KEY=<from dashboard → Settings → API, for admin/seed only>
```

Without the service role key the app still works: demo cookie login, seed catalogue, file orders, `il_demo_agent_token`.
