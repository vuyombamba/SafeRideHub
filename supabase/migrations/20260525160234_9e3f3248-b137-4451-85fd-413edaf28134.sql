CREATE POLICY "Driver inserts own vehicle"
ON public.vehicles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = driver_user_id
  AND has_role(auth.uid(), 'driver'::app_role)
);