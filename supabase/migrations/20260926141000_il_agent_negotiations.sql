-- Agent negotiation API (/api/negotiations): sessions + one row per message,
-- streamed to the merchant dashboard with Supabase Realtime.
-- Rows hold offers and chat only (never floor prices). Writes go through the
-- service role; public read is for the demo dashboard.

create table if not exists public.il_agent_negotiations (
  id text primary key,
  product_id text not null,
  buyer_name text,
  status text not null default 'open',
  agreed_price numeric,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.il_agent_negotiation_messages (
  id bigint generated always as identity primary key,
  negotiation_id text not null references public.il_agent_negotiations (id) on delete cascade,
  role text not null check (role in ('buyer', 'merchant')),
  text text not null,
  counter_offer numeric,
  offer_terms text[],
  decision text,
  created_at timestamptz not null default now()
);

create index if not exists il_agent_negotiation_messages_by_negotiation
  on public.il_agent_negotiation_messages (negotiation_id, id);

alter table public.il_agent_negotiations enable row level security;
alter table public.il_agent_negotiation_messages enable row level security;

drop policy if exists "il_agent_negotiations_demo_read" on public.il_agent_negotiations;
create policy "il_agent_negotiations_demo_read" on public.il_agent_negotiations
  for select using (true);
drop policy if exists "il_agent_negotiation_messages_demo_read" on public.il_agent_negotiation_messages;
create policy "il_agent_negotiation_messages_demo_read" on public.il_agent_negotiation_messages
  for select using (true);

-- Stream both tables to the dashboard (safe to re-run)
do $$
declare t text;
begin
  foreach t in array array['il_agent_negotiations', 'il_agent_negotiation_messages'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
