import { Link } from "react-router-dom";
import { Bus, MapPin, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: MapPin, title: "Live Tracking", desc: "See every bus on the map in real time." },
  { icon: Bell, title: "Proximity Alerts", desc: "Get notified when the bus is near pickup." },
  { icon: Bus, title: "Fleet Overview", desc: "Operators monitor every active vehicle." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold">TRAK</span>
        </div>
        <Link to="/dashboard">
          <Button variant="ghost" size="sm">Dashboard</Button>
        </Link>
      </header>

      <main className="container mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight">
          Know exactly where the bus is.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Live GPS tracking and pickup alerts for school transport — built for parents and operators.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/parent" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto">Open Parent App</Button>
          </Link>
          <Link to="/dashboard" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">Operator Dashboard</Button>
          </Link>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-3 text-left">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-border p-5 bg-card">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        TRAK · MVP
      </footer>
    </div>
  );
};

export default Index;
