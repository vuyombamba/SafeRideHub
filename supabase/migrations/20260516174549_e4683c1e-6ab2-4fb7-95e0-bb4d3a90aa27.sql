
REVOKE EXECUTE ON FUNCTION public.assign_self_role(public.app_role) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.assign_self_role(public.app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_school_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.is_school_admin(uuid, uuid) TO authenticated;
