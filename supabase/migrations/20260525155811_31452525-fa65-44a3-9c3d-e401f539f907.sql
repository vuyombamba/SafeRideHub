-- 1) Protect driver_profiles protected fields from self-edit
CREATE OR REPLACE FUNCTION public.tg_protect_driver_profile_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow admins/operators or school admins managing this driver to change protected fields
  IF has_role(auth.uid(), 'admin'::app_role)
     OR has_role(auth.uid(), 'operator'::app_role)
     OR EXISTS (
       SELECT 1 FROM public.vehicles v
       WHERE v.driver_user_id = NEW.driver_user_id
         AND is_school_admin(auth.uid(), v.school_id)
     )
  THEN
    RETURN NEW;
  END IF;

  -- Otherwise (the driver themselves), forbid changing protected fields
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewer_notes IS DISTINCT FROM OLD.reviewer_notes
     OR NEW.driver_user_id IS DISTINCT FROM OLD.driver_user_id
     OR NEW.qr_token IS DISTINCT FROM OLD.qr_token
  THEN
    RAISE EXCEPTION 'Drivers cannot modify verification or reviewer fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_driver_profile_fields ON public.driver_profiles;
CREATE TRIGGER protect_driver_profile_fields
BEFORE UPDATE ON public.driver_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_protect_driver_profile_fields();

-- 2) Revoke anon EXECUTE from SECURITY DEFINER helpers. They only need to run for signed-in users (RLS context).
REVOKE EXECUTE ON FUNCTION public.is_school_admin(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.assign_self_role(public.app_role) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.link_driver_by_qr(uuid) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_school_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_self_role(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_driver_by_qr(uuid) TO authenticated;