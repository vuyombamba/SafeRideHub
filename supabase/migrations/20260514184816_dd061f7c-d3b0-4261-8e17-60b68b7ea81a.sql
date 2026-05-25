-- Audit log for role changes
create table if not exists public.role_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  target_user_id uuid not null,
  role app_role not null,
  action text not null check (action in ('grant','revoke')),
  created_at timestamptz not null default now()
);

alter table public.role_audit_log enable row level security;

create policy "Admins read audit log"
  on public.role_audit_log for select
  using (public.has_role(auth.uid(), 'admin'));

-- Audit trigger
create or replace function public.tg_audit_user_roles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    insert into public.role_audit_log(actor_user_id, target_user_id, role, action)
    values (auth.uid(), new.user_id, new.role, 'grant');
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.role_audit_log(actor_user_id, target_user_id, role, action)
    values (auth.uid(), old.user_id, old.role, 'revoke');
    return old;
  end if;
  return null;
end $$;

drop trigger if exists trg_audit_user_roles on public.user_roles;
create trigger trg_audit_user_roles
after insert or delete on public.user_roles
for each row execute function public.tg_audit_user_roles();

-- Harden user_roles RLS: drop the broad "Admins manage roles" ALL policy and split
drop policy if exists "Admins manage roles" on public.user_roles;

create policy "Admins insert roles"
  on public.user_roles for insert
  with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins delete roles"
  on public.user_roles for delete
  using (public.has_role(auth.uid(), 'admin'));

create policy "Admins update roles"
  on public.user_roles for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Ensure auth trigger to seed first admin / parent role exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();