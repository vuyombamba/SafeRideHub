import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, Hourglass, QrCode, ShieldX, Trash2, UserCog, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BottomTabs } from "@/components/parent/BottomTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QrScanner } from "@/components/QrScanner";
import { toast } from "sonner";

interface LinkedDriver {
  link_id: string;
  driver_user_id: string;
  added_via: string;
  profile: {
    full_name: string;
    phone: string | null;
    license_number: string;
    status: "pending" | "verified" | "rejected";
  } | null;
}

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s.trim());

const ParentDrivers = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<LinkedDriver[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [mode, setMode] = useState<"scan" | "code">("scan");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data: links } = await supabase
      .from("parent_drivers")
      .select("id, driver_user_id, added_via")
      .eq("parent_user_id", user.id)
      .order("created_at", { ascending: false });
    const linksList = links ?? [];
    if (linksList.length === 0) { setDrivers([]); return; }
    const driverIds = linksList.map((l: any) => l.driver_user_id);
    const { data: profiles } = await supabase
      .from("driver_profiles")
      .select("driver_user_id, full_name, phone, license_number, status")
      .in("driver_user_id", driverIds);
    const map = new Map<string, any>();
    (profiles ?? []).forEach((p: any) => map.set(p.driver_user_id, p));
    setDrivers(linksList.map((l: any) => ({
      link_id: l.id,
      driver_user_id: l.driver_user_id,
      added_via: l.added_via,
      profile: map.get(l.driver_user_id) ?? null,
    })));
  };

  useEffect(() => { load(); }, [user]);

  const linkByToken = async (rawToken: string) => {
    const t = rawToken.trim();
    if (!isUuid(t)) return toast.error("That doesn't look like a valid driver code");
    setBusy(true);
    const { error } = await supabase.rpc("link_driver_by_qr" as any, { _qr_token: t });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Driver added");
    setShowAdd(false); setToken("");
    load();
  };

  const remove = async (link_id: string) => {
    const { error } = await supabase.from("parent_drivers").delete().eq("id", link_id);
    if (error) return toast.error(error.message);
    toast.success("Driver removed");
    load();
  };

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen pb-28">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Link to="/parent/profile" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-display text-lg font-bold flex-1">My drivers</h1>
          <Button size="sm" className="rounded-full h-9" onClick={() => setShowAdd(true)}>
            <QrCode className="h-4 w-4 mr-1" /> Add
          </Button>
        </header>

        <div className="px-5 py-5 space-y-3">
          {drivers.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No drivers added. Scan a driver's QR code or enter their code to link them.
            </div>
          )}
          {drivers.map((d) => (
            <div key={d.link_id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/15 flex items-center justify-center text-primary"><UserCog className="h-6 w-6" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{d.profile?.full_name ?? "Unverified driver"}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {d.profile?.license_number ? `Lic. ${d.profile.license_number}` : "—"} · via {d.added_via}
                </p>
              </div>
              <StatusPill status={d.profile?.status} />
              <button onClick={() => remove(d.link_id)} className="text-destructive p-2"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl bg-background border border-border shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-display text-base font-bold">Add a driver</h2>
              <button onClick={() => setShowAdd(false)} className="p-1"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-5 py-4">
              <div className="grid grid-cols-2 gap-2 rounded-full bg-secondary p-1 mb-4">
                {(["scan", "code"] as const).map((m) => (
                  <button key={m} onClick={() => setMode(m)}
                    className={`h-9 rounded-full text-xs font-semibold ${mode === m ? "bg-background shadow" : "text-muted-foreground"}`}>
                    {m === "scan" ? "Scan QR" : "Enter code"}
                  </button>
                ))}
              </div>
              {mode === "scan" ? (
                <div>
                  <QrScanner
                    onResult={(text) => linkByToken(text)}
                    onError={(err) => toast.error(err)}
                  />
                  <p className="text-[11px] text-muted-foreground mt-3 text-center">
                    Allow camera access and point at the driver's QR.
                  </p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); linkByToken(token); }} className="space-y-3">
                  <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="Driver code (UUID)"
                    className="h-12 rounded-full bg-secondary/60 border-secondary px-5 text-xs font-mono" />
                  <Button type="submit" disabled={busy} className="w-full h-12 rounded-full">Link driver</Button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomTabs />
    </div>
  );
};

function StatusPill({ status }: { status?: "pending" | "verified" | "rejected" }) {
  if (status === "verified") return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold"><BadgeCheck className="h-3 w-3" />Verified</span>;
  if (status === "rejected") return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 text-destructive px-2 py-0.5 text-[10px] font-semibold"><ShieldX className="h-3 w-3" />Rejected</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-700 px-2 py-0.5 text-[10px] font-semibold"><Hourglass className="h-3 w-3" />Pending</span>;
}

export default ParentDrivers;
