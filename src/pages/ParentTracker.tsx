import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Bell, Bus, Navigation, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProximityAlerts, type ProximityMatch, type NotificationPreference } from "@/hooks/useProximityAlerts";
import { useRingingAlert } from "@/hooks/useRingingAlert";
import { ProximityRingDialog } from "@/components/ProximityRingDialog";
import { NotificationSettings } from "@/components/NotificationSettings";
import { useAuth } from "@/hooks/useAuth";
import { BottomTabs } from "@/components/parent/BottomTabs";

const DEFAULT_CENTER: [number, number] = [-26.2041, 28.0473];
const MAP_ZOOM = 13;
const SIMULATION_INTERVAL_MS = 3000;
const DRIFT_AMOUNT = 0.002;

const busIcon = new L.DivIcon({
  html: `<div style="background:#f59e0b;width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,0.4);">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
  </div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const pickupIcon = new L.DivIcon({
  html: `<div style="background:#3b82f6;width:22px;height:22px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.35);"></div>`,
  className: "",
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

interface Vehicle {
  id: string;
  plate_number: string;
  driver_name: string;
  status: string;
  lat: number;
  lng: number;
}

interface Student {
  id: string;
  name: string;
  route_id: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
}

// Haversine for ETA estimation
function haversineMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const ParentTracker = () => {
  const { user, signOut } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [alerts, setAlerts] = useState<ProximityMatch[]>([]);
  const [latestAlert, setLatestAlert] = useState<ProximityMatch | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const leafletMap = useRef<L.Map | null>(null);
  const vehicleMarkers = useRef<Map<string, L.Marker>>(new Map());
  const studentMarkers = useRef<Map<string, L.Marker>>(new Map());
  const hasCentered = useRef(false);

  const handleAlert = useCallback((matches: ProximityMatch[]) => {
    setAlerts((prev) => [...matches, ...prev].slice(0, 30));
    setLatestAlert(matches[0]);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);

    // SMS fallback if enabled & phone present
    matches.forEach((m) => {
      const pref = preferences.find((p) => p.student_id === m.studentId) as
        | (NotificationPreference & { sms_enabled?: boolean; parent_phone?: string | null })
        | undefined;
      if (pref?.sms_enabled && pref?.parent_phone) {
        supabase.functions.invoke("send-sms-fallback", {
          body: {
            student_id: m.studentId,
            vehicle_id: m.vehicleId,
            to_phone: pref.parent_phone,
            body: `🚌 ${m.vehiclePlate} is ${m.distanceMeters}m from ${m.studentName}'s pickup.`,
          },
        }).catch(() => undefined);
      }
    });
  }, [preferences]);

  useProximityAlerts(vehicles, students, handleAlert, preferences);
  // Build per-student ring prefs from notification_preferences
  const ringPrefsMap = preferences.reduce((acc, p: any) => {
    acc[p.student_id] = {
      ring_enabled: p.ring_enabled ?? true,
      ring_volume: p.ring_volume ?? 80,
      vibration_enabled: p.vibration_enabled ?? true,
    };
    return acc;
  }, {} as Record<string, { ring_enabled: boolean; ring_volume: number; vibration_enabled: boolean }>);
  const { active: ringingAlert, dismiss: dismissRing } = useRingingAlert(vehicles, students, 500, ringPrefsMap);

  // Fetch data + realtime + simulation
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const links = await supabase.from("parent_students").select("student_id").eq("parent_user_id", user.id);
      const linkedIds = (links.data ?? []).map((l) => l.student_id);
      if (linkedIds.length === 0) {
        setStudents([]); setVehicles([]); setPreferences([]);
        return;
      }
      const { data: studentRows } = await supabase.from("students").select("*").in("id", linkedIds);
      setStudents(studentRows ?? []);
      const routeIds = Array.from(new Set((studentRows ?? []).map((s: any) => s.route_id).filter(Boolean)));
      const vehicleQ = routeIds.length
        ? supabase.from("vehicles").select("*")  // RLS scopes this to vehicles the parent may see
        : Promise.resolve({ data: [] as any[] });
      const [v, p] = await Promise.all([
        vehicleQ as any,
        supabase.from("notification_preferences").select("*").eq("parent_user_id", user.id),
      ]);
      if (v.data) setVehicles(v.data);
      if (p.data) setPreferences(p.data as NotificationPreference[]);
    };
    fetchData();

    const channel = supabase
      .channel("parent-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, (payload) => {
        if (payload.eventType === "UPDATE") {
          setVehicles((prev) =>
            prev.map((v) => (v.id === (payload.new as Vehicle).id ? (payload.new as Vehicle) : v))
          );
        } else if (payload.eventType === "INSERT") {
          setVehicles((prev) => [...prev, payload.new as Vehicle]);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "notification_preferences", filter: `parent_user_id=eq.${user.id}` }, () => {
        supabase.from("notification_preferences").select("*").eq("parent_user_id", user.id)
          .then(({ data }) => { if (data) setPreferences(data as NotificationPreference[]); });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Init map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const map = L.map(mapRef.current, { zoomControl: false }).setView(DEFAULT_CENTER, MAP_ZOOM);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; CARTO &copy; OSM',
    }).addTo(map);
    L.control.zoom({ position: "bottomright" }).addTo(map);
    leafletMap.current = map;
    requestAnimationFrame(() => map.invalidateSize());
    return () => {
      vehicleMarkers.current.forEach((m) => m.remove());
      vehicleMarkers.current.clear();
      studentMarkers.current.forEach((m) => m.remove());
      studentMarkers.current.clear();
      map.remove();
      leafletMap.current = null;
      hasCentered.current = false;
    };
  }, []);

  // Sync vehicle markers
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;
    const ids = new Set<string>();
    vehicles.forEach((v) => {
      ids.add(v.id);
      const pos: [number, number] = [v.lat, v.lng];
      const existing = vehicleMarkers.current.get(v.id);
      if (existing) {
        existing.setLatLng(pos);
      } else {
        const m = L.marker(pos, { icon: busIcon }).addTo(map);
        m.bindPopup(`<b>${v.plate_number}</b><br/>${v.driver_name}`);
        vehicleMarkers.current.set(v.id, m);
      }
    });
    vehicleMarkers.current.forEach((m, id) => {
      if (!ids.has(id)) { m.remove(); vehicleMarkers.current.delete(id); }
    });
    if (!hasCentered.current && vehicles.length > 0) {
      hasCentered.current = true;
      map.setView([vehicles[0].lat, vehicles[0].lng], MAP_ZOOM);
    }
  }, [vehicles]);

  // Sync student markers
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;
    students.forEach((s) => {
      if (s.pickup_lat == null || s.pickup_lng == null) return;
      const pos: [number, number] = [s.pickup_lat, s.pickup_lng];
      const existing = studentMarkers.current.get(s.id);
      if (existing) {
        existing.setLatLng(pos);
      } else {
        const m = L.marker(pos, { icon: pickupIcon }).addTo(map);
        m.bindPopup(`<b>${s.name}</b><br/>Pickup point`);
        studentMarkers.current.set(s.id, m);
      }
    });
  }, [students]);

  // Compute nearest vehicle for each student
  const nearestInfo = students
    .filter((s) => s.pickup_lat != null && s.pickup_lng != null)
    .map((s) => {
      let minDist = Infinity;
      let nearestVehicle: Vehicle | null = null;
      for (const v of vehicles) {
        if (v.status !== "en_route") continue;
        const d = haversineMeters({ lat: v.lat, lng: v.lng }, { lat: s.pickup_lat!, lng: s.pickup_lng! });
        if (d < minDist) { minDist = d; nearestVehicle = v; }
      }
      // Rough ETA at ~30km/h avg
      const etaMin = nearestVehicle ? Math.max(1, Math.round((minDist / 1000) / 30 * 60)) : null;
      return { student: s, distance: Math.round(minDist), vehicle: nearestVehicle, etaMin };
    });

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <ProximityRingDialog alert={ringingAlert} onDismiss={dismissRing} />
      {/* Full-screen map */}
      <div ref={mapRef} className="absolute inset-0 z-0" style={{ background: "#f8fafc" }} />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-10 safe-area-top">
        <div className="mx-3 mt-3 flex items-center justify-between rounded-2xl bg-background/90 backdrop-blur-xl px-4 py-3 shadow-lg border border-border">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MapPin className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground text-base">TRAK</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="relative mr-1">
              <Bell className="h-5 w-5 text-foreground" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {alerts.length > 9 ? "9+" : alerts.length}
                </span>
              )}
            </div>
            <NotificationSettings students={students.map((s) => ({ id: s.id, name: s.name }))} />
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active alert banner */}
      {latestAlert && (
        <div className="absolute top-20 left-3 right-3 z-10 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3 rounded-2xl bg-destructive/95 backdrop-blur-xl px-4 py-3 shadow-lg">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
              <Bus className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">
                🚌 {latestAlert.vehiclePlate} is nearby!
              </p>
              <p className="text-xs text-white/80">
                {latestAlert.distanceMeters}m from {latestAlert.studentName}'s pickup
              </p>
            </div>
            <button onClick={() => setLatestAlert(null)} className="text-white/70 hover:text-white text-lg font-bold">✕</button>
          </div>
        </div>
      )}

      {/* Bottom card — student tracking info (sits above bottom tabs) */}
      <div className="absolute bottom-16 left-0 right-0 z-10 safe-area-bottom pb-[env(safe-area-inset-bottom)]">
        <div className="mx-3 mb-2 rounded-2xl bg-background/95 backdrop-blur-xl border border-border shadow-xl overflow-hidden max-h-[36vh] overflow-y-auto">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold text-foreground">My Children</span>
            </div>
          </div>
          {nearestInfo.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No students tracked yet</p>
          ) : (
            nearestInfo.map(({ student, distance, vehicle, etaMin }) => (
              <div key={student.id} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/15">
                  <span className="text-lg">🧒</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{student.name}</p>
                  {vehicle ? (
                    <p className="text-xs text-muted-foreground">
                      🚌 {vehicle.plate_number} • <span className="font-medium text-foreground">{distance < 1000 ? `${distance}m` : `${(distance / 1000).toFixed(1)}km`}</span> away
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">No active bus nearby</p>
                  )}
                </div>
                {etaMin && (
                  <Badge variant="outline" className={`text-xs shrink-0 ${distance < 500 ? "border-green-500/40 text-green-600 bg-green-500/10" : "border-primary/30 text-primary"}`}>
                    {distance < 500 ? "Arriving!" : `~${etaMin} min`}
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <BottomTabs />
    </div>
  );
};

export default ParentTracker;
