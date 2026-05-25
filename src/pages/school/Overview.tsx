import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "./useSchool";
import { Bus, Map, Users, Radio } from "lucide-react";

const Overview = () => {
  const { school, loading } = useSchool();
  const [stats, setStats] = useState({ vehicles: 0, routes: 0, students: 0, active: 0 });

  useEffect(() => {
    if (!school) return;
    (async () => {
      const [v, r, s, t] = await Promise.all([
        supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("school_id", school.id),
        supabase.from("routes").select("id", { count: "exact", head: true }).eq("school_id", school.id),
        supabase.from("students").select("id", { count: "exact", head: true }).eq("school_id", school.id),
        supabase.from("vehicles").select("id", { count: "exact", head: true }).eq("school_id", school.id).eq("status", "en_route"),
      ]);
      setStats({ vehicles: v.count ?? 0, routes: r.count ?? 0, students: s.count ?? 0, active: t.count ?? 0 });
    })();
  }, [school]);

  if (!loading && !school) return <Navigate to="/school/setup" replace />;

  return (
    <div className="p-5 md:p-10 max-w-5xl">
      <h1 className="font-display text-2xl md:text-3xl font-bold">{school?.name ?? "Loading…"}</h1>
      <p className="text-sm text-muted-foreground">{school?.address ?? ""}</p>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Stat label="Vehicles" value={stats.vehicles} Icon={Bus} />
        <Stat label="Routes" value={stats.routes} Icon={Map} />
        <Stat label="Students" value={stats.students} Icon={Users} />
        <Stat label="Active now" value={stats.active} Icon={Radio} highlight />
      </div>
    </div>
  );
};

function Stat({ label, value, Icon, highlight }: { label: string; value: number; Icon: any; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}>
      <Icon className="h-5 w-5 opacity-80" />
      <p className="text-3xl font-bold mt-3">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
}
export default Overview;
