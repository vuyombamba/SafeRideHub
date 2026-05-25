
-- Replace handle_new_user to also seed a role
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_first boolean;
begin
  insert into public.profiles (user_id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email))
  on conflict do nothing;

  select count(*) = 0 into is_first from public.user_roles;

  insert into public.user_roles (user_id, role)
  values (new.id, case when is_first then 'admin'::app_role else 'parent'::app_role end)
  on conflict do nothing;

  return new;
end $$;

-- Ensure the trigger exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
