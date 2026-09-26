-- Seed Sam + catalogue after linking CogCart.
-- Run: supabase db execute -f supabase/seed.sql
-- Or create the auth user in Studio, then insert the shopper row with that auth_user_id.

insert into public.il_shoppers (
  id, name, email, city, waist, length, preferred_brands, min_condition,
  budget_max, style_likes, returning_visits, last_seen_note
) values (
  'shopper_sam_okonkwo',
  'Sam Okonkwo',
  'sam.okonkwo@example.com',
  'London',
  31,
  32,
  array['A.P.C.', 'Nudie Jeans', 'Edwin'],
  'Good',
  90,
  array['raw indigo', 'slim taper', 'organic cotton', 'minimal branding'],
  7,
  'Browsed A.P.C. Petit New Standard last week; abandoned cart at full £95.'
) on conflict (id) do nothing;

insert into public.il_past_purchases (
  shopper_id, product_id, brand, name, waist, condition, price, purchased_at, note
) values
  ('shopper_sam_okonkwo', 'nudie-lean-dean', 'Nudie Jeans', 'Lean Dean (prior season)', 31, 'Very Good', 52, '2026-03-14', 'Loved the taper. Asked for the same waist next time'),
  ('shopper_sam_okonkwo', null, 'A.P.C.', 'New Standard (sold)', 30, 'Good', 78, '2025-11-02', 'Wanted a size up. Now locks W31'),
  ('shopper_sam_okonkwo', null, 'Weekday', 'Ace Organic', 31, 'Good', 28, '2025-08-19', 'Weekend beater. Liked the organic hand-feel')
on conflict do nothing;

insert into public.il_orders (
  id, created_at, buyer_name, buyer_email, shipping_city, items,
  subtotal, perk_savings, total, list_price, discount, mechanic, status,
  note, negotiation_summary, shopper_id, channel
) values (
  'ord_stage_seed',
  '2026-09-20T11:00:00Z',
  'Sam Okonkwo',
  'sam.okonkwo@example.com',
  'London',
  '[{"productId":"nudie-lean-dean","name":"Lean Dean Organic","brand":"Nudie Jeans","price":55,"role":"primary"},{"productId":"dickies-872","name":"872 Slim Fit Work Pant","brand":"Dickies","price":0,"role":"perk"}]'::jsonb,
  55, 28, 55, 55, 0,
  'negotiated-pair-and-perk',
  'shipped',
  'Earlier visit, already fulfilled.',
  'Nudie Lean Dean at £55 with a free Dickies perk.',
  'shopper_sam_okonkwo',
  'web'
) on conflict (id) do nothing;
