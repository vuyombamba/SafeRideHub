import { useEffect, useRef, useCallback } from "react";

interface LatLng { lat: number; lng: number }

interface ProximityMatch {
  vehicleId: string;
  vehiclePlate: string;
  studentId: string;
  studentName: string;
  distanceMeters: number;
}

interface Vehicle extends LatLng {
  id: string;
  plate_number: string;
  status: string;
}

interface Student {
  id: string;
  name: string;
  pickup_lat: number | null;
  pickup_lng: number | null;
  route_id: string | null;
}

export interface NotificationPreference {
  student_id: string;
  radius_meters: number;
  mute_until: string | null;
  push_enabled: boolean;
}

const DEFAULT_RADIUS = 500;
const ALERT_COOLDOWN_MS = 15000;

function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function playAlertSound() {
  try {
    const ctx = new AudioContext();
    const beep = (freq: number, start: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "square"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.3, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + 0.6);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + 0.6);
    };
    beep(880, 0); beep(1100, 0.15);
  } catch { /* ignore */ }
}

export function useProximityAlerts(
  vehicles: Vehicle[],
  students: Student[],
  onAlert: (matches: ProximityMatch[]) => void,
  preferences?: NotificationPreference[]
) {
  const lastAlertedRef = useRef<Map<string, number>>(new Map());

  const prefByStudent = (id: string): NotificationPreference | undefined =>
    preferences?.find((p) => p.student_id === id);

  const checkProximity = useCallback(() => {
    const now = Date.now();
    const matches: ProximityMatch[] = [];

    for (const vehicle of vehicles) {
      if (vehicle.status !== "en_route") continue;

      for (const student of students) {
        if (student.pickup_lat == null || student.pickup_lng == null) continue;
        const pref = prefByStudent(student.id);
        if (pref) {
          if (!pref.push_enabled) continue;
          if (pref.mute_until && new Date(pref.mute_until).getTime() > now) continue;
        }
        const radius = pref?.radius_meters ?? DEFAULT_RADIUS;

        const distance = haversineMeters(
          { lat: vehicle.lat, lng: vehicle.lng },
          { lat: student.pickup_lat, lng: student.pickup_lng }
        );
        if (distance <= radius) {
          const key = `${vehicle.id}-${student.id}`;
          const last = lastAlertedRef.current.get(key) ?? 0;
          if (now - last > ALERT_COOLDOWN_MS) {
            lastAlertedRef.current.set(key, now);
            matches.push({
              vehicleId: vehicle.id,
              vehiclePlate: vehicle.plate_number,
              studentId: student.id,
              studentName: student.name,
              distanceMeters: Math.round(distance),
            });
          }
        }
      }
    }

    if (matches.length > 0) {
      playAlertSound();
      onAlert(matches);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicles, students, preferences, onAlert]);

  useEffect(() => {
    if (vehicles.length === 0 || students.length === 0) return;
    checkProximity();
  }, [checkProximity, vehicles.length, students.length]);
}

export type { ProximityMatch };
