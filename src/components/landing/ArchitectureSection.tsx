import { Database, Cloud, Smartphone, Server, Wifi, Lock } from "lucide-react";

const techItems = [
  { icon: Smartphone, label: "Mobile Apps", detail: "Flutter / React Native" },
  { icon: Server, label: "Backend", detail: "Node.js + PostgreSQL" },
  { icon: Cloud, label: "Cloud", detail: "Supabase + AWS" },
  { icon: Wifi, label: "Real-time", detail: "WebSockets" },
  { icon: Database, label: "Maps", detail: "Mapbox / Google Maps" },
  { icon: Lock, label: "Security", detail: "E2E Encryption + POPIA" },
];

const ArchitectureSection = () => {
  return (
    <section id="safety" className="border-t border-border py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
            Architecture
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Built for Scale & Safety
          </h2>
          <p className="mt-4 text-muted-foreground">
            Enterprise-grade infrastructure designed to handle thousands of vehicles
            with sub-2-second latency.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {techItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/20"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <item.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="font-display font-semibold text-foreground">
                  {item.label}
                </div>
                <div className="text-sm text-muted-foreground">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Simple architecture flow */}
        <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-border bg-card p-8">
          <h3 className="mb-6 text-center font-display text-lg font-semibold text-foreground">
            System Flow
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            {[
              "Driver App",
              "→",
              "GPS Stream",
              "→",
              "TRAK Cloud",
              "→",
              "Proximity Engine",
              "→",
              "Alert Push",
              "→",
              "Parent/Student",
            ].map((item, i) => (
              <span
                key={i}
                className={
                  item === "→"
                    ? "text-primary font-bold"
                    : "rounded-lg border border-border bg-secondary px-3 py-2 font-display font-medium text-foreground"
                }
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ArchitectureSection;
