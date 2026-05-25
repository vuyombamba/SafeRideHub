import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { BottomTabs } from "@/components/parent/BottomTabs";
import { Button } from "@/components/ui/button";
import { LogOut, Shield, History, User as UserIcon, Bell, UserCog } from "lucide-react";

const Profile = () => {
  const { user, roles, hasRole, signOut } = useAuth();
  const displayName = (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen pb-24">
        <header className="bg-primary rounded-b-[2rem] px-5 pt-8 pb-12 text-primary-foreground text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-white/20 flex items-center justify-center">
            <UserIcon className="h-10 w-10" />
          </div>
          <h1 className="font-display text-xl font-bold mt-3 capitalize">{displayName}</h1>
          <p className="text-xs opacity-90">{user?.email}</p>
          <div className="flex justify-center gap-1.5 mt-2">
            {roles.length > 0 ? roles.map((r) => (
              <span key={r} className="text-[10px] uppercase tracking-wide bg-white/20 px-2 py-0.5 rounded-full">{r}</span>
            )) : <span className="text-[10px] opacity-80">No role yet</span>}
          </div>
        </header>

        <div className="-mt-6 mx-5 rounded-2xl bg-card border border-border shadow-sm divide-y divide-border">
          <Row icon={Bell} label="Alert preferences" to="/parent/preferences" />
          <Row icon={UserCog} label="My drivers" to="/parent/drivers" />
          {(hasRole("admin") || hasRole("operator")) && <Row icon={Shield} label="Operator dashboard" to="/dashboard" />}
          {hasRole("admin") && <Row icon={Shield} label="Role management" to="/admin/roles" />}
          {hasRole("admin") && <Row icon={History} label="Audit log" to="/admin/audit" />}
        </div>

        <div className="px-5 mt-6">
          <Button onClick={() => signOut()} variant="outline" className="w-full h-12 rounded-full border-destructive/30 text-destructive">
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </Button>
        </div>
      </div>
      <BottomTabs />
    </div>
  );
};

function Row({ icon: Icon, label, to }: any) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="h-5 w-5 text-primary" />
      <span className="text-sm font-medium flex-1">{label}</span>
      <span className="text-muted-foreground">›</span>
    </Link>
  );
}

export default Profile;
