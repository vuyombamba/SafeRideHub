import { useState } from "react";
import { MapPin, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <MapPin className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            TRAK
          </span>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          {["Features", "How It Works", "Pricing", "Safety"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm">
            Log In
          </Button>
          <Link to="/dashboard">
            <Button size="sm" className="glow-amber-sm">
              Live Dashboard
            </Button>
          </Link>
        </div>

        <button
          className="text-foreground md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          {["Features", "How It Works", "Pricing", "Safety"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
              className="block py-2 text-sm text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {item}
            </a>
          ))}
          <div className="mt-4 flex gap-3">
            <Button variant="ghost" size="sm" className="flex-1">Log In</Button>
            <Button size="sm" className="flex-1">Get Started</Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
