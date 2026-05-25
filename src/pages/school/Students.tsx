import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSchool } from "./useSchool";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, Trash2 } from "lucide-react";

interface Row { id: string; name: string; parent_phone: string | null; route_id: string | null; }
interface RouteOpt { id: string; name: string; }

const Students = () => {
  const { school, loading } = useSchool();
  const [rows, setRows] = useState<Row[]>([]);
  const [routes, setRoutes] = useState<RouteOpt[]>([]);
  const [form, setForm] = useState({ name: "", parent_phone: "", route_id: "" });

  const load = async () => {
    if (!school) return;
    const [s, r] = await Promise.all([
      supabase.from("students").select("id,name,parent_phone,route_id").eq("school_id", school.id).order("created_at"),
      supabase.from("routes").select("id,name").eq("school_id", school.id),
    ]);
    setRows((s.data as Row[]) ?? []);
    setRoutes((r.data as RouteOpt[]) ?? []);
  };
  useEffect(() => { load(); }, [school]);
  if (!loading && !school) return <Navigate to="/school/setup" replace />;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    const { error } = await supabase.from("students").insert({
      name: form.name, parent_phone: form.parent_phone || null, route_id: form.route_id || null, school_id: school.id,
    });
    if (error) return toast.error(error.message);
    setForm({ name: "", parent_phone: "", route_id: "" }); load();
  };
  const remove = async (id: string) => { await supabase.from("students").delete().eq("id", id); load(); };

  return (
    <div className="p-5 md:p-10 max-w-3xl">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2"><Users className="h-5 w-5" /> Students</h1>
      <form onSubmit={add} className="mt-6 rounded-2xl border border-border bg-card p-4 grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
        <Input required placeholder="Student name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Parent phone" value={form.parent_phone} onChange={(e) => setForm({ ...form, parent_phone: e.target.value })} />
        <select value={form.route_id} onChange={(e) => setForm({ ...form, route_id: e.target.value })} className="h-10 rounded-md border border-input px-3 text-sm bg-background">
          <option value="">No route</option>
          {routes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <Button type="submit">Add</Button>
      </form>
      <div className="mt-6 space-y-2">
        {rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No students yet.</p>}
        {rows.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-sm font-semibold">{r.name}</p>
              <p className="text-xs text-muted-foreground">{r.parent_phone ?? "—"} · {routes.find((rt) => rt.id === r.route_id)?.name ?? "no route"}</p>
            </div>
            <button onClick={() => remove(r.id)} className="text-destructive p-2"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Students;
