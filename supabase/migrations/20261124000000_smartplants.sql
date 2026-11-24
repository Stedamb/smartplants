-- SmartPlants: devices, readings, commands.
-- Public: readings and device_status (no secrets). Owner only: settings and commands.
-- The board never talks to these tables directly: it goes through the device-sync
-- Edge Function, which checks its token and uses the service role.

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'SmartPlant',
  token_hash text not null unique,
  dry_threshold_pct smallint not null default 25 check (dry_threshold_pct between 0 and 100),
  warning_threshold_pct smallint not null default 62 check (warning_threshold_pct between 0 and 100),
  sync_interval_s smallint not null default 30 check (sync_interval_s between 5 and 3600),
  created_at timestamptz not null default now(),
  check (dry_threshold_pct < warning_threshold_pct)
);

create table public.readings (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.devices (id) on delete cascade,
  created_at timestamptz not null default now(),
  raw smallint not null check (raw between 0 and 1024),
  moisture_pct smallint not null check (moisture_pct between 0 and 100),
  pump_on boolean not null default false,
  temperature_c real,
  light_lux real
);

create index readings_device_created_idx on public.readings (device_id, created_at desc);

create table public.commands (
  id bigint generated always as identity primary key,
  device_id uuid not null references public.devices (id) on delete cascade,
  kind text not null default 'water' check (kind in ('water')),
  duration_ms integer not null default 3000 check (duration_ms between 500 and 15000),
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index commands_pending_idx on public.commands (device_id) where delivered_at is null;

-- Public view: what the dashboard needs about a device, without token_hash or owner_id.
create view public.device_status
with (security_invoker = false) as
select
  d.id,
  d.name,
  d.dry_threshold_pct,
  d.warning_threshold_pct,
  d.sync_interval_s,
  r.created_at as last_seen_at,
  r.moisture_pct,
  r.raw,
  r.pump_on,
  r.temperature_c,
  r.light_lux
from public.devices d
left join lateral (
  select * from public.readings
  where device_id = d.id
  order by created_at desc
  limit 1
) r on true;

alter table public.devices enable row level security;
alter table public.readings enable row level security;
alter table public.commands enable row level security;

-- devices: only the owner sees and edits the full row (including token_hash).
create policy "owner reads own devices" on public.devices
  for select to authenticated using (owner_id = (select auth.uid()));
create policy "owner updates own devices" on public.devices
  for update to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

-- Column-level guard: the owner may change settings, not identity or token.
revoke update on public.devices from authenticated;
grant update (name, dry_threshold_pct, warning_threshold_pct, sync_interval_s) on public.devices to authenticated;

-- readings: public read, no client writes.
create policy "anyone reads readings" on public.readings
  for select to anon, authenticated using (true);

-- commands: owner only.
create policy "owner reads own commands" on public.commands
  for select to authenticated
  using (exists (select 1 from public.devices d where d.id = device_id and d.owner_id = (select auth.uid())));
create policy "owner queues commands" on public.commands
  for insert to authenticated
  with check (exists (select 1 from public.devices d where d.id = device_id and d.owner_id = (select auth.uid())));

revoke all on public.device_status from anon, authenticated;
grant select on public.device_status to anon, authenticated;

-- Live updates for the dashboard.
alter publication supabase_realtime add table public.readings;
