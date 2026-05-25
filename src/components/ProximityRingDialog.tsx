import { Bus, BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RingingAlert } from "@/hooks/useRingingAlert";

interface Props {
  alert: RingingAlert | null;
  onDismiss: () => void;
}

export function ProximityRingDialog({ alert, onDismiss }: Props) {
  if (!alert) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl bg-background border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
        <div className="relative bg-gradient-to-br from-amber-400 to-orange-500 px-6 py-8 text-center">
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 h-8 w-8 inline-flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto h-20 w-20 rounded-full bg-white/25 flex items-center justify-center animate-pulse">
            <BellRing className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-white">Bus is arriving!</h2>
          <p className="mt-1 text-white/90 text-sm">Get {alert.studentName} ready</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl bg-muted/50 px-4 py-3">
            <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
              <Bus className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{alert.vehiclePlate}</p>
              <p className="text-xs text-muted-foreground">Approaching pickup</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border px-3 py-3 text-center">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Distance</p>
              <p className="text-xl font-extrabold text-foreground mt-1">
                {alert.distanceMeters < 1000
                  ? `${alert.distanceMeters}m`
                  : `${(alert.distanceMeters / 1000).toFixed(1)}km`}
              </p>
            </div>
            <div className="rounded-2xl border border-border px-3 py-3 text-center">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">ETA</p>
              <p className="text-xl font-extrabold text-primary mt-1">~{alert.etaMinutes} min</p>
            </div>
          </div>
          <Button onClick={onDismiss} className="w-full h-12 text-base font-semibold">
            Got it, silence ring
          </Button>
        </div>
      </div>
    </div>
  );
}
