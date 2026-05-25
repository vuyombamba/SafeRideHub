import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { DriverTabs } from "@/components/driver/BottomTabs";
import { useGpsStream } from "@/hooks/useGpsStream";
import { toast } from "sonner";
import { Bus, MapPin, Radio, Square, Play } from "lucide-react";

interface Vehicle { id: string; plate_number: string; status: string; school_id: string | null; }
interface Route { id: string; name: string; start_location: string; end_location: string; }
interface Trip { id: string; status: string; route_id: string | null; started_at: string | null; }

const DriverHome = () => {
  const nav = useNavigate();
  const { user, signOut } = useAuth();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [routeId, setRouteId] = useState<string>("");
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);

  const { lastFix, error: gpsError } = useGpsStream({
    vehicleId: vehicle?.id ?? null,
    enabled: !!activeTrip,
  });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: v } = await supabase.from("vehicles").select("id,plate_number,status,school_id")
        .eq("driver_user_id", user.id).maybeSingle();
      if (!v) { nav("/driver/setup", { replace: true }); return; }
      setVehicle(v);

      const routesQ = v.school_id
        ? supabase.from("routes").select("id,name,start_location,end_location").eq("school_id", v.school_id)
        : supabase.from("routes").select("id,name,start_location,end_location");
      const { data: r } = await routesQ;
      setRoutes(r ?? []);

      const { data: t } = await supabase.from("trip_logs").select("id,status,route_id,started_at")
        .eq("vehicle_id", v.id).is("ended_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (t) { setActiveTrip(t); setRouteId(t.route_id ?? ""); }
    })();
  }, [user, nav]);

  const startTrip = async () => {
    if (!vehicle || !routeId) return toast.error("Pick a route first");
    const { data, error } = await supabase.from("trip_logs").insert({
      vehicle_id: vehicle.id, route_id: routeId, status: "en_route", started_at: new Date().toISOString(),
    }).select().single();
    if (error) return toast.error(error.message);
    await supabase.from("vehicles").update({ status: "en_route" }).eq("id", vehicle.id);
    setActiveTrip(data as Trip);
    toast.success("Trip started — GPS streaming");
  };

  const endTrip = async () => {
    if (!activeTrip || !vehicle) return;
    await supabase.from("trip_logs").update({ status: "completed", ended_at: new Date().toISOString() }).eq("id", activeTrip.id);
    await supabase.from("vehicles").update({ status: "idle" }).eq("id", vehicle.id);
    setActiveTrip(null);
    toast.success("Trip ended");
  };

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen pb-24">
        <div className="bg-primary text-primary-foreground rounded-b-[2rem] px-5 pt-6 pb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Bus className="h-5 w-5" /><span className="font-semibold">Driver</span></div>
            <button onClick={() => signOut()} className="text-xs opacity-80">Sign out</button>
          </div>
          <p className="mt-4 text-sm opacity-90">Vehicle</p>
          <h1 className="font-display text-2xl font-bold tracking-wide">{vehicle?.plate_number ?? "—"}</h1>
        </div>

        <div className="px-5 -mt-5">
          <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active trip</p>
            {activeTrip ? (
              <>
                <div className="flex items-center gap-2 mt-2">
                  <Radio className="h-4 w-4 text-green-600 animate-pulse" />
                  <span className="text-sm font-semibold">Streaming GPS</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {lastFix ? `Last fix ${new Date(lastFix.at).toLocaleTimeString()} — ${lastFix.lat.toFixed(5)}, ${lastFix.lng.toFixed(5)}` : "Waiting for first fix…"}
                </p>
                {gpsError && <p className="text-xs text-destructive mt-1">{gpsError}</p>}
                <Button onClick={endTrip} variant="destructive" className="w-full h-12 rounded-full mt-5">
                  <Square className="h-4 w-4 mr-2" /> End trip
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm mt-2">Pick a route and start streaming.</p>
                <select value={routeId} onChange={(e) => setRouteId(e.target.value)}
                  className="mt-4 w-full h-12 rounded-full bg-secondary/60 border border-secondary px-5 text-sm">
                  <option value="">Select route…</option>
                  {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                {routes.length === 0 && <p className="text-xs text-muted-foreground mt-2">No routes assigned yet. Your school will add them.</p>}
                <Button onClick={startTrip} className="w-full h-12 rounded-full mt-4" disabled={!routeId}>
                  <Play className="h-4 w-4 mr-2" /> Start trip
                </Button>
              </>
            )}
          </div>

          <div className="rounded-2xl bg-secondary/60 p-4 mt-4 flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Keep this screen open while driving. We stream your position to parents every ~2 seconds.
            </p>
          </div>
        </div>
      </div>
      <DriverTabs />
    </div>
  );
};
export default DriverHome;
