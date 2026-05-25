
-- 1. Extend role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'driver';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school';

-- 2. Schools table
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  contact_phone text,
  admin_user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admin reads own school" ON public.schools
  FOR SELECT USING (auth.uid() = admin_user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "School admin inserts own school" ON public.schools
  FOR INSERT WITH CHECK (auth.uid() = admin_user_id);
CREATE POLICY "School admin updates own school" ON public.schools
  FOR UPDATE USING (auth.uid() = admin_user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin deletes schools" ON public.schools
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER schools_set_updated_at BEFORE UPDATE ON public.schools
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 3. school_id + driver_user_id on related tables
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS driver_user_id uuid;
ALTER TABLE public.routes   ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL;
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL;

-- helper: is this user the school admin for a given school_id?
CREATE OR REPLACE FUNCTION public.is_school_admin(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.schools WHERE id = _school_id AND admin_user_id = _user_id)
$$;

-- 4. Refresh vehicles RLS to include school + driver + parent visibility
DROP POLICY IF EXISTS "Operators write vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Public read vehicles" ON public.vehicles;

CREATE POLICY "Read vehicles by role" ON public.vehicles
  FOR SELECT USING (
    has_role(auth.uid(), 'admin')
    OR has_role(auth.uid(), 'operator')
    OR is_school_admin(auth.uid(), school_id)
    OR auth.uid() = driver_user_id
    OR EXISTS (
      SELECT 1 FROM public.parent_students ps
      JOIN public.students s ON s.id = ps.student_id
      WHERE ps.parent_user_id = auth.uid()
        AND s.route_id IN (SELECT id FROM public.routes WHERE school_id = vehicles.school_id)
    )
  );
CREATE POLICY "Operators/admin write vehicles" ON public.vehicles
  FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "School admin manages own vehicles" ON public.vehicles
  FOR ALL USING (is_school_admin(auth.uid(), school_id))
  WITH CHECK (is_school_admin(auth.uid(), school_id));
CREATE POLICY "Driver updates own vehicle" ON public.vehicles
  FOR UPDATE USING (auth.uid() = driver_user_id)
  WITH CHECK (auth.uid() = driver_user_id);

-- routes RLS
DROP POLICY IF EXISTS "Operators write routes" ON public.routes;
DROP POLICY IF EXISTS "Public read routes" ON public.routes;
CREATE POLICY "Read routes" ON public.routes
  FOR SELECT USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator')
    OR is_school_admin(auth.uid(), school_id)
    OR auth.uid() IS NOT NULL
  );
CREATE POLICY "Operators/admin write routes" ON public.routes
  FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "School admin manages own routes" ON public.routes
  FOR ALL USING (is_school_admin(auth.uid(), school_id))
  WITH CHECK (is_school_admin(auth.uid(), school_id));

-- students RLS
DROP POLICY IF EXISTS "Operators write students" ON public.students;
DROP POLICY IF EXISTS "Public read students" ON public.students;
CREATE POLICY "Read students" ON public.students
  FOR SELECT USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator')
    OR is_school_admin(auth.uid(), school_id)
    OR EXISTS (SELECT 1 FROM public.parent_students ps WHERE ps.student_id = students.id AND ps.parent_user_id = auth.uid())
  );
CREATE POLICY "Operators/admin write students" ON public.students
  FOR ALL USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'))
  WITH CHECK (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator'));
CREATE POLICY "School admin manages own students" ON public.students
  FOR ALL USING (is_school_admin(auth.uid(), school_id))
  WITH CHECK (is_school_admin(auth.uid(), school_id));

-- 5. gps_pings table
CREATE TABLE IF NOT EXISTS public.gps_pings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  speed double precision,
  heading double precision,
  recorded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gps_pings_vehicle_time_idx ON public.gps_pings(vehicle_id, recorded_at DESC);
ALTER TABLE public.gps_pings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver inserts own pings" ON public.gps_pings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND v.driver_user_id = auth.uid())
  );
CREATE POLICY "Read pings by vehicle access" ON public.gps_pings
  FOR SELECT USING (
    has_role(auth.uid(),'admin') OR has_role(auth.uid(),'operator')
    OR EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id AND (
      v.driver_user_id = auth.uid()
      OR is_school_admin(auth.uid(), v.school_id)
    ))
  );

-- 6. Realtime publication
ALTER TABLE public.vehicles REPLICA IDENTITY FULL;
ALTER TABLE public.gps_pings REPLICA IDENTITY FULL;
ALTER TABLE public.trip_logs REPLICA IDENTITY FULL;
DO $$ BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='vehicles';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles; END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='gps_pings';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.gps_pings; END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='trip_logs';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_logs; END IF;
END $$;

-- 7. Secure signup RPC: allows a freshly-authenticated user to claim one of the safe self-serve roles
CREATE OR REPLACE FUNCTION public.assign_self_role(_role app_role)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _role NOT IN ('parent','driver','school') THEN
    RAISE EXCEPTION 'Role % cannot be self-assigned', _role;
  END IF;
  -- Remove default parent role inserted by handle_new_user if user is upgrading to driver/school
  DELETE FROM public.user_roles WHERE user_id = auth.uid() AND role = 'parent' AND _role <> 'parent';
  INSERT INTO public.user_roles(user_id, role) VALUES (auth.uid(), _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;

-- 8. Wipe existing sample data
DELETE FROM public.gps_pings;
DELETE FROM public.trip_logs;
DELETE FROM public.parent_students;
DELETE FROM public.students;
DELETE FROM public.routes;
DELETE FROM public.vehicles;
