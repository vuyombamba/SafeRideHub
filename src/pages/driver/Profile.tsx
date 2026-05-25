import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DriverTabs } from "@/components/driver/BottomTabs";
import { Button } from "@/components/ui/button";
import { BadgeCheck, LogOut } from "lucide-react";

const DriverProfile = () => {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen pb-24 px-5 pt-8">
        <h1 className="font-display text-2xl font-bold">Profile</h1>
        <div className="mt-6 rounded-2xl border border-border p-4 bg-card">
          <p className="text-sm font-semibold">{(user?.user_metadata?.display_name as string) || user?.email}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Link to="/driver/verify" className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <BadgeCheck className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium flex-1">Verification & QR code</span>
          <span className="text-muted-foreground">›</span>
        </Link>
        <Button onClick={() => signOut()} variant="outline" className="w-full h-12 rounded-full mt-6">
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
      <DriverTabs />
    </div>
  );
};
export default DriverProfile;
