import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const SchoolSetup = () => {
  const nav = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("schools").select("id").eq("admin_user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) nav("/school", { replace: true }); });
  }, [user, nav]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("schools").insert({
      name: name.trim(), address: address.trim() || null, contact_phone: phone.trim() || null,
      admin_user_id: user.id,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("School created");
    nav("/school", { replace: true });
  };

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen flex flex-col px-6 py-10">
        <h1 className="font-display text-2xl font-bold text-primary">Set up your school</h1>
        <p className="text-sm text-muted-foreground mt-2">Add your school profile to start managing buses, routes, and students.</p>
        <form onSubmit={onSave} className="mt-8 space-y-4">
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="School name" className="h-12 rounded-full bg-secondary/60 border-secondary px-5" />
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="h-12 rounded-full bg-secondary/60 border-secondary px-5" />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Contact phone" className="h-12 rounded-full bg-secondary/60 border-secondary px-5" />
          <Button type="submit" disabled={busy} className="w-full h-12 rounded-full">Create school</Button>
        </form>
      </div>
    </div>
  );
};
export default SchoolSetup;
