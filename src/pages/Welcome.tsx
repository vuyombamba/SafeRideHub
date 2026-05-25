import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth, homeForRoles } from "@/hooks/useAuth";

import { Users, Bus, School as SchoolIcon } from "lucide-react";
import trakLogo from "@/assets/trak-logo.png";

const slides = [
  { title: "Every trip.\nUnbreakable safety.", body: "Real-time tracking, secure scholar manifests, and rapid emergency response in one rugged platform." },
  { title: "Travel with ease", body: "Live ETA, route changes, and proximity alerts the moment your child's bus is near." },
  { title: "Make connects with TRAK", body: "Drivers, parents, schools — one trusted thread." },
];

const roleOptions = [
  { role: "parent", label: "I'm a Parent", desc: "Track my child's bus", Icon: Users },
  { role: "driver", label: "I'm a Driver", desc: "Run my route & stream GPS", Icon: Bus },
  { role: "school", label: "I'm a School", desc: "Manage fleet & students", Icon: SchoolIcon },
] as const;

const Welcome = () => {
  const nav = useNavigate();
  const { user, roles, loading, rolesLoaded } = useAuth();
  const [idx, setIdx] = useState(0);
  const [showRoles, setShowRoles] = useState(false);

  useEffect(() => {
    if (!loading && user && rolesLoaded) nav(homeForRoles(roles), { replace: true });
  }, [user, roles, loading, rolesLoaded, nav]);

  const slide = slides[idx];

  if (showRoles) {
    return (
      <div className="min-h-screen bg-secondary/40 flex justify-center">
        <div className="w-full max-w-md bg-background min-h-screen flex flex-col px-6 py-8">
          <img src={trakLogo} alt="TRAK" width={96} height={96} className="mx-auto h-20 w-20 sm:h-24 sm:w-24 object-contain drop-shadow-sm" />
          <h1 className="font-display text-2xl font-bold text-center text-primary mt-4">Who's signing up?</h1>
          <p className="text-sm text-muted-foreground text-center mt-2 mb-8">Pick the account that fits you.</p>
          <div className="space-y-3">
            {roleOptions.map(({ role, label, desc, Icon }) => (
              <button
                key={role}
                onClick={() => nav(`/auth?role=${role}`)}
                className="w-full flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary hover:shadow-sm transition"
              >
                <div className="h-12 w-12 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => nav("/auth")} className="mt-8 text-sm text-primary font-medium">
            Already have an account? Log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/40 flex justify-center">
      <div className="w-full max-w-md bg-background min-h-screen flex flex-col">
        <img src={trakLogo} alt="TRAK" width={96} height={96} className="mx-auto mt-6 sm:mt-10 h-20 w-20 sm:h-24 sm:w-24 object-contain drop-shadow-sm" />
        <div className="flex-1 px-8 pt-8 flex flex-col">
          <h1 className="font-display text-2xl font-bold text-center text-primary whitespace-pre-line">{slide.title}</h1>
          <p className="text-sm text-muted-foreground text-center mt-3">{slide.body}</p>
          <div className="flex justify-center gap-1.5 mt-6">
            {slides.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-primary" : "w-1.5 bg-border"}`} />
            ))}
          </div>
          <div className="mt-auto pb-8 space-y-3">
            {idx < slides.length - 1 ? (
              <>
                <Button onClick={() => setIdx(idx + 1)} className="w-full h-12 rounded-full text-base font-semibold">Next</Button>
                <button onClick={() => setShowRoles(true)} className="w-full text-sm text-muted-foreground">Skip</button>
              </>
            ) : (
              <>
                <Button onClick={() => setShowRoles(true)} className="w-full h-12 rounded-full text-base font-semibold">Get Started</Button>
                <Button onClick={() => nav("/auth")} variant="outline" className="w-full h-12 rounded-full text-base font-semibold border-primary text-primary">Login</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
