import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useIsSalon } from "@/lib/data";
import { Button } from "@/components/ui/button";

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
  const isAdmin = useIsAdmin();
  const isSalon = useIsSalon();

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

        <div className="hidden xl:flex items-center gap-5">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => scrollTo(l.id)}
              className="text-sm tracking-wide text-muted-foreground hover:text-primary transition-luxe"
            >
              {l.label}
            </button>
          ))}
          <Button asChild variant="outline" size="sm"><Link to="/bookings">Umów wizytę</Link></Button>
          {email && <Button asChild variant="ghost" size="sm"><Link to="/bookings?view=mine">Moje wizyty</Link></Button>}
          {isSalon && (
            <Link to="/salon" className="text-sm tracking-wide text-primary hover:text-gold transition-luxe">
              Mój salon
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="text-sm tracking-wide text-primary hover:text-gold transition-luxe">
              Admin
            </Link>
          )}
          {email ? (
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm tracking-wide text-muted-foreground hover:text-primary transition-luxe"
              title={email}
            >
              Wyloguj
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm"><Link to="/auth">Zaloguj</Link></Button>
              <Button asChild variant="outline" size="sm"><Link to="/auth?mode=signup">Zarejestruj się</Link></Button>
            </div>
          )}
          <button
            onClick={() => scrollTo("scanner")}
            className="px-6 py-2.5 bg-gradient-gold text-primary-foreground text-xs tracking-[0.2em] uppercase font-medium hover:shadow-glow transition-luxe"
          >
            Spróbuj AI
          </button>
        </div>

        <div className="flex gap-2 xl:hidden"><Button asChild variant="outline" size="sm"><Link to="/bookings">Umów wizytę</Link></Button><Button variant="ghost" size="icon" className="text-foreground" onClick={() => setOpen(!open)} aria-label={open ? "Zamknij menu" : "Otwórz menu"} aria-expanded={open}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </Button></div>
      </nav>

      {open && (
        <div className="xl:hidden bg-background/95 backdrop-blur-xl border-t border-border">
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
            <div className="border-t border-border pt-4 flex flex-col gap-3">
              <Button asChild variant="outline"><Link to="/bookings?view=mine" onClick={() => setOpen(false)}>Moje wizyty</Link></Button>
              {isSalon && <Button asChild variant="outline"><Link to="/salon" onClick={() => setOpen(false)}>Mój salon</Link></Button>}
              {isAdmin && <Button asChild variant="outline"><Link to="/admin" onClick={() => setOpen(false)}>Admin</Link></Button>}
              {email ? (
                <Button variant="outline" onClick={() => { supabase.auth.signOut(); setOpen(false); }}>Wyloguj</Button>
              ) : (
                <>
                  <Button asChild variant="outline"><Link to="/auth" onClick={() => setOpen(false)}>Zaloguj</Link></Button>
                  <Button asChild><Link to="/auth?mode=signup" onClick={() => setOpen(false)}>Zarejestruj się</Link></Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
