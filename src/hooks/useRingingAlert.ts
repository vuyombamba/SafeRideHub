import { useEffect, useRef, useState, useCallback, useMemo } from "react";

interface LatLng { lat: number; lng: number }
interface Vehicle extends LatLng { id: string; plate_number: string; status: string }
interface Student { id: string; name: string; pickup_lat: number | null; pickup_lng: number | null }

export interface RingPreferenceMap {
  [studentId: string]: {
    ring_enabled: boolean;
    ring_volume: number; // 0..100
    vibration_enabled: boolean;
  };
}

export interface RingingAlert {
  vehicleId: string;
  vehiclePlate: string;
  studentId: string;
  studentName: string;
  distanceMeters: number;
  etaMinutes: number;
  enteredAt: number;
}

const AVG_SPEED_KMH = 30;

function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Continuous looping ringtone with adjustable gain. */
function createRinger() {
  let ctx: AudioContext | null = null;
  let interval: number | null = null;
  let volume = 0.8; // 0..1
  return {
    setVolume(v: number) { volume = Math.max(0, Math.min(1, v)); },
    start() {
      if (interval != null) return;
      try {
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const play = () => {
          if (!ctx) return;
          const now = ctx.currentTime;
          const peak = Math.max(0.0002, 0.5 * volume);
          [880, 1320, 880, 1320].forEach((freq, i) => {
            const o = ctx!.createOscillator();
            const g = ctx!.createGain();
            o.connect(g); g.connect(ctx!.destination);
            o.type = "sine";
            o.frequency.value = freq;
            const t = now + i * 0.22;
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(peak, t + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
            o.start(t);
            o.stop(t + 0.22);
          });
        };
        play();
        interval = window.setInterval(play, 1100);
      } catch { /* ignore */ }
    },
    stop() {
      if (interval != null) { clearInterval(interval); interval = null; }
      if (ctx) { ctx.close().catch(() => undefined); ctx = null; }
    },
  };
}

export function useRingingAlert(
  vehicles: Vehicle[],
  students: Student[],
  nearRadiusMeters = 500,
  preferences: RingPreferenceMap = {}
) {
  const [active, setActive] = useState<RingingAlert | null>(null);
  const acknowledgedRef = useRef<Set<string>>(new Set());
  const ringerRef = useRef<ReturnType<typeof createRinger> | null>(null);
  const prefsRef = useRef(preferences);
  prefsRef.current = preferences;

  useEffect(() => {
    if (!ringerRef.current) ringerRef.current = createRinger();
    return () => { ringerRef.current?.stop(); };
  }, []);

  // Stable serialization key so changes in vehicle position don't churn the effect identity
  const vehiclesKey = useMemo(
    () => vehicles.map((v) => `${v.id}:${v.lat.toFixed(5)}:${v.lng.toFixed(5)}:${v.status}`).join("|"),
    [vehicles]
  );
  const studentsKey = useMemo(
    () => students.map((s) => `${s.id}:${s.pickup_lat}:${s.pickup_lng}`).join("|"),
    [students]
  );

  useEffect(() => {
    let best: RingingAlert | null = null;
    for (const v of vehicles) {
      if (v.status !== "en_route") continue;
      for (const s of students) {
        if (s.pickup_lat == null || s.pickup_lng == null) continue;
        const pref = prefsRef.current[s.id];
        if (pref && pref.ring_enabled === false) continue;
        const key = `${v.id}-${s.id}`;
        const d = haversineMeters(
          { lat: v.lat, lng: v.lng },
          { lat: s.pickup_lat, lng: s.pickup_lng }
        );
        if (d > nearRadiusMeters) {
          acknowledgedRef.current.delete(key);
          continue;
        }
        if (acknowledgedRef.current.has(key)) continue;
        const etaMinutes = Math.max(1, Math.round((d / 1000) / AVG_SPEED_KMH * 60));
        if (!best || d < best.distanceMeters) {
          best = {
            vehicleId: v.id,
            vehiclePlate: v.plate_number,
            studentId: s.id,
            studentName: s.name,
            distanceMeters: Math.round(d),
            etaMinutes,
            enteredAt: Date.now(),
          };
        }
      }
    }

    setActive((prev) => {
      if (best && (!prev || best.vehicleId !== prev.vehicleId || best.studentId !== prev.studentId)) {
        const pref = prefsRef.current[best.studentId];
        const vol = pref ? pref.ring_volume / 100 : 0.8;
        ringerRef.current?.setVolume(vol);
        ringerRef.current?.start();
        if ((!pref || pref.vibration_enabled !== false) && navigator.vibrate) {
          navigator.vibrate([400, 200, 400, 200, 600]);
        }
        return best;
      }
      if (!best && prev) {
        ringerRef.current?.stop();
        return null;
      }
      if (best && prev && best.vehicleId === prev.vehicleId && best.studentId === prev.studentId) {
        // live update distance/eta
        return best;
      }
      return prev;
    });
  }, [vehiclesKey, studentsKey, nearRadiusMeters]); // eslint-disable-line react-hooks/exhaustive-deps

  const dismiss = useCallback(() => {
    setActive((prev) => {
      if (prev) acknowledgedRef.current.add(`${prev.vehicleId}-${prev.studentId}`);
      ringerRef.current?.stop();
      return null;
    });
  }, []);

  return { active, dismiss };
}
