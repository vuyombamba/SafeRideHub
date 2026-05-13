import { Bus, Radar, BellRing, CheckCircle } from "lucide-react";

const steps = [
  {
    icon: Bus,
    step: "01",
    title: "Driver Starts Trip",
    description:
      "The driver activates GPS broadcasting. Their location streams to the TRAK cloud in real-time.",
  },
  {
    icon: Radar,
    step: "02",
    title: "Live Tracking",
    description:
      "Students and parents see the bus moving on a live map with accurate ETA to their stop.",
  },
  {
    icon: BellRing,
    step: "03",
    title: "Proximity Alert",
    description:
      "When the bus enters the configured radius, a loud ringing alert notifies the student to get ready.",
  },
  {
    icon: CheckCircle,
    step: "04",
    title: "Safe Arrival",
    description:
      "Parents receive confirmation when their child boards. Full trip history logged for safety records.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="border-t border-border py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
            How It Works
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            From GPS to Peace of Mind
          </h2>
        </div>

        <div className="relative mt-16 grid gap-8 md:grid-cols-4">
          {/* Connector line */}
          <div className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent md:block" />

          {steps.map((step) => (
            <div key={step.step} className="relative text-center">
              <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-border bg-card" />
                <div className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary font-display text-xs font-bold text-primary-foreground">
                  {step.step}
                </div>
                <step.icon className="relative h-8 w-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
