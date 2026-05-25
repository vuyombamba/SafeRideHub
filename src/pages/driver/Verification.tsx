import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { ArrowLeft, BadgeCheck, Hourglass, ShieldX, Upload, IdCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DriverTabs } from "@/components/driver/BottomTabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface DriverProfile {
  id: string;
  driver_user_id: string;
  full_name: string;
  phone: string | null;
  license_number: string;
  license_expiry: string | null;
  license_image_url: string | null;
  id_image_url: string | null;
  status: "pending" | "verified" | "rejected";
  reviewer_notes: string | null;
  qr_token: string;
}

const DriverVerification = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "", license_number: "", license_expiry: "" });
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const licenseInputRef = useRef<HTMLInputElement | null>(null);
  const idInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("driver_profiles").select("*").eq("driver_user_id", user.id).maybeSingle();
      if (data) {
        setProfile(data as any);
        setForm({
          full_name: data.full_name,
          phone: data.phone ?? "",
          license_number: data.license_number,
          license_expiry: data.license_expiry ?? "",
        });
      } else {
        const displayName = (user.user_metadata?.display_name as string) || user.email?.split("@")[0] || "";
        setForm((f) => ({ ...f, full_name: displayName }));
      }
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!profile?.qr_token) { setQrDataUrl(null); return; }
    QRCode.toDataURL(profile.qr_token, { width: 320, margin: 1, color: { dark: "#0f172a", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [profile?.qr_token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.license_number.trim()) return toast.error("License number is required");
    setBusy(true);
    const payload = {
      driver_user_id: user.id,
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      license_number: form.license_number.trim().toUpperCase(),
      license_expiry: form.license_expiry || null,
      status: "pending" as const,
      reviewer_notes: null,
    };
    const { data, error } = await supabase
      .from("driver_profiles")
      .upsert(payload, { onConflict: "driver_user_id" } as any)
      .select()
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
    setProfile(data as any);
    toast.success("Submitted for verification");
  };

  const uploadFile = async (file: File, kind: "license" | "id") => {
    if (!user) return;
    setBusy(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${user.id}/${kind}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("driver-docs").upload(path, file, { upsert: true });
    if (upErr) { setBusy(false); return toast.error(upErr.message); }
    const col = kind === "license" ? "license_image_url" : "id_image_url";
    const { data, error } = await supabase
      .from("driver_profiles")
      .upsert({
        driver_user_id: user.id,
        full_name: form.full_name || "Driver",
        license_number: form.license_number || "PENDING",
        [col]: path,
      } as any, { onConflict: "driver_user_id" } as any)
      .select()
      .single();
    setBusy(false);
    if (error) return toast.error(error.message);
    setProfile(data as any);
    toast.success(`${kind === "license" ? "License" : "ID"} uploaded`);
  };

  const StatusBadge = () => {
    if (!profile) return null;
    if (profile.status === "verified")
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-700 px-3 py-1 text-xs font-semibold"><BadgeCheck className="h-3.5 w-3.5" /> Verified</span>;
    if (profile.status === "rejected")
      return <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/15 text-destructive px-3 py-1 text-xs font-semibold"><ShieldX className="h-3.5 w-3.5" /> Rejected</span>;
    return <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-700 px-3 py-1 text-xs font-semibold"><Hourglass className="h-3.5 w-3.5" /> Pending review</span>;
  };

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen pb-28">
        <header className="flex items-center gap-3 px-5 py-4 border-b border-border">
          <Link to="/driver/profile" className="p-1"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="font-display text-lg font-bold flex-1">Driver verification</h1>
          <StatusBadge />
        </header>

        {loading ? (
          <p className="px-5 py-10 text-sm text-muted-foreground text-center">Loading…</p>
        ) : (
          <div className="px-5 py-5 space-y-5">
            {profile?.status === "rejected" && profile.reviewer_notes && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                <strong>Reviewer note:</strong> {profile.reviewer_notes}
              </div>
            )}

            <form onSubmit={submit} className="space-y-3">
              <Field label="Full name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
              <Field label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <Field label="License number" value={form.license_number} onChange={(v) => setForm({ ...form, license_number: v })} required />
              <Field label="License expiry" type="date" value={form.license_expiry} onChange={(v) => setForm({ ...form, license_expiry: v })} />
              <Button type="submit" disabled={busy || profile?.status === "verified"} className="w-full h-12 rounded-full">
                {profile ? "Update details" : "Submit for verification"}
              </Button>
            </form>

            <div className="grid grid-cols-2 gap-3">
              <DocCard
                label="License photo"
                uploaded={!!profile?.license_image_url}
                onClick={() => licenseInputRef.current?.click()}
              />
              <DocCard
                label="ID / Passport"
                uploaded={!!profile?.id_image_url}
                onClick={() => idInputRef.current?.click()}
              />
              <input ref={licenseInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "license"); e.currentTarget.value = ""; }} />
              <input ref={idInputRef} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, "id"); e.currentTarget.value = ""; }} />
            </div>

            {profile?.qr_token && (
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <p className="font-display text-base font-bold">Your driver QR</p>
                <p className="text-[11px] text-muted-foreground mt-1">Parents scan this to link you to their child.</p>
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Driver QR code" className="mx-auto mt-3 rounded-xl" width={240} height={240} />
                ) : (
                  <div className="mx-auto mt-3 h-[240px] w-[240px] bg-muted rounded-xl animate-pulse" />
                )}
                <p className="mt-3 text-[10px] font-mono break-all text-muted-foreground">{profile.qr_token}</p>
              </div>
            )}
          </div>
        )}
      </div>
      <DriverTabs />
    </div>
  );
};

function Field({ label, value, onChange, type = "text", required }: any) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground ml-3">{label}</span>
      <Input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 rounded-full bg-secondary/60 border-secondary px-5 text-sm mt-1"
      />
    </label>
  );
}

function DocCard({ label, uploaded, onClick }: { label: string; uploaded: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${uploaded ? "border-emerald-500/40 bg-emerald-500/5" : "border-dashed border-border bg-secondary/40 hover:bg-secondary"}`}>
      <div className="flex items-center justify-between">
        {uploaded ? <BadgeCheck className="h-5 w-5 text-emerald-600" /> : <IdCard className="h-5 w-5 text-primary" />}
        <Upload className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-xs font-semibold mt-3">{label}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{uploaded ? "Uploaded · tap to replace" : "Tap to upload"}</p>
    </button>
  );
}

export default DriverVerification;
