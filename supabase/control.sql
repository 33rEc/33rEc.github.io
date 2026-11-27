-- 33r · PANEL DE CONTROL (clientes, proyectos por país, herramientas, finanzas, prospectos).
-- AUTÓNOMO: no necesita schema.sql y todas sus tablas empiezan con ctl_, así que se puede ejecutar en un proyecto
-- de Supabase que ya tenga otras cosas sin tocarlas. Solo CREA objetos ctl_*; no modifica ni lee nada existente.
-- Solo los correos de ctl_admins (Daniel y Juan) leen y escriben (RLS). NUNCA pongas datos reales de clientes aquí:
-- se cargan desde /admin/control ya autenticado.

create table if not exists ctl_admins (email text primary key);
alter table ctl_admins enable row level security;
-- (sin políticas: nadie la lee ni escribe desde la API; se administra desde el SQL editor)
create or replace function ctl_is_admin() returns boolean
  language sql stable security definer set search_path = public as
  $$ select exists (select 1 from ctl_admins where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))) $$;
-- Ejemplo (cámbialos por los correos reales):
--   insert into ctl_admins values ('daniel@correo.com'), ('juan@correo.com') on conflict do nothing;

create table if not exists ctl_clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null default 'Ecuador',
  city text,
  industry text,
  status text not null default 'activo' check (status in ('prospecto','activo','pausado','perdido')),
  contact text,
  since date,
  mrr_cents int not null default 0 check (mrr_cents >= 0),          -- mensualidad que paga hoy
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists ctl_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references ctl_clients(id) on delete set null,
  name text not null,
  country text not null default 'Ecuador',
  city text,
  kind text,
  status text not null default 'en_desarrollo' check (status in ('demo','en_desarrollo','en_vivo','pausado','cerrado')),
  started_on date,
  delivered_on date,
  price_cents int not null default 0 check (price_cents >= 0),       -- lo acordado por el proyecto
  live_url text,
  repo_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists ctl_tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  vendor text,
  billing text not null default 'mensual' check (billing in ('mensual','anual','uso','unico','gratis')),
  monthly_cost_cents int not null default 0 check (monthly_cost_cents >= 0),   -- equivalente mensual
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists ctl_project_tools (
  project_id uuid not null references ctl_projects(id) on delete cascade,
  tool_id uuid not null references ctl_tools(id) on delete cascade,
  primary key (project_id, tool_id)
);

create table if not exists ctl_income (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references ctl_projects(id) on delete set null,
  client_id uuid references ctl_clients(id) on delete set null,
  date date not null,
  concept text not null,
  amount_cents int not null check (amount_cents > 0),
  kind text not null default 'otro' check (kind in ('anticipo','saldo','mensualidad','otro')),
  status text not null default 'cobrado' check (status in ('pendiente','cobrado')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists ctl_costs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references ctl_projects(id) on delete set null,
  tool_id uuid references ctl_tools(id) on delete set null,
  date date not null,
  concept text not null,
  amount_cents int not null check (amount_cents > 0),
  kind text not null default 'unico' check (kind in ('unico','recurrente')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists ctl_projects_client on ctl_projects(client_id);
create index if not exists ctl_income_project on ctl_income(project_id);
create index if not exists ctl_costs_project on ctl_costs(project_id);

-- RLS: solo administradores
do $$
declare t text;
begin
  foreach t in array array['ctl_clients','ctl_projects','ctl_tools','ctl_project_tools','ctl_income','ctl_costs'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "solo admin" on %I', t);
    execute format('create policy "solo admin" on %I for all using (ctl_is_admin()) with check (ctl_is_admin())', t);
  end loop;
end $$;

-- PROSPECTOS: la lista semanal (cada domingo) que prepara Cazapin. Distinto de `ctl_clients`: aquí aún no nos han contratado.
create table if not exists ctl_prospects (
  id uuid primary key default gen_random_uuid(),
  week date not null,                          -- el domingo que abre la semana de trabajo
  name text not null,
  country text not null default 'España',
  city text,
  industry text,
  score int not null default 0 check (score between 0 and 100),
  channel text,
  contact text,
  evidence_url text,
  why text,
  offer text,
  first_message text,
  status text not null default 'nuevo' check (status in ('nuevo','contactado','respondio','propuesta','reunion','ganado','descartado')),
  next_action text,
  next_on date,
  client_id uuid references ctl_clients(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists ctl_prospects_week on ctl_prospects(week);
alter table ctl_prospects enable row level security;
drop policy if exists "solo admin" on ctl_prospects;
create policy "solo admin" on ctl_prospects for all using (ctl_is_admin()) with check (ctl_is_admin());
