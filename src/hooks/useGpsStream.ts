import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Options { vehicleId: string | null; enabled: boolean; minIntervalMs?: number; }

/**
 * Streams the device's GPS to the `vehicles` row and `gps_pings` table.
 * Throttled to honour the sub-2s realtime budget (default 1500ms).
 */
export function useGpsStream({ vehicleId, enabled, minIntervalMs = 1500 }: Options) {
  const [error, setError] = useState<string | null>(null);
  const [lastFix, setLastFix] = useState<{ lat: number; lng: number; at: number } | null>(null);
  const watchId = useRef<number | null>(null);
  const lastWrite = useRef(0);

  useEffect(() => {
    if (!enabled || !vehicleId) return;
    if (!("geolocation" in navigator)) { setError("Geolocation not available"); return; }

    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now();
        const { latitude: lat, longitude: lng, speed, heading } = pos.coords;
        setLastFix({ lat, lng, at: now });
        if (now - lastWrite.current < minIntervalMs) return;
        lastWrite.current = now;
        await Promise.all([
          supabase.from("vehicles").update({ lat, lng, status: "en_route" }).eq("id", vehicleId),
          supabase.from("gps_pings").insert({ vehicle_id: vehicleId, lat, lng, speed, heading }),
        ]);
      },
      (err) => setError(err.message),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );

    return () => {
      if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [vehicleId, enabled, minIntervalMs]);

  return { error, lastFix };
}
