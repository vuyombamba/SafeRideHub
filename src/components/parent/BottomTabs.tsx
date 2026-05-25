import { Home, MapPin, MessageCircle, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/parent", icon: Home, label: "Home", end: true },
  { to: "/parent/track", icon: MapPin, label: "Track" },
  { to: "/parent/chat", icon: MessageCircle, label: "Chat" },
  { to: "/parent/profile", icon: User, label: "Profile" },
];

export function BottomTabs() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-background border-t border-border">
      <div className="mx-auto max-w-md flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {items.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end as any}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-4 py-1.5 text-[11px] font-medium ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
