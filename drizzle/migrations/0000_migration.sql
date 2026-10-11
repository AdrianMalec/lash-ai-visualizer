create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "Users see own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

create table public.lash_styles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.lash_styles to anon, authenticated;
grant insert, update, delete on public.lash_styles to authenticated;
grant all on public.lash_styles to service_role;
alter table public.lash_styles enable row level security;
create policy "Styles public read" on public.lash_styles for select using (true);
create policy "Admins manage styles" on public.lash_styles for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.salons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stylist text not null default '',
  city text not null default '',
  image_url text,
  rating numeric(3,2) not null default 5,
  reviews int not null default 0,
  price text not null default '',
  portfolio jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select on public.salons to anon, authenticated;
grant insert, update, delete on public.salons to authenticated;
grant all on public.salons to service_role;
alter table public.salons enable row level security;
create policy "Salons public read" on public.salons for select using (true);
create policy "Admins manage salons" on public.salons for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));