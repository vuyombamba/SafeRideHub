-- ============ ENUM ============
do $$ begin
  create type public.app_role as enum ('admin', 'operator', 'parent');
exception when duplicate_object then null; end $$;

-- ============ PROFILES ============
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);
create policy "Users update own profile"
  on public.profiles for update using (auth.uid() = user_id);
create policy "Users insert own profile"
  on public.profiles for insert with check (auth.uid() = user_id);

-- ============ USER ROLES ============
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Users see own roles"
  on public.user_roles for select using (auth.uid() = user_id);
create policy "Admins manage roles"
  on public.user_roles for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ============ PARENT <-> STUDENTS ============
create table if not exists public.parent_students (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null,
  student_id uuid not null references public.students(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (parent_user_id, student_id)
);
alter table public.parent_students enable row level security;
create policy "Parents see own links"
  on public.parent_students for select
  using (auth.uid() = parent_user_id or public.has_role(auth.uid(), 'operator') or public.has_role(auth.uid(), 'admin'));
create policy "Parents create own link"
  on public.parent_students for insert
  with check (auth.uid() = parent_user_id);
create policy "Parents delete own link"
  on public.parent_students for delete
  using (auth.uid() = parent_user_id);
create policy "Operators manage links"
  on public.parent_students for all
  using (public.has_role(auth.uid(), 'operator') or public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'operator') or public.has_role(auth.uid(), 'admin'));

-- ============ NOTIFICATION PREFERENCES ============
create table if not exists public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null,
  student_id uuid not null references public.students(id) on delete cascade,
  radius_meters integer not null default 500,
  mute_until timestamptz,
  push_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  parent_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parent_user_id, student_id)
);
alter table public.notification_preferences enable row level security;
create policy "Parents view own prefs"
  on public.notification_preferences for select using (auth.uid() = parent_user_id);
create policy "Parents insert own prefs"
  on public.notification_preferences for insert with check (auth.uid() = parent_user_id);
create policy "Parents update own prefs"
  on public.notification_preferences for update using (auth.uid() = parent_user_id);
create policy "Parents delete own prefs"
  on public.notification_preferences for delete using (auth.uid() = parent_user_id);

-- ============ SMS LOG (stub provider) ============
create table if not exists public.sms_log (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid,
  student_id uuid,
  vehicle_id uuid,
  to_phone text not null,
  body text not null,
  status text not null default 'queued',
  provider text not null default 'stub',
  error text,
  created_at timestamptz not null default now()
);
alter table public.sms_log enable row level security;
create policy "Parents read own sms log"
  on public.sms_log for select
  using (auth.uid() = parent_user_id or public.has_role(auth.uid(), 'admin'));

-- ============ TIGHTEN OPERATIONAL TABLES (operator/admin write) ============
do $$ begin
  create policy "Operators write vehicles" on public.vehicles
    for all using (public.has_role(auth.uid(), 'operator') or public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'operator') or public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Operators write routes" on public.routes
    for all using (public.has_role(auth.uid(), 'operator') or public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'operator') or public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Operators write students" on public.students
    for all using (public.has_role(auth.uid(), 'operator') or public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'operator') or public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Operators write trip_logs" on public.trip_logs
    for all using (public.has_role(auth.uid(), 'operator') or public.has_role(auth.uid(), 'admin'))
    with check (public.has_role(auth.uid(), 'operator') or public.has_role(auth.uid(), 'admin'));
exception when duplicate_object then null; end $$;

-- ============ updated_at TRIGGERS ============
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.tg_set_updated_at();

drop trigger if exists set_notif_prefs_updated_at on public.notification_preferences;
create trigger set_notif_prefs_updated_at before update on public.notification_preferences
  for each row execute function public.tg_set_updated_at();

-- ============ AUTO-CREATE PROFILE ON SIGNUP ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ REALTIME ============
alter table public.vehicles replica identity full;
do $$ begin
  perform 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'vehicles';
  if not found then
    execute 'alter publication supabase_realtime add table public.vehicles';
  end if;
end $$;