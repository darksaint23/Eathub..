
create extension if not exists pgcrypto;

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  description text,
  logo_url text,
  phone text,
  currency text not null default 'KES',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.restaurant_members (
  restaurant_id uuid not null
    references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'staff')),
  can_manage_menu boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (restaurant_id, user_id)
);

create table if not exists public.dishes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null
    references public.restaurants(id) on delete cascade,
  name text not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  image_url text,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists dishes_restaurant_idx
  on public.dishes(restaurant_id);

create table if not exists public.menu_views (
  id bigint generated always as identity primary key,
  restaurant_id uuid not null
    references public.restaurants(id) on delete cascade,
  dish_id uuid references public.dishes(id) on delete set null,
  viewed_at timestamptz not null default now()
);

alter table public.restaurants enable row level security;
alter table public.restaurant_members enable row level security;
alter table public.dishes enable row level security;
alter table public.menu_views enable row level security;

-- Public menus may show only approved restaurants.
create policy "Public can view approved restaurants"
on public.restaurants for select
to anon, authenticated
using (status = 'approved');

-- Members may see only their own memberships.
create policy "Members can view their memberships"
on public.restaurant_members for select
to authenticated
using (user_id = (select auth.uid()));

-- Approved menus are visible to customers.
create policy "Public can view available dishes"
on public.dishes for select
to anon, authenticated
using (
  is_available = true
  and exists (
    select 1
    from public.restaurants r
    where r.id = dishes.restaurant_id
      and r.status = 'approved'
  )
);

-- Owners and permitted staff can manage their restaurant's dishes.
create policy "Restaurant members can insert dishes"
on public.dishes for insert
to authenticated
with check (
  exists (
    select 1
    from public.restaurant_members m
    where m.restaurant_id = dishes.restaurant_id
      and m.user_id = (select auth.uid())
      and (
        m.role = 'owner'
        or (m.role = 'staff' and m.can_manage_menu)
      )
  )
);

create policy "Restaurant members can update dishes"
on public.dishes for update
to authenticated
using (
  exists (
    select 1
    from public.restaurant_members m
    where m.restaurant_id = dishes.restaurant_id
      and m.user_id = (select auth.uid())
      and (
        m.role = 'owner'
        or (m.role = 'staff' and m.can_manage_menu)
      )
  )
)
with check (
  exists (
    select 1
    from public.restaurant_members m
    where m.restaurant_id = dishes.restaurant_id
      and m.user_id = (select auth.uid())
      and (
        m.role = 'owner'
        or (m.role = 'staff' and m.can_manage_menu)
      )
  )
);

create policy "Restaurant owners can delete dishes"
on public.dishes for delete
to authenticated
using (
  exists (
    select 1
    from public.restaurant_members m
    where m.restaurant_id = dishes.restaurant_id
      and m.user_id = (select auth.uid())
      and m.role = 'owner'
  )
);

create policy "Members can record menu views"
on public.menu_views for insert
to authenticated
with check (
  exists (
    select 1
    from public.restaurant_members m
    where m.restaurant_id = menu_views.restaurant_id
      and m.user_id = (select auth.uid())
  )
);

create policy "Members can view their restaurant's menu views"
on public.menu_views for select
to authenticated
using (
  exists (
    select 1
    from public.restaurant_members m
    where m.restaurant_id = menu_views.restaurant_id
      and m.user_id = (select auth.uid())
  )
);

grant select on public.restaurants, public.dishes
to anon, authenticated;
grant select on public.restaurant_members
to authenticated;
grant select, insert, update, delete on public.dishes
to authenticated;
grant select, insert on public.menu_views
to authenticated;
grant usage, select on sequence public.menu_views_id_seq
to authenticated;
