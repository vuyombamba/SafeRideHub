import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BottomTabs } from "@/components/parent/BottomTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

interface Child { id: string; full_name: string; age: number | null; gender: string | null; phone: string | null; allergies: string | null; about: string | null; }

const Children = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: "", age: "", gender: "", phone: "", allergies: "", about: "" });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("children").select("*").eq("parent_user_id", user.id).order("created_at");
    if (data) setChildren(data as any);
  };
  useEffect(() => { load(); }, [user]);

  const onAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("children").insert({
      parent_user_id: user.id,
      full_name: form.full_name,
      age: form.age ? parseInt(form.age) : null,
      gender: form.gender || null,
      phone: form.phone || null,
      allergies: form.allergies || null,
      about: form.about || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Child added");
    setForm({ full_name: "", age: "", gender: "", phone: "", allergies: "", about: "" });
    setShowAdd(false);
    load();
  };

  const onDelete = async (id: string) => {
    const { error } = await supabase.from("children").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed");
    load();
  };

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen pb-24">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Link to="/parent" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-display text-lg font-bold flex-1">My children</h1>
          <Button size="sm" className="rounded-full h-9" onClick={() => setShowAdd((v) => !v)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </header>

        {showAdd && (
          <form onSubmit={onAdd} className="px-5 py-5 space-y-3 bg-secondary/30 border-b border-border">
            <p className="font-display text-base font-bold text-center">Add a Child</p>
            <Field placeholder="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
            <Field placeholder="Age" type="number" value={form.age} onChange={(v) => setForm({ ...form, age: v })} />
            <Field placeholder="Gender" value={form.gender} onChange={(v) => setForm({ ...form, gender: v })} />
            <Field placeholder="Phone number" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Field placeholder="Allergies" value={form.allergies} onChange={(v) => setForm({ ...form, allergies: v })} />
            <Field placeholder="About me" value={form.about} onChange={(v) => setForm({ ...form, about: v })} />
            <Button type="submit" disabled={busy} className="w-full h-12 rounded-full">Next ›</Button>
          </form>
        )}

        <div className="px-5 py-4 space-y-3">
          {children.length === 0 && !showAdd && (
            <p className="text-center text-sm text-muted-foreground py-12">No children yet. Tap Add to register.</p>
          )}
          {children.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center text-primary"><UserIcon className="h-6 w-6" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{c.full_name}</p>
                <p className="text-xs text-muted-foreground">{[c.age && `${c.age} yrs`, c.gender].filter(Boolean).join(" · ") || "—"}</p>
              </div>
              <button onClick={() => onDelete(c.id)} className="text-destructive p-2"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>
      <BottomTabs />
    </div>
  );
};

function Field({ placeholder, value, onChange, type = "text", required }: any) {
  return (
    <Input
      type={type}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 rounded-full bg-secondary/60 border-secondary px-5 text-sm"
    />
  );
}

export default Children;
