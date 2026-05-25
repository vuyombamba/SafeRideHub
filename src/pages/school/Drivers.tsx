import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "./useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { IdCard, Plug } from "lucide-react";

interface Vehicle { id: string; plate_number: string; driver_name: string; driver_user_id: string | null; school_id: string | null; }

/**
 * The school admin attaches an unaffiliated vehicle (created by a driver who signed up)
 * to their school by plate number. Drivers self-register their vehicles; schools approve them.
 */
const Drivers = () => {
  const { school, loading } = useSchool();
  const [mine, setMine] = useState<Vehicle[]>([]);
  const [unattached, setUnattached] = useState<Vehicle[]>([]);
  const [plate, setPlate] = useState("");

  const load = async () => {
    if (!school) return;
    const { data: m } = await supabase.from("vehicles")
      .select("id,plate_number,driver_name,driver_user_id,school_id")
      .eq("school_id", school.id);
    setMine((m as Vehicle[]) ?? []);
    const { data: u } = await supabase.from("vehicles")
      .select("id,plate_number,driver_name,driver_user_id,school_id")
      .is("school_id", null);
    setUnattached((u as Vehicle[]) ?? []);
  };
  useEffect(() => { load(); }, [school]);
  if (!loading && !school) return <Navigate to="/school/setup" replace />;

  const attach = async (id: string) => {
    if (!school) return;
    const { error } = await supabase.from("vehicles").update({ school_id: school.id }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Driver attached"); load();
  };
  const attachByPlate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    const target = unattached.find((v) => v.plate_number.toUpperCase() === plate.toUpperCase().trim());
    if (!target) return toast.error("No unattached driver with that plate");
    await attach(target.id);
    setPlate("");
  };

  return (
    <div className="p-5 md:p-10 max-w-3xl">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2"><IdCard className="h-5 w-5" /> Drivers</h1>

      <form onSubmit={attachByPlate} className="mt-6 rounded-2xl border border-border bg-card p-4 grid gap-2 md:grid-cols-[1fr_auto]">
        <Input placeholder="Driver plate number" value={plate} onChange={(e) => setPlate(e.target.value)} />
        <Button type="submit"><Plug className="h-4 w-4 mr-2" /> Attach</Button>
      </form>

      <section className="mt-8">
        <p className="text-xs uppercase font-semibold text-muted-foreground">Your drivers</p>
        <div className="mt-3 space-y-2">
          {mine.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">None yet.</p>}
          {mine.map((v) => (
            <div key={v.id} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-semibold">{v.plate_number}</p>
              <p className="text-xs text-muted-foreground">{v.driver_name}{v.driver_user_id ? " · streaming-ready" : " · no driver account linked"}</p>
            </div>
          ))}
        </div>
      </section>

      {unattached.length > 0 && (
        <section className="mt-8">
          <p className="text-xs uppercase font-semibold text-muted-foreground">Pending drivers (any school)</p>
          <div className="mt-3 space-y-2">
            {unattached.map((v) => (
              <div key={v.id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-semibold">{v.plate_number}</p>
                  <p className="text-xs text-muted-foreground">{v.driver_name}</p>
                </div>
                <Button size="sm" onClick={() => attach(v.id)}>Attach to my school</Button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
export default Drivers;
