import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, MapPin, ShieldCheck, Users } from "lucide-react";

const KEY = "trak_onboarding_done_v1";

const steps = [
  {
    icon: MapPin,
    title: "Live tracking",
    body: "Follow your child's vehicle in real time on the map with sub-2-second updates.",
  },
  {
    icon: Bell,
    title: "Proximity ringing",
    body: "Your phone rings automatically when the bus enters the 500 m zone — never miss pickup.",
  },
  {
    icon: ShieldCheck,
    title: "Verified drivers",
    body: "Every driver is vetted with license verification and POPIA-compliant checks.",
  },
  {
    icon: Users,
    title: "Add your drivers",
    body: "Scan a driver's QR code to add them to your trusted circle in seconds.",
  },
];

export function Onboarding({ onDone }: { onDone?: () => void }) {
  const [show, setShow] = useState(false);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(KEY)) setShow(true);
  }, []);

  const finish = () => {
    localStorage.setItem(KEY, "1");
    setShow(false);
    onDone?.();
  };

  if (!show) return null;
  const Step = steps[i];
  const isLast = i === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur flex items-center justify-center px-6 animate-fade-in">
      <div className="w-full max-w-sm flex flex-col items-center text-center animate-scale-in">
        <div className="h-24 w-24 rounded-3xl bg-primary/15 text-primary flex items-center justify-center mb-6">
          <Step.icon className="h-12 w-12" />
        </div>
        <h2 className="font-display text-2xl font-bold">{Step.title}</h2>
        <p className="text-sm text-muted-foreground mt-3">{Step.body}</p>
        <div className="flex gap-1.5 mt-6">
          {steps.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
            />
          ))}
        </div>
        <div className="mt-8 w-full space-y-3">
          <Button
            className="w-full h-12 rounded-full"
            onClick={() => (isLast ? finish() : setI(i + 1))}
          >
            {isLast ? "Get started" : "Next"}
          </Button>
          {!isLast && (
            <button onClick={finish} className="w-full text-sm text-muted-foreground">
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
