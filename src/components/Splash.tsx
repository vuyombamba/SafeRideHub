import { useEffect, useState } from "react";
import logo from "@/assets/trak-logo.png";

export function Splash({ onDone, minDurationMs = 700 }: { onDone?: () => void; minDurationMs?: number }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setLeaving(true), minDurationMs);
    const t2 = setTimeout(() => onDone?.(), minDurationMs + 300);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [minDurationMs, onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-primary via-primary to-amber-500 transition-opacity duration-500 ${leaving ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* Pulsing rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="absolute h-48 w-48 rounded-full bg-white/10 animate-ping" />
        <span className="absolute h-72 w-72 rounded-full bg-white/5 animate-ping" style={{ animationDelay: "0.4s" }} />
        <span className="absolute h-96 w-96 rounded-full bg-white/5 animate-ping" style={{ animationDelay: "0.8s" }} />
      </div>

      <div className="relative flex flex-col items-center">
        <div className="relative h-32 w-32 rounded-3xl bg-white shadow-2xl flex items-center justify-center animate-[splash-pop_700ms_cubic-bezier(.2,.9,.3,1.4)_both]">
          <img src={logo} alt="TRAK" width={96} height={96} className="h-24 w-24 object-contain" />
        </div>
        <h1 className="mt-6 font-display text-4xl font-extrabold tracking-[0.3em] text-white animate-[splash-fade_900ms_ease-out_200ms_both]">
          TRAK
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.4em] text-white/80 animate-[splash-fade_900ms_ease-out_500ms_both]">
          Every trip. Safer.
        </p>
        <div className="mt-8 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-white animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes splash-pop { 0%{transform:scale(.5) rotate(-12deg);opacity:0} 100%{transform:scale(1) rotate(0);opacity:1} }
        @keyframes splash-fade { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
