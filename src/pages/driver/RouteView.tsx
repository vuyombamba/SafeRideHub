import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DriverTabs } from "@/components/driver/BottomTabs";
import { MapPin } from "lucide-react";

interface Student { id: string; name: string; pickup_lat: number | null; pickup_lng: number | null; }

const RouteView = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [routeName, setRouteName] = useState<string>("—");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: v } = await supabase.from("vehicles").select("id").eq("driver_user_id", user.id).maybeSingle();
      if (!v) return;
      const { data: t } = await supabase.from("trip_logs").select("route_id").eq("vehicle_id", v.id)
        .is("ended_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (!t?.route_id) return;
      const [r, s] = await Promise.all([
        supabase.from("routes").select("name").eq("id", t.route_id).maybeSingle(),
        supabase.from("students").select("id,name,pickup_lat,pickup_lng").eq("route_id", t.route_id),
      ]);
      if (r.data) setRouteName(r.data.name);
      if (s.data) setStudents(s.data);
    })();
  }, [user]);

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen pb-24 px-5 pt-8">
        <h1 className="font-display text-2xl font-bold">{routeName}</h1>
        <p className="text-sm text-muted-foreground">Pickups on this route</p>
        <div className="mt-4 space-y-2">
          {students.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No pickups assigned.</p>}
          {students.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-3 flex items-center gap-3">
              <MapPin className="h-4 w-4 text-primary" />
              <div className="flex-1"><p className="text-sm font-semibold">{s.name}</p></div>
            </div>
          ))}
        </div>
      </div>
      <DriverTabs />
    </div>
  );
};
export default RouteView;
