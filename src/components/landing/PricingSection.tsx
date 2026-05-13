import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Parent",
    price: "Free",
    period: "",
    description: "Track your child's transport for free",
    features: [
      "Live map tracking",
      "Proximity alerts",
      "ETA notifications",
      "Trip history (7 days)",
    ],
    cta: "Download App",
    highlighted: false,
  },
  {
    name: "School",
    price: "R49",
    period: "/vehicle/mo",
    description: "Full fleet management for schools",
    features: [
      "Everything in Parent",
      "Admin dashboard",
      "Route management",
      "Driver management",
      "SMS fallback alerts",
      "Safety reports",
      "Priority support",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For transport companies & government programs",
    features: [
      "Everything in School",
      "Multi-school management",
      "API access",
      "AI route optimization",
      "Compliance reporting",
      "Dedicated account manager",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="border-t border-border py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-display text-sm font-semibold uppercase tracking-widest text-primary">
            Pricing
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-muted-foreground">
            Free for parents. Affordable for schools. Scalable for enterprises.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 transition-all ${
                plan.highlighted
                  ? "border-primary bg-card glow-amber scale-[1.02]"
                  : "border-border bg-card hover:border-primary/20"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold text-primary-foreground">
                  Most Popular
                </div>
              )}
              <h3 className="font-display text-xl font-bold text-foreground">
                {plan.name}
              </h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-display text-4xl font-bold text-foreground">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                className={`mt-8 w-full ${plan.highlighted ? "glow-amber-sm" : ""}`}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
