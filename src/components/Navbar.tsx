import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { id: "hero", label: "Start" },
  { id: "scanner", label: "AR Try-On" },
  { id: "gallery", label: "Inspiracje" },
  { id: "salons", label: "Salony" },
];

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setEmail(s?.user?.email ?? null));
    supabase.auth.getSession().then(({ data }) => setEmail(data.session?.user?.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setOpen(false);
  };

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-luxe ${
        scrolled ? "bg-background/85 backdrop-blur-xl border-b border-border" : "bg-transparent"
      }`}
    >
      <nav className="container flex items-center justify-between h-20">
        <button onClick={() => scrollTo("hero")} className="flex items-baseline gap-2">
          <span className="font-display text-3xl tracking-wider text-gold">LASHIQUE</span>
          <span className="text-[10px] tracking-[0.4em] text-muted-foreground uppercase">studio</span>
        </button>

        <div className="hidden md:flex items-center gap-10">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="text-sm tracking-wide text-muted-foreground hover:text-primary transition-luxe"
            >
              {l.label}
            </button>
          ))}
          {email ? (
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm tracking-wide text-muted-foreground hover:text-primary transition-luxe"
              title={email}
            >
              Wyloguj
            </button>
          ) : (
            <Link to="/auth" className="text-sm tracking-wide text-muted-foreground hover:text-primary transition-luxe">
              Zaloguj
            </Link>
          )}
          <button
            onClick={() => scrollTo("scanner")}
            className="px-6 py-2.5 bg-gradient-gold text-primary-foreground text-xs tracking-[0.2em] uppercase font-medium hover:shadow-glow transition-luxe"
          >
            Spróbuj AI
          </button>
        </div>

        <button className="md:hidden text-foreground" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border">
          <div className="container py-6 flex flex-col gap-4">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => scrollTo(l.id)}
                className="text-left py-2 text-foreground hover:text-primary transition-luxe"
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
