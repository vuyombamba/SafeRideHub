import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BellRing, Volume2, Vibrate } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BottomTabs } from "@/components/parent/BottomTabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

interface Child { id: string; full_name: string; student_id: string | null }
interface Pref {
  id?: string;
  student_id: string;
  ring_enabled: boolean;
  ring_volume: number;
  vibration_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  radius_meters: number;
}

const defaults = (student_id: string): Pref => ({
  student_id,
  ring_enabled: true,
  ring_volume: 80,
  vibration_enabled: true,
  push_enabled: true,
  sms_enabled: false,
  radius_meters: 500,
});

const RingPreferences = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<{ child: Child; pref: Pref }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      // Get parent's linked students
      const { data: links } = await supabase
        .from("parent_students")
        .select("student_id, students(name)")
        .eq("parent_user_id", user.id);

      const studentIds = (links ?? []).map((l: any) => l.student_id).filter(Boolean);
      const childMap = new Map<string, Child>();
      (links ?? []).forEach((l: any) => {
        childMap.set(l.student_id, { id: l.student_id, full_name: l.students?.name ?? "Student", student_id: l.student_id });
      });

      let prefsData: any[] = [];
      if (studentIds.length) {
        const { data } = await supabase
          .from("notification_preferences")
          .select("*")
          .eq("parent_user_id", user.id)
          .in("student_id", studentIds);
        prefsData = data ?? [];
      }
      const next = Array.from(childMap.values()).map((child) => {
        const pref = prefsData.find((p) => p.student_id === child.student_id);
        return { child, pref: pref ?? defaults(child.student_id!) };
      });
      setRows(next);
      setLoading(false);
    })();
  }, [user]);

  const update = async (studentId: string, patch: Partial<Pref>) => {
    if (!user) return;
    setRows((prev) => prev.map((r) => r.child.student_id === studentId ? { ...r, pref: { ...r.pref, ...patch } } : r));
    const current = rows.find((r) => r.child.student_id === studentId)?.pref;
    if (!current) return;
    const merged = { ...current, ...patch };
    const { error } = await supabase
      .from("notification_preferences")
      .upsert({
        parent_user_id: user.id,
        student_id: studentId,
        ring_enabled: merged.ring_enabled,
        ring_volume: merged.ring_volume,
        vibration_enabled: merged.vibration_enabled,
        push_enabled: merged.push_enabled,
        sms_enabled: merged.sms_enabled,
        radius_meters: merged.radius_meters,
      }, { onConflict: "parent_user_id,student_id" } as any);
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen pb-28">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Link to="/parent/profile" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-display text-lg font-bold flex-1">Alert preferences</h1>
        </header>

        <div className="px-5 pt-5 space-y-4">
          {loading && <p className="text-sm text-muted-foreground text-center py-12">Loading…</p>}
          {!loading && rows.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No children linked yet. Add a child and link them to a route to configure ring alerts.
            </div>
          )}
          {rows.map(({ child, pref }) => (
            <div key={child.student_id} className="rounded-2xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold">
                  {child.full_name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{child.full_name}</p>
                  <p className="text-[11px] text-muted-foreground">Near-zone radius: {pref.radius_meters}m</p>
                </div>
              </div>

              <Row icon={BellRing} label="Ring on near-zone entry">
                <Switch checked={pref.ring_enabled} onCheckedChange={(v) => update(child.student_id!, { ring_enabled: v })} />
              </Row>

              <div className="space-y-2 opacity-100" style={{ opacity: pref.ring_enabled ? 1 : 0.5 }}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground"><Volume2 className="h-4 w-4 text-primary" /> Volume</span>
                  <span className="text-xs font-bold text-foreground tabular-nums">{pref.ring_volume}%</span>
                </div>
                <Slider
                  disabled={!pref.ring_enabled}
                  value={[pref.ring_volume]}
                  min={0} max={100} step={5}
                  onValueChange={([v]) => setRows((prev) => prev.map((r) => r.child.student_id === child.student_id ? { ...r, pref: { ...r.pref, ring_volume: v } } : r))}
                  onValueCommit={([v]) => update(child.student_id!, { ring_volume: v })}
                />
              </div>

              <Row icon={Vibrate} label="Vibrate on alert">
                <Switch checked={pref.vibration_enabled} onCheckedChange={(v) => update(child.student_id!, { vibration_enabled: v })} />
              </Row>
            </div>
          ))}
        </div>
      </div>
      <BottomTabs />
    </div>
  );
};

function Row({ icon: Icon, label, children }: any) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-foreground"><Icon className="h-4 w-4 text-primary" /> {label}</span>
      {children}
    </div>
  );
}

export default RingPreferences;
