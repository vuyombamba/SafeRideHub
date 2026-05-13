import { MapPin } from "lucide-react";

const FooterSection = () => {
  return (
    <footer className="border-t border-border bg-card py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <MapPin className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">TRAK</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Transport Real-time Alert for Kids. Making scholar transport safe, trackable, and stress-free.
            </p>
          </div>

          {[
            {
              title: "Product",
              links: ["Features", "Pricing", "API", "Integrations"],
            },
            {
              title: "Company",
              links: ["About", "Careers", "Blog", "Contact"],
            },
            {
              title: "Legal",
              links: ["Privacy (POPIA)", "Terms", "Security", "Compliance"],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold text-foreground">{col.title}</h4>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} TRAK. All rights reserved. Built in South Africa 🇿🇦
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
