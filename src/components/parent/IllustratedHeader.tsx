// Soft blue illustrated header reused across welcome/login/signup, matching Figma reference.
export function IllustratedHeader({ title, subtitle }: { title?: string; subtitle?: string }) {
  return (
    <div className="relative h-56 w-full overflow-hidden">
      {/* sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-sky-50" />
      {/* clouds */}
      <svg className="absolute top-6 left-6 h-6 w-12 text-sky-200" viewBox="0 0 60 20" fill="currentColor">
        <ellipse cx="15" cy="10" rx="10" ry="6" /><ellipse cx="30" cy="12" rx="14" ry="7" /><ellipse cx="48" cy="10" rx="10" ry="6" />
      </svg>
      <svg className="absolute top-12 right-8 h-5 w-10 text-sky-200" viewBox="0 0 60 20" fill="currentColor">
        <ellipse cx="15" cy="10" rx="10" ry="6" /><ellipse cx="35" cy="12" rx="14" ry="7" />
      </svg>
      {/* mountain + flag */}
      <svg className="absolute bottom-12 left-1/2 -translate-x-1/2 h-24 w-40" viewBox="0 0 200 100" fill="none">
        <path d="M40 90 L100 30 L160 90 Z" fill="hsl(207 89% 54% / 0.18)" stroke="hsl(207 89% 54%)" strokeWidth="2"/>
        <path d="M100 30 L115 50 L100 60 Z" fill="hsl(0 84% 60%)"/>
        <circle cx="60" cy="40" r="6" fill="hsl(207 89% 54%)"/>
        <line x1="60" y1="40" x2="60" y2="90" stroke="hsl(220 25% 30%)" strokeWidth="1.5"/>
        <path d="M30 95 Q 100 80 170 95" stroke="hsl(207 89% 54%)" strokeWidth="2" strokeDasharray="4 4" fill="none"/>
      </svg>
      {/* base wave */}
      <svg className="absolute bottom-0 inset-x-0 w-full h-12" viewBox="0 0 400 60" preserveAspectRatio="none">
        <path d="M0 40 Q100 10 200 30 T400 25 V60 H0 Z" fill="hsl(207 89% 54% / 0.08)"/>
      </svg>
      {title && (
        <div className="absolute bottom-2 inset-x-0 text-center">
          <p className="font-display text-xl font-bold text-primary">{title}</p>
          {subtitle && <p className="text-sm text-primary/80">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}

export function ScooterIllustration({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 160" fill="none">
      <path d="M0 130 Q50 110 100 125 T200 120 V160 H0 Z" fill="hsl(207 89% 54%)"/>
      <path d="M0 140 Q60 125 130 135 T200 132 V160 H0 Z" fill="hsl(207 89% 44%)"/>
      <circle cx="60" cy="120" r="14" fill="hsl(220 25% 15%)"/>
      <circle cx="60" cy="120" r="6" fill="white"/>
      <circle cx="130" cy="120" r="14" fill="hsl(220 25% 15%)"/>
      <circle cx="130" cy="120" r="6" fill="white"/>
      <path d="M60 120 L95 80 L130 120 Z" stroke="hsl(220 25% 15%)" strokeWidth="3" fill="white"/>
      <circle cx="95" cy="65" r="14" fill="hsl(220 25% 15%)"/>
      <path d="M95 78 L95 105" stroke="hsl(220 25% 15%)" strokeWidth="6" strokeLinecap="round"/>
      <path d="M120 70 L140 55" stroke="hsl(220 25% 15%)" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );
}
