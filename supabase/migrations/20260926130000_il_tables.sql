-- Indigo Lane tables on the reused CogCart project.
-- Prefixed il_ so they do not clash with existing CogCart schema.
-- Restore CogCart in the dashboard, then: supabase link --project-ref <ref> && supabase db push

create extension if not exists "pgcrypto";

create table if not exists public.il_products (
  id text primary key,
  name text not null,
  brand text not null,
  price numeric not null,
  waist int not null,
  length int not null,
  wash text not null,
  cut text not null,
  condition text not null,
  description text not null,
  city text not null,
  perk_eligible boolean not null default false,
  accent text,
  image text not null,
  tags text[] not null default '{}'
);

create table if not exists public.il_shoppers (
  id text primary key,
  auth_user_id uuid references auth.users (id) on delete cascade,
  name text not null,
  email text,
  city text,
  waist int not null,
  length int not null,
  preferred_brands text[] not null default '{}',
  min_condition text not null default 'Good',
  budget_max numeric not null,
  style_likes text[] not null default '{}',
  returning_visits int not null default 1,
  last_seen_note text,
  created_at timestamptz not null default now()
);

create table if not exists public.il_past_purchases (
  id uuid primary key default gen_random_uuid(),
  shopper_id text not null references public.il_shoppers (id) on delete cascade,
  product_id text,
  brand text not null,
  name text not null,
  waist int not null,
  condition text not null,
  price numeric not null,
  purchased_at date not null,
  note text
);

create table if not exists public.il_orders (
  id text primary key,
  created_at timestamptz not null default now(),
  buyer_name text not null,
  buyer_email text not null,
  shipping_city text not null,
  items jsonb not null,
  subtotal numeric not null,
  perk_savings numeric not null default 0,
  total numeric not null,
  list_price numeric not null,
  discount numeric not null default 0,
  mechanic text not null,
  status text not null default 'confirmed',
  note text,
  negotiation_summary text,
  shopper_id text,
  channel text not null default 'web'
);

create table if not exists public.il_negotiations (
  id uuid primary key default gen_random_uuid(),
  product_id text not null,
  shopper_id text,
  channel text not null default 'web',
  deal jsonb,
  history jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.il_agent_tokens (
  id text primary key,
  shopper_id text not null references public.il_shoppers (id) on delete cascade,
  label text not null,
  token_hash text not null unique,
  prefix text not null,
  scopes text[] not null default '{}',
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

alter table public.il_products enable row level security;
alter table public.il_shoppers enable row level security;
alter table public.il_past_purchases enable row level security;
alter table public.il_orders enable row level security;
alter table public.il_negotiations enable row level security;
alter table public.il_agent_tokens enable row level security;

create policy "il_products_public_read" on public.il_products
  for select using (true);

create policy "il_shoppers_own" on public.il_shoppers
  for select using (auth.uid() = auth_user_id);

create policy "il_past_purchases_own" on public.il_past_purchases
  for select using (
    shopper_id in (
      select id from public.il_shoppers where auth_user_id = auth.uid()
    )
  );

create policy "il_orders_own_read" on public.il_orders
  for select using (
    shopper_id in (
      select id from public.il_shoppers where auth_user_id = auth.uid()
    )
  );

create policy "il_agent_tokens_own" on public.il_agent_tokens
  for select using (
    shopper_id in (
      select id from public.il_shoppers where auth_user_id = auth.uid()
    )
  );
