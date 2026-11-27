-- 33r · PANEL DE CONTROL (clientes, proyectos por país, herramientas, finanzas).
-- Ejecutar DESPUÉS de supabase/schema.sql (usa la función is_admin() y la tabla admins de allí).
-- Todo está protegido por RLS: solo los correos de la tabla `admins` (Daniel y Juan) leen y escriben.
-- NUNCA pongas aquí datos reales de clientes: se cargan desde la página /admin/control, ya autenticado.

create table if not exists clients (
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

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete set null,
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

create table if not exists tools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  vendor text,
  billing text not null default 'mensual' check (billing in ('mensual','anual','uso','unico','gratis')),
  monthly_cost_cents int not null default 0 check (monthly_cost_cents >= 0),   -- equivalente mensual
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists project_tools (
  project_id uuid not null references projects(id) on delete cascade,
  tool_id uuid not null references tools(id) on delete cascade,
  primary key (project_id, tool_id)
);

create table if not exists income (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  date date not null,
  concept text not null,
  amount_cents int not null check (amount_cents > 0),
  kind text not null default 'otro' check (kind in ('anticipo','saldo','mensualidad','otro')),
  status text not null default 'cobrado' check (status in ('pendiente','cobrado')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists costs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  tool_id uuid references tools(id) on delete set null,
  date date not null,
  concept text not null,
  amount_cents int not null check (amount_cents > 0),
  kind text not null default 'unico' check (kind in ('unico','recurrente')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists projects_client on projects(client_id);
create index if not exists income_project on income(project_id);
create index if not exists costs_project on costs(project_id);

-- RLS: solo administradores
do $$
declare t text;
begin
  foreach t in array array['clients','projects','tools','project_tools','income','costs'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "solo admin" on %I', t);
    execute format('create policy "solo admin" on %I for all using (is_admin()) with check (is_admin())', t);
  end loop;
end $$;

-- PROSPECTOS: la lista semanal (cada domingo) que prepara Cazapin. Distinto de `clients`: aquí aún no nos han contratado.
create table if not exists prospects (
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
  client_id uuid references clients(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists prospects_week on prospects(week);
alter table prospects enable row level security;
drop policy if exists "solo admin" on prospects;
create policy "solo admin" on prospects for all using (is_admin()) with check (is_admin());
