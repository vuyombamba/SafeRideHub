import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BottomTabs } from "@/components/parent/BottomTabs";
import { Bell, Menu, Plus, ShieldCheck, Phone, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const Onboarding = lazy(() => import("@/components/Onboarding").then(m => ({ default: m.Onboarding })));

interface Child { id: string; full_name: string; age: number | null; }

const ParentHome = () => {
  const { user, signOut } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const displayName = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there";

  useEffect(() => {
    if (!user) return;
    supabase.from("children").select("id, full_name, age").eq("parent_user_id", user.id).then(({ data }) => {
      if (data) setChildren(data as any);
    });
  }, [user]);

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen pb-24">
        {/* Header */}
        <div className="relative bg-primary rounded-b-[2rem] px-5 pt-6 pb-10 text-primary-foreground">
          <div className="flex items-center justify-between">
            <button onClick={() => signOut()} aria-label="Menu"><Menu className="h-6 w-6" /></button>
            <Bell className="h-6 w-6" />
          </div>
          <p className="mt-4 text-sm opacity-90">Good day,</p>
          <h1 className="font-display text-2xl font-bold capitalize">{displayName}</h1>
          <p className="text-xs opacity-80 mt-1">Your kids' rides at a glance.</p>
        </div>

        {/* Children carousel */}
        <div className="-mt-6 px-5">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-sm">My children</p>
              <Link to="/parent/children" className="text-xs text-primary font-medium">Manage</Link>
            </div>
            {children.length === 0 ? (
              <Link to="/parent/children" className="flex items-center justify-center gap-2 h-20 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground">
                <Plus className="h-4 w-4" /> Add a child
              </Link>
            ) : (
              <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1">
                {children.map((c) => (
                  <div key={c.id} className="shrink-0 w-32 rounded-xl bg-secondary/60 p-3">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {c.full_name[0]}
                    </div>
                    <p className="mt-2 text-sm font-semibold truncate">{c.full_name}</p>
                    <p className="text-[11px] text-muted-foreground">{c.age ? `${c.age} yrs` : "—"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Safety Tips */}
        <section className="px-5 mt-6">
          <p className="font-semibold text-sm mb-3">Safety Tips</p>
          <div className="grid grid-cols-2 gap-3">
            <Tip icon={ShieldCheck} title="Safety Belt" body="Always buckle up before the bus moves." />
            <Tip icon={Phone} title="Emergency Line" body="One-tap call to the operator on duty." />
          </div>
        </section>

        {/* Drivers */}
        <section className="px-5 mt-6">
          <p className="font-semibold text-sm mb-3">Drivers</p>
          <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 flex items-center gap-3">
            <Users className="h-8 w-8" />
            <div className="flex-1">
              <p className="font-semibold text-sm">Verified driver pool</p>
              <p className="text-xs opacity-90">All drivers pass POPIA-compliant background checks.</p>
            </div>
          </div>
        </section>

        <section className="px-5 mt-6">
          <Link to="/parent/track">
            <Button className="w-full h-12 rounded-full">Track now</Button>
          </Link>
        </section>
      </div>
      <BottomTabs />
      <Suspense fallback={null}><Onboarding /></Suspense>
    </div>

  );
};

function Tip({ icon: Icon, title, body }: any) {
  return (
    <div className="rounded-2xl bg-secondary/60 p-4">
      <Icon className="h-5 w-5 text-primary mb-2" />
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-[11px] text-muted-foreground mt-1">{body}</p>
    </div>
  );
}

export default ParentHome;
