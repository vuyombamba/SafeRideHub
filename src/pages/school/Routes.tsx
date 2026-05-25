import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "./useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Map as MapIcon, Trash2 } from "lucide-react";

interface Row { id: string; name: string; start_location: string; end_location: string; }

const RoutesPage = () => {
  const { school, loading } = useSchool();
  const [rows, setRows] = useState<Row[]>([]);
  const [form, setForm] = useState({ name: "", start_location: "", end_location: "" });

  const load = async () => {
    if (!school) return;
    const { data } = await supabase.from("routes").select("id,name,start_location,end_location").eq("school_id", school.id).order("created_at");
    setRows((data as Row[]) ?? []);
  };
  useEffect(() => { load(); }, [school]);
  if (!loading && !school) return <Navigate to="/school/setup" replace />;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    const { error } = await supabase.from("routes").insert({ ...form, school_id: school.id });
    if (error) return toast.error(error.message);
    setForm({ name: "", start_location: "", end_location: "" }); load();
  };
  const remove = async (id: string) => { await supabase.from("routes").delete().eq("id", id); load(); };

  return (
    <div className="p-5 md:p-10 max-w-3xl">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2"><MapIcon className="h-5 w-5" /> Routes</h1>
      <form onSubmit={add} className="mt-6 rounded-2xl border border-border bg-card p-4 grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
        <Input required placeholder="Route name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input required placeholder="Start" value={form.start_location} onChange={(e) => setForm({ ...form, start_location: e.target.value })} />
        <Input required placeholder="End" value={form.end_location} onChange={(e) => setForm({ ...form, end_location: e.target.value })} />
        <Button type="submit">Add</Button>
      </form>
      <div className="mt-6 space-y-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No routes yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.start_location} → {r.end_location}</p>
            </div>
            <button onClick={() => remove(r.id)} className="text-destructive p-2"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default RoutesPage;
