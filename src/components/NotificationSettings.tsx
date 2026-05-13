import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Settings2 } from "lucide-react";
import { toast } from "sonner";

interface Pref {
  id?: string;
  student_id: string;
  radius_meters: number;
  mute_until: string | null;
  push_enabled: boolean;
  sms_enabled: boolean;
  parent_phone: string | null;
}

interface Student { id: string; name: string }

const MUTE_OPTIONS = [
  { label: "Off", mins: 0 },
  { label: "30 min", mins: 30 },
  { label: "1 hour", mins: 60 },
  { label: "Until tomorrow", mins: 60 * 12 },
];

export function NotificationSettings({ students }: { students: Student[] }) {
  const { user } = useAuth();
  const [prefs, setPrefs] = useState<Record<string, Pref>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("parent_user_id", user.id);
      const map: Record<string, Pref> = {};
      (data ?? []).forEach((p) => { map[p.student_id] = p as Pref; });
      setPrefs(map);
    })();
  }, [user]);

  const getPref = (sid: string): Pref =>
    prefs[sid] ?? {
      student_id: sid, radius_meters: 500, mute_until: null,
      push_enabled: true, sms_enabled: false, parent_phone: null,
    };

  const save = async (sid: string, patch: Partial<Pref>) => {
    if (!user) return;
    const next = { ...getPref(sid), ...patch };
    setPrefs((p) => ({ ...p, [sid]: next }));
    setLoading(true);
    const { error } = await supabase.from("notification_preferences").upsert(
      {
        parent_user_id: user.id,
        student_id: sid,
        radius_meters: next.radius_meters,
        mute_until: next.mute_until,
        push_enabled: next.push_enabled,
        sms_enabled: next.sms_enabled,
        parent_phone: next.parent_phone,
      },
      { onConflict: "parent_user_id,student_id" }
    );
    setLoading(false);
    if (error) toast.error(error.message);
  };

  const setMute = (sid: string, mins: number) => {
    const until = mins === 0 ? null : new Date(Date.now() + mins * 60_000).toISOString();
    save(sid, { mute_until: until });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Settings2 className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Notification settings</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-6">
          {students.length === 0 && (
            <p className="text-sm text-muted-foreground">No students linked yet.</p>
          )}
          {students.map((s) => {
            const p = getPref(s.id);
            const muted = p.mute_until && new Date(p.mute_until).getTime() > Date.now();
            return (
              <div key={s.id} className="rounded-xl border border-border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{s.name}</p>
                    {muted && <p className="text-xs text-muted-foreground">Muted until {new Date(p.mute_until!).toLocaleTimeString()}</p>}
                  </div>
                  <Switch checked={p.push_enabled} onCheckedChange={(v) => save(s.id, { push_enabled: v })} />
                </div>

                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-2">
                    <span>Alert radius</span>
                    <span className="font-medium text-foreground">{p.radius_meters} m</span>
                  </div>
                  <Slider
                    value={[p.radius_meters]} min={100} max={2000} step={50}
                    onValueChange={(v) => setPrefs((cur) => ({ ...cur, [s.id]: { ...getPref(s.id), radius_meters: v[0] } }))}
                    onValueCommit={(v) => save(s.id, { radius_meters: v[0] })}
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Mute alerts</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {MUTE_OPTIONS.map((m) => (
                      <Button key={m.label} size="sm" variant="outline" onClick={() => setMute(s.id, m.mins)} disabled={loading}>
                        {m.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">SMS fallback</Label>
                    <Switch checked={p.sms_enabled} onCheckedChange={(v) => save(s.id, { sms_enabled: v })} />
                  </div>
                  {p.sms_enabled && (
                    <Input
                      placeholder="+27 ..." value={p.parent_phone ?? ""}
                      onChange={(e) => setPrefs((cur) => ({ ...cur, [s.id]: { ...getPref(s.id), parent_phone: e.target.value } }))}
                      onBlur={(e) => save(s.id, { parent_phone: e.target.value })}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
