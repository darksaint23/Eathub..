-- Defense-in-depth RLS template for a Supabase/Postgres deployment.
-- The current Node server performs tenant filtering server-side.
-- If the app is later switched to Supabase Auth/client access, connect users to auth.uid()
-- and enable these policies after creating a user_hotel_memberships table.

alter table hotels enable row level security;
alter table users enable row level security;
alter table categories enable row level security;
alter table dishes enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payment_transactions enable row level security;

-- Public customer menu can be exposed through server endpoints only.
-- Do not grant anon direct table access unless you create explicit public-menu policies.
revoke all on hotels, users, categories, dishes, orders, order_items, payment_transactions from anon;
revoke all on hotels, users, categories, dishes, orders, order_items, payment_transactions from authenticated;

-- The backend service role/database owner can continue to operate server-side.
-- Create explicit per-hotel policies before exposing tables directly to browser clients.
