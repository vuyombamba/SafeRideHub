create table if not exists public.children (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null,
  full_name text not null,
  age int,
  gender text,
  phone text,
  allergies text,
  about text,
  avatar_url text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.children enable row level security;

create policy "Parents view own children" on public.children
  for select using (auth.uid() = parent_user_id or public.has_role(auth.uid(),'operator') or public.has_role(auth.uid(),'admin'));
create policy "Parents insert own children" on public.children
  for insert with check (auth.uid() = parent_user_id);
create policy "Parents update own children" on public.children
  for update using (auth.uid() = parent_user_id or public.has_role(auth.uid(),'admin'));
create policy "Parents delete own children" on public.children
  for delete using (auth.uid() = parent_user_id or public.has_role(auth.uid(),'admin'));
create policy "Operators manage children" on public.children
  for all using (public.has_role(auth.uid(),'operator') or public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'operator') or public.has_role(auth.uid(),'admin'));

create trigger trg_children_updated_at
  before update on public.children
  for each row execute function public.tg_set_updated_at();

create index if not exists idx_children_parent on public.children(parent_user_id);