import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Bus, MapPin, Users, Bell, X, Shield, LogOut, History, ChevronUp, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useProximityAlerts, type ProximityMatch } from "@/hooks/useProximityAlerts";
import { useAuth } from "@/hooks/useAuth";

const DEFAULT_CENTER: [number, number] = [-26.2041, 28.0473];
const MAP_ZOOM = 12;
const SIMULATION_INTERVAL_MS = 3000;
const DRIFT_AMOUNT = 0.002;

const busIcon = new L.DivIcon({
  html: `<div style="background:hsl(207 89% 54%);width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 4px 14px rgba(30,144,255,0.45);">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
  </div>`,
  className: "",
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const pickupIcon = new L.DivIcon({
  html: `<div style="background:hsl(0 84% 60%);width:18px;height:18px;border-radius:50%;border:3px solid #fff;box-shadow:0 1px 6px rgba(0,0,0,0.25);"></div>`,
  className: "",
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

interface Vehicle { id: string; plate_number: string; driver_name: string; status: string; lat: number; lng: number; }
interface Student { id: string; name: string; route_id: string | null; pickup_lat: number | null; pickup_lng: number | null; }

const statusColor: Record<string, string> = {
  en_route: "bg-primary/15 text-primary border-primary/30",
  idle: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-primary/15 text-primary border-primary/30",
  scheduled: "bg-secondary text-secondary-foreground border-border",
  completed: "bg-muted text-muted-foreground border-border",
};

const Dashboard = () => {
  const { hasRole, signOut } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [alerts, setAlerts] = useState<ProximityMatch[]>([]);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const [sheetExpanded, setSheetExpanded] = useState(false);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const vMarkers = useRef<Map<string, L.Marker>>(new Map());
  const sMarkers = useRef<Map<string, L.Marker>>(new Map());
  const centered = useRef(false);

  const handleAlert = useCallback((matches: ProximityMatch[]) => {
    setAlerts((prev) => [...matches, ...prev].slice(0, 50));
  }, []);
  useProximityAlerts(vehicles, students, handleAlert);

  useEffect(() => {
    const fetchAll = async () => {
      const [v, s] = await Promise.all([
        supabase.from("vehicles").select("*"),
        supabase.from("students").select("*"),
      ]);
      if (v.data) setVehicles(v.data);
      if (s.data) setStudents(s.data);
    };
    fetchAll();

    const channel = supabase
      .channel("dashboard-vehicles")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, (payload) => {
        if (payload.eventType === "UPDATE") {
          setVehicles((prev) => prev.map((v) => (v.id === (payload.new as Vehicle).id ? (payload.new as Vehicle) : v)));
        } else if (payload.eventType === "INSERT") {
          setVehicles((prev) => [...prev, payload.new as Vehicle]);
        }
      })
      .subscribe();

    const sim = setInterval(() => {
      setVehicles((prev) => prev.map((v) => v.status === "en_route"
        ? { ...v, lat: v.lat + (Math.random() - 0.45) * DRIFT_AMOUNT, lng: v.lng + (Math.random() - 0.45) * DRIFT_AMOUNT }
        : v));
    }, SIMULATION_INTERVAL_MS);

    return () => { clearInterval(sim); supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!mapEl.current || map.current) return;
    const m = L.map(mapEl.current, { zoomControl: false }).setView(DEFAULT_CENTER, MAP_ZOOM);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { attribution: "© CARTO © OSM" }).addTo(m);
    L.control.zoom({ position: "topright" }).addTo(m);
    map.current = m;
    requestAnimationFrame(() => m.invalidateSize());
    return () => {
      vMarkers.current.forEach((x) => x.remove()); vMarkers.current.clear();
      sMarkers.current.forEach((x) => x.remove()); sMarkers.current.clear();
      m.remove(); map.current = null; centered.current = false;
    };
  }, []);

  useEffect(() => {
    const m = map.current; if (!m) return;
    const ids = new Set<string>();
    vehicles.forEach((v) => {
      ids.add(v.id);
      const pos: [number, number] = [v.lat, v.lng];
      const ex = vMarkers.current.get(v.id);
      if (ex) ex.setLatLng(pos);
      else {
        const mk = L.marker(pos, { icon: busIcon }).addTo(m);
        mk.bindPopup(`<b>${v.plate_number}</b><br/>${v.driver_name}`);
        vMarkers.current.set(v.id, mk);
      }
    });
    vMarkers.current.forEach((mk, id) => { if (!ids.has(id)) { mk.remove(); vMarkers.current.delete(id); } });
    if (!centered.current && vehicles.length > 0) {
      centered.current = true;
      m.setView([vehicles[0].lat, vehicles[0].lng], MAP_ZOOM);
    }
  }, [vehicles]);

  useEffect(() => {
    const m = map.current; if (!m) return;
    students.forEach((s) => {
      if (s.pickup_lat == null || s.pickup_lng == null) return;
      const pos: [number, number] = [s.pickup_lat, s.pickup_lng];
      const ex = sMarkers.current.get(s.id);
      if (ex) ex.setLatLng(pos);
      else {
        const mk = L.marker(pos, { icon: pickupIcon }).addTo(m);
        mk.bindPopup(`<b>${s.name}</b><br/>Pickup point`);
        sMarkers.current.set(s.id, mk);
      }
    });
  }, [students]);

  const active = vehicles.filter((v) => v.status === "en_route").length;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <div ref={mapEl} className="absolute inset-0 z-0" style={{ background: "#eef3f8" }} aria-label="Live vehicle map" />

      {/* Top floating bar */}
      <div className="absolute top-0 inset-x-0 z-20 px-3 sm:px-6 pt-3 sm:pt-5">
        <div className="mx-auto max-w-5xl flex items-center justify-between rounded-2xl bg-background/95 backdrop-blur-xl px-4 py-3 shadow-lg border border-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-bold">TRAK</p>
              <p className="text-[10px] text-muted-foreground -mt-0.5 hidden sm:block">Operator dashboard</p>
            </div>
            <Badge variant="outline" className="ml-2 hidden sm:inline-flex border-primary/30 text-xs text-primary gap-1">
              <Circle className="h-2 w-2 fill-primary text-primary animate-pulse" /> Live
            </Badge>
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0" onClick={() => setShowAlertPanel((p) => !p)} aria-label="Alerts">
              <Bell className="h-5 w-5" />
              {alerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {alerts.length > 9 ? "9+" : alerts.length}
                </span>
              )}
            </Button>
            {hasRole("admin") && (
              <>
                <Link to="/admin/roles">
                  <Button variant="ghost" size="sm" className="h-9 gap-1 hidden sm:inline-flex"><Shield className="h-4 w-4" /> Roles</Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 sm:hidden"><Shield className="h-4 w-4" /></Button>
                </Link>
                <Link to="/admin/audit">
                  <Button variant="ghost" size="sm" className="h-9 gap-1 hidden sm:inline-flex"><History className="h-4 w-4" /> Audit</Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 sm:hidden"><History className="h-4 w-4" /></Button>
                </Link>
              </>
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => signOut()} aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Floating stat pills (desktop) */}
      <div className="absolute top-24 sm:top-28 left-3 sm:left-6 z-10 hidden md:flex flex-col gap-2">
        <div className="rounded-2xl bg-background/95 backdrop-blur-xl border border-border shadow-md px-4 py-3 flex items-center gap-3 min-w-[180px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Bus className="h-5 w-5 text-primary" /></div>
          <div><p className="font-display text-xl font-bold leading-none">{active}</p><p className="text-xs text-muted-foreground mt-1">Active vehicles</p></div>
        </div>
        <div className="rounded-2xl bg-background/95 backdrop-blur-xl border border-border shadow-md px-4 py-3 flex items-center gap-3 min-w-[180px]">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10"><Users className="h-5 w-5 text-destructive" /></div>
          <div><p className="font-display text-xl font-bold leading-none">{students.length}</p><p className="text-xs text-muted-foreground mt-1">Students</p></div>
        </div>
      </div>

      {/* Alerts panel */}
      {showAlertPanel && (
        <div className="absolute top-20 right-3 sm:right-6 z-30 w-80 max-w-[calc(100vw-1.5rem)] max-h-[60vh] overflow-y-auto rounded-2xl border border-border bg-background shadow-2xl">
          <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-4 py-3">
            <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-destructive" /><span className="text-sm font-bold">Proximity alerts</span></div>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowAlertPanel(false)}><X className="h-4 w-4" /></Button>
          </div>
          {alerts.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No alerts yet</p>
          ) : alerts.map((a, i) => (
            <div key={`${a.vehicleId}-${i}`} className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/15"><Bus className="h-4 w-4 text-destructive" /></div>
              <div><p className="text-sm font-semibold">{a.vehiclePlate} approaching</p><p className="text-xs text-muted-foreground">{a.distanceMeters}m from {a.studentName}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom sheet — Uber-style */}
      <div className="absolute bottom-0 inset-x-0 z-20 px-3 sm:px-6 pb-3 sm:pb-5">
        <div className={`mx-auto max-w-5xl rounded-3xl bg-background/98 backdrop-blur-xl border border-border shadow-2xl overflow-hidden transition-all duration-300 ${sheetExpanded ? "max-h-[70vh]" : "max-h-[260px]"}`}>
          <button onClick={() => setSheetExpanded((v) => !v)} className="w-full flex flex-col items-center pt-2 pb-1">
            <span className="h-1.5 w-12 rounded-full bg-border" />
          </button>
          <div className="px-5 pb-2 flex items-center justify-between">
            <div>
              <p className="font-display text-lg font-bold">Fleet</p>
              <p className="text-xs text-muted-foreground">{active} of {vehicles.length} en route</p>
            </div>
            <div className="flex md:hidden gap-2">
              <div className="rounded-xl bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">{active} active</div>
              <div className="rounded-xl bg-secondary px-3 py-1.5 text-xs font-semibold">{students.length} kids</div>
            </div>
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex gap-1" onClick={() => setSheetExpanded((v) => !v)}>
              <ChevronUp className={`h-4 w-4 transition-transform ${sheetExpanded ? "rotate-180" : ""}`} />
              {sheetExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: sheetExpanded ? "calc(70vh - 90px)" : "180px" }}>
            {vehicles.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No vehicles registered yet</p>
            ) : vehicles.map((v) => (
              <button
                key={v.id}
                onClick={() => map.current?.setView([v.lat, v.lng], 14)}
                className="w-full flex items-center gap-3 px-5 py-3 border-t border-border hover:bg-secondary/60 transition-colors text-left"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Bus className="h-5 w-5 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{v.plate_number}</p>
                  <p className="text-xs text-muted-foreground truncate">{v.driver_name}</p>
                </div>
                <Badge variant="outline" className={`text-xs shrink-0 ${statusColor[v.status] || ""}`}>{v.status.replace("_", " ")}</Badge>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
