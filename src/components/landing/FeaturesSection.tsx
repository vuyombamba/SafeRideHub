import {
  MapPin,
  Bell,
  Clock,
  Shield,
  Radio,
  Users,
  Route,
  Smartphone,
} from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Live GPS Tracking",
    description:
      "Track every vehicle in real-time on an interactive map. Parents and students see exactly where their transport is.",
  },
  {
    icon: Bell,
    title: "Proximity Alerts",
    description:
      "Loud ringing alert when transport is approaching. Never miss the bus again — configurable distance triggers.",
  },
  {
    icon: Clock,
    title: "Smart ETA",
    description:
      "AI-powered arrival predictions accounting for traffic, weather, and historical patterns.",
  },
  {
    icon: Shield,
    title: "Safety Controls",
    description:
      "Emergency SOS, driver verification, geofencing, and real-time incident reporting for complete peace of mind.",
  },
  {
    icon: Radio,
    title: "SMS Fallback",
    description:
      "Low connectivity? No problem. Automatic SMS alerts ensure notifications reach every parent, everywhere.",
  },
  {
    icon: Users,
    title: "Multi-Role Access",
    description:
      "Dedicated dashboards for students, parents, drivers, schools, and transport companies.",
  },
  {
    icon: Route,
    title: "Route Management",
    description:
      "Admin tools for route planning, stop assignment, fleet management, and schedule optimization.",
  },
  {
    icon: Smartphone,
    title: "Cross-Platform",
    description:
      "Works on any device — mobile app for parents and students, web dashboard for admins and operators.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="relative py-24">
      <div className="absolute inset-0 bg-radial-glow opacity-50" />
      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
            Features
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Everything You Need for Safe Scholar Transport
          </h2>
          <p className="mt-4 text-muted-foreground">
            A complete platform built for the unique needs of school
            transportation in Africa and beyond.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
