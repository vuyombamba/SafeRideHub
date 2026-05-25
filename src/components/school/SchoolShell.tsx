import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, Bus, Map, Users, IdCard, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const items = [
  { to: "/school", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/school/vehicles", icon: Bus, label: "Vehicles" },
  { to: "/school/routes", icon: Map, label: "Routes" },
  { to: "/school/students", icon: Users, label: "Students" },
  { to: "/school/drivers", icon: IdCard, label: "Drivers" },
];

export default function SchoolShell() {
  const { signOut, user } = useAuth();
  return (
    <div className="min-h-screen bg-secondary/40 md:grid md:grid-cols-[240px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="hidden md:flex flex-col bg-background border-r border-border p-5">
        <p className="font-display text-lg font-bold text-primary">TRAK · School</p>
        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        <nav className="mt-8 flex-1 space-y-1">
          {items.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end as any}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${
                isActive ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}>
              <Icon className="h-4 w-4" /> {label}
            </NavLink>
          ))}
        </nav>
        <button onClick={() => signOut()} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>

      <main className="min-h-screen pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Mobile bottom tabs */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background border-t border-border">
        <div className="mx-auto max-w-md flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {items.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end as any}
              className={({ isActive }) => `flex flex-col items-center gap-0.5 px-2 py-1.5 text-[10px] font-medium ${
                isActive ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="h-5 w-5" /><span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
