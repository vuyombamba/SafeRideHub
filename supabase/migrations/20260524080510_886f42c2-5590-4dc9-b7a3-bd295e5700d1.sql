
-- 1. Lock down parent_drivers: force creation via link_driver_by_qr RPC (SECURITY DEFINER)
DROP POLICY IF EXISTS "Parent creates own driver link" ON public.parent_drivers;
-- Allow admins/operators to insert manually
CREATE POLICY "Admins/operators create driver link"
ON public.parent_drivers FOR INSERT
WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'operator'::app_role));

-- 2. Lock down parent_students self-insert
DROP POLICY IF EXISTS "Parents create own link" ON public.parent_students;
-- Operators/admin "Operators manage links" policy already exists for ALL

-- 3. Profiles: restrict SELECT to authenticated and only own profile + linked relationships
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(),'admin'::app_role)
  OR has_role(auth.uid(),'operator'::app_role)
  OR EXISTS (SELECT 1 FROM public.parent_drivers pd
             WHERE (pd.parent_user_id = auth.uid() AND pd.driver_user_id = profiles.user_id)
                OR (pd.driver_user_id = auth.uid() AND pd.parent_user_id = profiles.user_id))
);

-- 4. Routes: remove blanket authenticated read
DROP POLICY IF EXISTS "Read routes" ON public.routes;
CREATE POLICY "Read routes scoped"
ON public.routes FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(),'admin'::app_role)
  OR has_role(auth.uid(),'operator'::app_role)
  OR is_school_admin(auth.uid(), school_id)
  OR EXISTS (
    SELECT 1 FROM public.parent_students ps
    JOIN public.students s ON s.id = ps.student_id
    WHERE ps.parent_user_id = auth.uid() AND s.route_id = routes.id
  )
  OR EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.driver_user_id = auth.uid() AND v.school_id = routes.school_id
  )
);

-- 5. Trip logs: remove public read
DROP POLICY IF EXISTS "Public read trip_logs" ON public.trip_logs;
CREATE POLICY "Read trip_logs scoped"
ON public.trip_logs FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(),'admin'::app_role)
  OR has_role(auth.uid(),'operator'::app_role)
  OR EXISTS (
    SELECT 1 FROM public.vehicles v
    WHERE v.id = trip_logs.vehicle_id
      AND (v.driver_user_id = auth.uid() OR is_school_admin(auth.uid(), v.school_id))
  )
  OR EXISTS (
    SELECT 1 FROM public.parent_students ps
    JOIN public.students s ON s.id = ps.student_id
    WHERE ps.parent_user_id = auth.uid()
      AND (s.route_id = trip_logs.route_id
           OR EXISTS (SELECT 1 FROM public.vehicles v2 WHERE v2.id = trip_logs.vehicle_id AND v2.school_id = s.school_id))
  )
);

-- 6. Revoke EXECUTE on SECURITY DEFINER helpers/triggers from anon & authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_school_admin(uuid, uuid) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.tg_audit_user_roles() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM anon, authenticated, public;
-- Keep user-callable RPCs accessible
GRANT EXECUTE ON FUNCTION public.assign_self_role(app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_driver_by_qr(uuid) TO authenticated;
