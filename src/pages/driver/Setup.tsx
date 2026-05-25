import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const DriverSetup = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [plate, setPlate] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasVehicle, setHasVehicle] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("vehicles").select("id").eq("driver_user_id", user.id).maybeSingle()
      .then(({ data }) => setHasVehicle(!!data));
  }, [user]);

  useEffect(() => { if (hasVehicle) nav("/driver", { replace: true }); }, [hasVehicle, nav]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const driverName = (user.user_metadata?.display_name as string) || user.email || "Driver";
    const { error } = await supabase.from("vehicles").insert({
      plate_number: plate.toUpperCase().trim(),
      driver_name: driverName,
      driver_user_id: user.id,
      status: "idle",
      lat: 0, lng: 0,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Vehicle registered — waiting for a school to attach you to a route.");
    nav("/driver", { replace: true });
  };

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen flex flex-col px-6 py-10">
        <h1 className="font-display text-2xl font-bold text-primary">Register your vehicle</h1>
        <p className="text-sm text-muted-foreground mt-2">Enter the bus plate you'll be driving.</p>
        <form onSubmit={onSave} className="mt-8 space-y-4">
          <Input required value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="Plate (e.g. CA 123-456)"
            className="h-12 rounded-full bg-secondary/60 border-secondary px-5 text-sm uppercase tracking-wider" />
          <Button type="submit" disabled={busy} className="w-full h-12 rounded-full">Continue</Button>
        </form>
      </div>
    </div>
  );
};
export default DriverSetup;
