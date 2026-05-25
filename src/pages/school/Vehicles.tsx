import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "./useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Bus, Trash2 } from "lucide-react";

interface Row { id: string; plate_number: string; driver_name: string; status: string; driver_user_id: string | null; }

const Vehicles = () => {
  const { school, loading } = useSchool();
  const [rows, setRows] = useState<Row[]>([]);
  const [plate, setPlate] = useState("");
  const [driver, setDriver] = useState("");

  const load = async () => {
    if (!school) return;
    const { data } = await supabase.from("vehicles").select("id,plate_number,driver_name,status,driver_user_id").eq("school_id", school.id).order("created_at");
    setRows((data as Row[]) ?? []);
  };
  useEffect(() => { load(); }, [school]);

  if (!loading && !school) return <Navigate to="/school/setup" replace />;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    const { error } = await supabase.from("vehicles").insert({
      plate_number: plate.toUpperCase(), driver_name: driver, status: "idle", lat: 0, lng: 0, school_id: school.id,
    });
    if (error) return toast.error(error.message);
    setPlate(""); setDriver(""); load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="p-5 md:p-10 max-w-3xl">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Bus className="h-5 w-5" /> Vehicles</h1>

      <form onSubmit={add} className="mt-6 rounded-2xl border border-border bg-card p-4 grid md:grid-cols-[1fr_1fr_auto] gap-2">
        <Input required placeholder="Plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
        <Input required placeholder="Driver name" value={driver} onChange={(e) => setDriver(e.target.value)} />
        <Button type="submit">Add</Button>
      </form>

      <div className="mt-6 space-y-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No vehicles yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/15 text-primary flex items-center justify-center"><Bus className="h-5 w-5" /></div>
            <div className="flex-1">
              <p className="text-sm font-semibold">{r.plate_number}</p>
              <p className="text-xs text-muted-foreground">{r.driver_name} · {r.status}{r.driver_user_id ? " · linked" : " · awaiting driver"}</p>
            </div>
            <button onClick={() => remove(r.id)} className="text-destructive p-2"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Vehicles;
