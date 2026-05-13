import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Bus, MapPin, Users, Circle, Bell, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useProximityAlerts, type ProximityMatch } from "@/hooks/useProximityAlerts";

const DEFAULT_CENTER: [number, number] = [-26.2041, 28.0473];
const MAP_ZOOM = 10;

// Fix leaflet default icon issue
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((L.Icon.Default.prototype as any)._getIconUrl) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
}

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const busIcon = new L.DivIcon({
  html: `<div style="background: #e67e22; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.35);">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>
  </div>`,
  className: "",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Simulate vehicle movement: small random lat/lng drift every 3 seconds
const SIMULATION_INTERVAL_MS = 3000;
const DRIFT_AMOUNT = 0.002;

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

const statusColor: Record<string, string> = {
  en_route: "bg-green-500/20 text-green-400 border-green-500/30",
  idle: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-primary/20 text-primary border-primary/30",
  scheduled: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-muted text-muted-foreground border-border",
};

const getPopupContent = (vehicle: Vehicle) => `
  <div style="font-size: 14px; line-height: 1.4; min-width: 140px;">
    <p style="font-weight: 700; font-size: 16px; margin: 0 0 4px;">${vehicle.plate_number}</p>
    <p style="margin: 0; opacity: 0.75;">Driver: ${vehicle.driver_name}</p>
    <p style="margin: 6px 0 0;">Status: <span style="font-weight: 600; color: hsl(38 92% 50%);">${vehicle.status}</span></p>
  </div>
`;

const Dashboard = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [alerts, setAlerts] = useState<ProximityMatch[]>([]);
  const [showAlertPanel, setShowAlertPanel] = useState(false);
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const vehicleMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const studentMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const hasCenteredMapRef = useRef(false);

  const handleProximityAlert = useCallback((matches: ProximityMatch[]) => {
    setAlerts((prev) => [...matches, ...prev].slice(0, 50));
    setShowAlertPanel(true);
  }, []);

  useProximityAlerts(vehicles, students, handleProximityAlert);

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
      .channel("vehicles-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "vehicles" }, (payload) => {
        if (payload.eventType === "UPDATE") {
          setVehicles((prev) =>
            prev.map((vehicle) =>
              vehicle.id === (payload.new as Vehicle).id ? (payload.new as Vehicle) : vehicle
            )
          );
        }
      })
      .subscribe();

    // Simulated vehicle movement
    const simInterval = setInterval(() => {
      setVehicles((prev) =>
        prev.map((v) =>
          v.status === "en_route"
            ? {
                ...v,
                lat: v.lat + (Math.random() - 0.45) * DRIFT_AMOUNT,
                lng: v.lng + (Math.random() - 0.45) * DRIFT_AMOUNT,
              }
            : v
        )
      );
    }, SIMULATION_INTERVAL_MS);

    return () => {
      clearInterval(simInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!mapElementRef.current || leafletMapRef.current) return;

    const map = L.map(mapElementRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(DEFAULT_CENTER, MAP_ZOOM);

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map);

    leafletMapRef.current = map;

    requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => {
      vehicleMarkersRef.current.forEach((marker) => marker.remove());
      vehicleMarkersRef.current.clear();
      studentMarkersRef.current.forEach((marker) => marker.remove());
      studentMarkersRef.current.clear();
      map.remove();
      leafletMapRef.current = null;
      hasCenteredMapRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const visibleVehicleIds = new Set<string>();

    vehicles.forEach((vehicle) => {
      visibleVehicleIds.add(vehicle.id);
      const position: [number, number] = [vehicle.lat, vehicle.lng];
      const existingMarker = vehicleMarkersRef.current.get(vehicle.id);

      if (existingMarker) {
        existingMarker.setLatLng(position);
        existingMarker.setPopupContent(getPopupContent(vehicle));
      } else {
        const marker = L.marker(position, { icon: busIcon });
        marker.bindPopup(getPopupContent(vehicle));
        marker.addTo(map);
        vehicleMarkersRef.current.set(vehicle.id, marker);
      }
    });

    vehicleMarkersRef.current.forEach((marker, vehicleId) => {
      if (!visibleVehicleIds.has(vehicleId)) {
        marker.remove();
        vehicleMarkersRef.current.delete(vehicleId);
      }
    });

    if (!hasCenteredMapRef.current && vehicles.length > 0) {
      hasCenteredMapRef.current = true;
      map.setView([vehicles[0].lat, vehicles[0].lng], MAP_ZOOM);
    }
  }, [vehicles]);

  // Render student pickup markers on map
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const studentIcon = new L.DivIcon({
      html: `<div style="background:#3b82f6;width:18px;height:18px;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
      className: "",
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    students.forEach((student) => {
      if (student.pickup_lat == null || student.pickup_lng == null) return;
      const pos: [number, number] = [student.pickup_lat, student.pickup_lng];
      const existing = studentMarkersRef.current.get(student.id);

      if (existing) {
        existing.setLatLng(pos);
      } else {
        const marker = L.marker(pos, { icon: studentIcon });
        marker.bindPopup(`<b>${student.name}</b><br/>Pickup point`);
        marker.addTo(map);
        studentMarkersRef.current.set(student.id, marker);
      }
    });
  }, [students]);

  const activeVehicles = vehicles.filter((vehicle) => vehicle.status === "en_route");

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <MapPin className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold text-foreground">TRAK</span>
            <Badge variant="outline" className="ml-2 border-primary/30 text-xs text-primary">
              Live Dashboard
            </Badge>
          </Link>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="relative"
              onClick={() => setShowAlertPanel((p) => !p)}
            >
              <Bell className="h-5 w-5 text-foreground" />
              {alerts.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {alerts.length > 9 ? "9+" : alerts.length}
                </span>
              )}
            </Button>
            <Link to="/">
              <Button variant="ghost" size="sm">← Back to Home</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Proximity alert panel */}
      {showAlertPanel && (
        <div className="fixed top-14 right-4 z-50 w-80 max-h-[50vh] overflow-y-auto rounded-lg border border-destructive/30 bg-background shadow-xl">
          <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-destructive" />
              <span className="text-sm font-bold text-foreground">Proximity Alerts</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowAlertPanel(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {alerts.length === 0 ? (
            <p className="p-4 text-center text-sm text-muted-foreground">No alerts yet</p>
          ) : (
            alerts.map((alert, i) => (
              <div
                key={`${alert.vehicleId}-${alert.studentName}-${i}`}
                className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0 animate-in fade-in slide-in-from-top-2"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/15">
                  <Bell className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    🚌 {alert.vehiclePlate} approaching!
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {alert.distanceMeters}m from <span className="font-medium text-foreground">{alert.studentName}</span>'s pickup
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <main className="pt-14">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Bus, label: "Active Vehicles", value: activeVehicles.length, color: "text-green-400" },
              { icon: Users, label: "Students", value: students.length, color: "text-blue-400" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border bg-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <p className="font-display text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="container mx-auto px-4 pb-8">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden border-border bg-card">
                <CardHeader className="border-b border-border px-4 py-3">
                  <CardTitle className="font-display text-sm flex items-center gap-2">
                    <Circle className="h-2 w-2 animate-pulse fill-green-400 text-green-400" />
                    Live Vehicle Map
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div
                    ref={mapElementRef}
                    className="h-[500px] w-full"
                    style={{ background: "#ffffff" }}
                    aria-label="Live vehicle map"
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader className="border-b border-border px-4 py-3">
                  <CardTitle className="font-display text-sm flex items-center gap-2">
                    <Bus className="h-4 w-4 text-primary" /> Fleet Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center justify-between border-b border-border px-4 py-3 last:border-0">
                      <div>
                        <p className="text-sm font-medium text-foreground">{vehicle.plate_number}</p>
                        <p className="text-xs text-muted-foreground">{vehicle.driver_name}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${statusColor[vehicle.status] || ""}`}>
                        {vehicle.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
