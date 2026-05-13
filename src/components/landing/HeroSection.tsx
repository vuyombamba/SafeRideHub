import { Button } from "@/components/ui/button";
import { ArrowRight, Bell } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const RadarPulse = () => (
  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
    <div className="h-4 w-4 rounded-full bg-primary animate-pulse-dot" />
    <div className="absolute inset-0 h-4 w-4 rounded-full border-2 border-primary animate-radar-ping" />
    <div className="absolute inset-0 h-4 w-4 rounded-full border-2 border-primary animate-radar-ping-delay" />
  </div>
);

const HeroSection = () => {
  return (
    <section className="relative min-h-screen overflow-hidden pt-16">
      {/* Background layers */}
      <div className="absolute inset-0 bg-grid-pattern opacity-30" />
      <div className="absolute inset-0 bg-radial-glow" />

      <div className="container relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5">
          <Bell className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">
            Transport Real-time Alert for Kids
          </span>
        </div>

        <h1 className="font-display text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          <span className="text-foreground">Know When</span>
          <br />
          <span className="text-gradient-amber">The Bus Arrives</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
          Real-time GPS tracking, proximity alerts, and ETA predictions for
          school transport. Keep every learner safe, every parent informed.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Button size="lg" className="glow-amber gap-2 px-8 text-base font-semibold">
            Start Free Trial
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" className="gap-2 px-8 text-base">
            Watch Demo
          </Button>
        </div>

        {/* Hero image with radar overlay */}
        <div className="relative mt-12 w-full max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-border shadow-2xl">
            <img
              src={heroBg}
              alt="TRAK school transport GPS tracking platform showing live bus routes on a digital map"
              className="w-full"
            />
          </div>
          {/* Radar pulse overlay */}
          <div className="absolute left-[52%] top-[45%]">
            <RadarPulse />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid w-full max-w-3xl grid-cols-3 gap-8 border-t border-border pt-8">
          {[
            { value: "99.9%", label: "Uptime" },
            { value: "<2s", label: "GPS Latency" },
            { value: "POPIA", label: "Compliant" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="font-display text-2xl font-bold text-primary sm:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
