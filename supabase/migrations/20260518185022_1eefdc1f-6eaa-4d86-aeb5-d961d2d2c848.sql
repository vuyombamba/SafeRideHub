-- 1. Ringing prefs columns
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS ring_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ring_volume integer NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS vibration_enabled boolean NOT NULL DEFAULT true;

-- 2. parent_drivers (created first so driver_profiles policy can reference it)
CREATE TABLE IF NOT EXISTS public.parent_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL,
  driver_user_id uuid NOT NULL,
  added_via text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_user_id, driver_user_id)
);
ALTER TABLE public.parent_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parent reads own driver links"
  ON public.parent_drivers FOR SELECT
  USING (auth.uid() = parent_user_id
    OR auth.uid() = driver_user_id
    OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Parent creates own driver link"
  ON public.parent_drivers FOR INSERT
  WITH CHECK (auth.uid() = parent_user_id);

CREATE POLICY "Parent deletes own driver link"
  ON public.parent_drivers FOR DELETE
  USING (auth.uid() = parent_user_id);

-- 3. driver_profiles
CREATE TABLE IF NOT EXISTS public.driver_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  license_number text NOT NULL,
  license_expiry date,
  license_image_url text,
  id_image_url text,
  status text NOT NULL DEFAULT 'pending',
  reviewer_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  qr_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Driver reads own profile"
  ON public.driver_profiles FOR SELECT
  USING (auth.uid() = driver_user_id
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'operator'::app_role)
    OR EXISTS (SELECT 1 FROM public.vehicles v
               WHERE v.driver_user_id = driver_profiles.driver_user_id
                 AND public.is_school_admin(auth.uid(), v.school_id))
    OR EXISTS (SELECT 1 FROM public.parent_drivers pd
               WHERE pd.driver_user_id = driver_profiles.driver_user_id
                 AND pd.parent_user_id = auth.uid()));

CREATE POLICY "Driver inserts own profile"
  ON public.driver_profiles FOR INSERT
  WITH CHECK (auth.uid() = driver_user_id);

CREATE POLICY "Driver updates own profile while pending"
  ON public.driver_profiles FOR UPDATE
  USING (auth.uid() = driver_user_id AND status <> 'verified')
  WITH CHECK (auth.uid() = driver_user_id);

CREATE POLICY "Admins/operators manage driver profiles"
  ON public.driver_profiles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'operator'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'operator'::app_role));

CREATE POLICY "School admin manages drivers in their fleet"
  ON public.driver_profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.vehicles v
                 WHERE v.driver_user_id = driver_profiles.driver_user_id
                   AND public.is_school_admin(auth.uid(), v.school_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vehicles v
                 WHERE v.driver_user_id = driver_profiles.driver_user_id
                   AND public.is_school_admin(auth.uid(), v.school_id)));

CREATE TRIGGER trg_driver_profiles_updated
  BEFORE UPDATE ON public.driver_profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4. RPC
CREATE OR REPLACE FUNCTION public.link_driver_by_qr(_qr_token uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _driver uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT driver_user_id INTO _driver FROM public.driver_profiles WHERE qr_token = _qr_token;
  IF _driver IS NULL THEN RAISE EXCEPTION 'Invalid QR code'; END IF;
  INSERT INTO public.parent_drivers (parent_user_id, driver_user_id, added_via)
  VALUES (auth.uid(), _driver, 'qr')
  ON CONFLICT (parent_user_id, driver_user_id) DO NOTHING;
  RETURN _driver;
END $$;

-- 5. Private bucket for driver docs
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-docs', 'driver-docs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Driver uploads own docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'driver-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Driver reads own docs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'driver-docs'
    AND (auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin'::app_role)
      OR public.has_role(auth.uid(), 'operator'::app_role)));

CREATE POLICY "Driver updates own docs"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'driver-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Driver deletes own docs"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'driver-docs'
    AND auth.uid()::text = (storage.foldername(name))[1]);