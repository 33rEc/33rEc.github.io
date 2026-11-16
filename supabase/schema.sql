-- 33r · esquema Supabase. Ejecutar completo en SQL Editor.
-- Público: lee proyectos publicados e inserta leads. Panel (/admin): solo usuarios en `admins`.

create table if not exists admins (email text primary key);
alter table admins enable row level security;  -- sin políticas: nadie la lee desde el cliente

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]+$'),
  client text not null,
  industry text not null check (industry in ('gastronomia','eventos','retail','salud','gobierno_tech','marca_propia')),
  solution_types text[] not null default '{}',
  country text, city text, year int,
  status text not null default 'caso_de_estudio' check (status in ('en_vivo','caso_de_estudio','oculto')),
  published boolean not null default false,          -- false = borrador
  live_url text, cover_url text, video_url text,
  star_mechanic text, target_client text, challenge text, solution text, results text,
  mechanics text[] not null default '{}',
  metrics jsonb not null default '[]',                -- [{"label":"Pedidos/mes","value":"+120"}]
  screens jsonb not null default '{}',                -- {"sell":"url","control":"url"}
  en jsonb not null default '{}',                     -- traducciones: star_mechanic, target_client, challenge, solution, results
  sort_order int not null default 100,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists project_media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  kind text not null check (kind in ('cover','image','video','screen_sell','screen_control')),
  url text not null, caption text, sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 120),
  business text not null check (char_length(business) between 1 and 160),
  link text check (link is null or char_length(link) <= 300),
  goal text not null check (goal in ('vender','fidelizar','ordenar','medida')),
  country text not null check (char_length(country) <= 80),
  whatsapp text not null check (char_length(whatsapp) between 6 and 30),
  lang text default 'es', source text default 'web',
  status text not null default 'nuevo' check (status in ('nuevo','contactado','demo_enviada','ganado','perdido')),
  notes text
);

create or replace function touch_updated() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists projects_touch on projects;
create trigger projects_touch before update on projects for each row execute function touch_updated();

alter table projects enable row level security;
alter table project_media enable row level security;
alter table leads enable row level security;

create policy "público lee proyectos publicados" on projects for select using (published and status <> 'oculto');
create policy "admin gestiona proyectos" on projects for all using (is_admin()) with check (is_admin());

create policy "público lee media de publicados" on project_media for select
  using (exists (select 1 from projects p where p.id = project_id and p.published and p.status <> 'oculto'));
create policy "admin gestiona media" on project_media for all using (is_admin()) with check (is_admin());

create policy "público inserta leads" on leads for insert to anon, authenticated with check (status = 'nuevo' and notes is null);
create policy "admin lee leads" on leads for select using (is_admin());
create policy "admin actualiza leads" on leads for update using (is_admin()) with check (is_admin());
create policy "admin borra leads" on leads for delete using (is_admin());

-- Storage: bucket público de lectura, escritura solo admin
insert into storage.buckets (id, name, public) values ('project-media','project-media', true) on conflict (id) do nothing;
create policy "lectura pública de media" on storage.objects for select using (bucket_id = 'project-media');
create policy "admin sube media" on storage.objects for insert with check (bucket_id = 'project-media' and is_admin());
create policy "admin edita media" on storage.objects for update using (bucket_id = 'project-media' and is_admin());
create policy "admin borra media" on storage.objects for delete using (bucket_id = 'project-media' and is_admin());

-- DESPUÉS de crear los 2 usuarios en Authentication → Users, autorízalos (reemplaza los correos):
-- insert into admins (email) values ('correo-de-daniel@...'), ('correo-de-juan@...');
