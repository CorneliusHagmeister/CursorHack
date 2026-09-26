-- Merchant negotiation policy per product (floor price, give-get terms, perks).
-- Contains hidden floor prices: RLS on with no policies, so only the service
-- role (server) can read or write it.
create table if not exists public.il_negotiation_policies (
  product_id text primary key,
  policy jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.il_negotiation_policies enable row level security;
