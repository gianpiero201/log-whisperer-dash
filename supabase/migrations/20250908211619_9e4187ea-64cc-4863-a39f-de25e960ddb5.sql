-- Enums
create type public.log_level as enum ('DEBUG','INFO','WARN','ERROR');
create type public.alert_severity as enum ('info','warning','critical');
create type public.alert_status as enum ('active','resolved');
create type public.endpoint_status as enum ('up','down','unknown');

-- Timestamp trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql set search_path = public;

-- Validation triggers (prefer triggers over CHECK for flexibility)
create or replace function public.tg_validate_endpoints()
returns trigger as $$
begin
  if new.interval_sec < 5 then
    raise exception 'interval_sec must be >= 5 seconds';
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

create or replace function public.tg_validate_user_settings()
returns trigger as $$
begin
  if new.refresh_interval < 5 then
    raise exception 'refresh_interval must be >= 5 seconds';
  end if;
  if new.log_retention_days < 0 then
    raise exception 'log_retention_days must be >= 0';
  end if;
  if new.max_log_size_mb < 1 then
    raise exception 'max_log_size_mb must be >= 1';
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

-- Tables
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.endpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  url text not null,
  method text not null default 'GET',
  interval_sec int not null default 60,
  webhook_url text,
  enabled boolean not null default true,
  last_status public.endpoint_status not null default 'unknown',
  last_status_code int,
  last_latency_ms int,
  last_checked_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.logs (
  id bigserial primary key,
  user_id uuid not null,
  endpoint_id uuid references public.endpoints(id) on delete set null,
  timestamp timestamptz not null default now(),
  level public.log_level not null,
  service text,
  message text,
  source text,
  meta jsonb not null default '{}'::jsonb
);

create table public.alert_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  query text,
  severity public.alert_severity not null default 'warning',
  enabled boolean not null default true,
  throttle_seconds int not null default 300,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.alert_events (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.alert_rules(id) on delete cascade,
  endpoint_id uuid references public.endpoints(id) on delete set null,
  occurred_at timestamptz not null default now(),
  status public.alert_status not null default 'active',
  message text,
  payload jsonb,
  resolved_at timestamptz
);

create table public.saved_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  query text not null,
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key,
  auto_refresh boolean not null default true,
  refresh_interval int not null default 30,
  theme text not null default 'system',
  timezone text not null default 'UTC',
  log_retention_days int not null default 30,
  max_log_size_mb int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references public.endpoints(id) on delete cascade,
  target_url text not null,
  success boolean,
  status_code int,
  response_ms int,
  error text,
  sent_at timestamptz not null default now(),
  payload jsonb
);

-- Indexes
create index idx_endpoints_user on public.endpoints(user_id);
create index idx_logs_user_time on public.logs(user_id, timestamp desc);
create index idx_logs_level on public.logs(level);
create index idx_logs_service on public.logs(service);
create index idx_logs_meta_gin on public.logs using gin(meta);
create index idx_alert_rules_user on public.alert_rules(user_id);
create index idx_alert_events_rule_time on public.alert_events(rule_id, occurred_at desc);
create index idx_saved_queries_user on public.saved_queries(user_id);
create index idx_webhook_deliveries_endpoint on public.webhook_deliveries(endpoint_id);

-- Triggers
create trigger tg_profiles_updated_at
before update on public.profiles
for each row execute function public.update_updated_at_column();

create trigger tg_endpoints_updated_at
before update on public.endpoints
for each row execute function public.update_updated_at_column();

create trigger tg_alert_rules_updated_at
before update on public.alert_rules
for each row execute function public.update_updated_at_column();

create trigger tg_saved_queries_updated_at
before update on public.saved_queries
for each row execute function public.update_updated_at_column();

create trigger tg_user_settings_updated_at
before update on public.user_settings
for each row execute function public.update_updated_at_column();

create trigger tg_validate_endpoints_biud
before insert or update on public.endpoints
for each row execute function public.tg_validate_endpoints();

create trigger tg_validate_user_settings_biud
before insert or update on public.user_settings
for each row execute function public.tg_validate_user_settings();

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.endpoints enable row level security;
alter table public.logs enable row level security;
alter table public.alert_rules enable row level security;
alter table public.alert_events enable row level security;
alter table public.saved_queries enable row level security;
alter table public.user_settings enable row level security;
alter table public.webhook_deliveries enable row level security;

-- Policies (owner-based)
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert their own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update their own profile" on public.profiles for update using (auth.uid() = id);

create policy "Owner can read endpoints" on public.endpoints for select using (auth.uid() = user_id);
create policy "Owner can insert endpoints" on public.endpoints for insert with check (auth.uid() = user_id);
create policy "Owner can update endpoints" on public.endpoints for update using (auth.uid() = user_id);
create policy "Owner can delete endpoints" on public.endpoints for delete using (auth.uid() = user_id);

create policy "Owner can read logs" on public.logs for select using (auth.uid() = user_id);
create policy "Owner can insert logs" on public.logs for insert with check (auth.uid() = user_id);
create policy "Owner can update logs" on public.logs for update using (auth.uid() = user_id);
create policy "Owner can delete logs" on public.logs for delete using (auth.uid() = user_id);

create policy "Owner can read alert rules" on public.alert_rules for select using (auth.uid() = user_id);
create policy "Owner can insert alert rules" on public.alert_rules for insert with check (auth.uid() = user_id);
create policy "Owner can update alert rules" on public.alert_rules for update using (auth.uid() = user_id);
create policy "Owner can delete alert rules" on public.alert_rules for delete using (auth.uid() = user_id);

create policy "Owner can read alert events" on public.alert_events
for select using (exists (
  select 1 from public.alert_rules r where r.id = alert_events.rule_id and r.user_id = auth.uid()
));
create policy "Owner can insert alert events" on public.alert_events
for insert with check (exists (
  select 1 from public.alert_rules r where r.id = alert_events.rule_id and r.user_id = auth.uid()
));
create policy "Owner can update alert events" on public.alert_events
for update using (exists (
  select 1 from public.alert_rules r where r.id = alert_events.rule_id and r.user_id = auth.uid()
));
create policy "Owner can delete alert events" on public.alert_events
for delete using (exists (
  select 1 from public.alert_rules r where r.id = alert_events.rule_id and r.user_id = auth.uid()
));

create policy "Owner can read saved queries" on public.saved_queries for select using (auth.uid() = user_id);
create policy "Owner can insert saved queries" on public.saved_queries for insert with check (auth.uid() = user_id);
create policy "Owner can update saved queries" on public.saved_queries for update using (auth.uid() = user_id);
create policy "Owner can delete saved queries" on public.saved_queries for delete using (auth.uid() = user_id);

create policy "Owner can read user settings" on public.user_settings for select using (auth.uid() = user_id);
create policy "Owner can insert user settings" on public.user_settings for insert with check (auth.uid() = user_id);
create policy "Owner can update user settings" on public.user_settings for update using (auth.uid() = user_id);
create policy "Owner can delete user settings" on public.user_settings for delete using (auth.uid() = user_id);

create policy "Owner can read webhook deliveries" on public.webhook_deliveries
for select using (exists (
  select 1 from public.endpoints e where e.id = webhook_deliveries.endpoint_id and e.user_id = auth.uid()
));
create policy "Owner can insert webhook deliveries" on public.webhook_deliveries
for insert with check (exists (
  select 1 from public.endpoints e where e.id = webhook_deliveries.endpoint_id and e.user_id = auth.uid()
));
create policy "Owner can update webhook deliveries" on public.webhook_deliveries
for update using (exists (
  select 1 from public.endpoints e where e.id = webhook_deliveries.endpoint_id and e.user_id = auth.uid()
));
create policy "Owner can delete webhook deliveries" on public.webhook_deliveries
for delete using (exists (
  select 1 from public.endpoints e where e.id = webhook_deliveries.endpoint_id and e.user_id = auth.uid()
));

-- Realtime configuration (optional but useful)
alter table public.logs replica identity full;
alter table public.endpoints replica identity full;
alter table public.alert_events replica identity full;

-- Add tables to realtime publication
alter publication supabase_realtime add table public.logs;
alter publication supabase_realtime add table public.endpoints;
alter publication supabase_realtime add table public.alert_events;