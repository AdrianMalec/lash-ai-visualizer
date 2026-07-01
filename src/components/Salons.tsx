import { useEffect, useMemo, useState } from "react";
import salon1 from "@/assets/salon-1.jpg";
import salon2 from "@/assets/salon-2.jpg";
import salon3 from "@/assets/salon-3.jpg";
import { MapPin, Star, Calendar, Award, Sparkles } from "lucide-react";

type Style = "classic" | "volume" | "cateye" | "doll" | "fox" | "wet";

const STYLE_LABEL: Record<Style, string> = {
  classic: "Classic",
  volume: "Mega Volume",
  cateye: "Cat Eye",
  doll: "Doll",
  fox: "Fox Eye",
  wet: "Wet Look",
};

type Salon = {
  name: string;
  stylist: string;
  img: string;
  city: string;
  rating: number;
  reviews: number;
  price: string;
  portfolio: Partial<Record<Style, number>>; // 0-100 mastery per style
};

const SALONS: Salon[] = [
  {
    name: "Maison Lumière",
    stylist: "Anna Kowalewska",
    img: salon1,
    city: "Warszawa, Mokotów",
    rating: 4.98,
    reviews: 312,
    price: "od 380 zł",
    portfolio: { volume: 98, doll: 90, classic: 82, cateye: 74 },
  },
  {
    name: "Velvet Lash Bar",
    stylist: "Karolina Wiśniewska",
    img: salon2,
    city: "Kraków, Kazimierz",
    rating: 4.94,
    reviews: 248,
    price: "od 340 zł",
    portfolio: { cateye: 97, fox: 92, wet: 80, classic: 78 },
  },
  {
    name: "Noir Atelier",
    stylist: "Magda Borkowska",
    img: salon3,
    city: "Wrocław, Stare Miasto",
    rating: 4.96,
    reviews: 189,
    price: "od 420 zł",
    portfolio: { fox: 96, wet: 94, volume: 88, cateye: 85 },
  },
];

export const Salons = () => {
  const [approvedStyle, setApprovedStyle] = useState<Style | null>(null);

  useEffect(() => {
    const onApproved = (e: Event) => {
      const style = (e as CustomEvent<{ style: Style }>).detail?.style;
      if (style) setApprovedStyle(style);
    };
    window.addEventListener("lash:approved", onApproved as EventListener);
    return () => window.removeEventListener("lash:approved", onApproved as EventListener);
  }, []);

  const ranked = useMemo(() => {
    const scored = SALONS.map((s) => {
      const base = approvedStyle ? s.portfolio[approvedStyle] ?? 40 : 90;
      // small tie-breaker on rating
      const match = Math.min(99, Math.round(base + (s.rating - 4.9) * 8));
      const specialty =
        (Object.entries(s.portfolio).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]?.[0] as Style) ??
        "classic";
      return { ...s, match, specialty };
    });
    scored.sort((a, b) => b.match - a.match);
    return scored;
  }, [approvedStyle]);

  return (
    <section id="salons" className="relative py-32">
      <div className="container">
        <div className="text-center mb-14 animate-float-in">
          <span className="text-xs tracking-[0.4em] text-primary uppercase">04 — Match</span>
          <h2 className="font-display text-5xl md:text-7xl mt-4 mb-6">
            Salony pod <span className="text-gold italic">Twoją</span> wizję
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-light">
            Algorytm porównuje wybraną stylizację z portfolio stylistek i pokazuje top dopasowania
            — uwzględniając styl, ocenę i lokalizację.
          </p>

          {approvedStyle && (
            <div className="mt-8 inline-flex items-center gap-3 px-5 py-2.5 border border-primary/40 bg-primary/5">
              <Sparkles size={14} className="text-primary" />
              <span className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground">
                Dopasowano do:
              </span>
              <span className="text-[11px] tracking-[0.25em] uppercase text-gold">
                {STYLE_LABEL[approvedStyle]}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {ranked.map((s, i) => (
            <article
              key={s.name}
              className="group grid md:grid-cols-[320px,1fr,auto] gap-8 p-6 bg-card border border-border hover:border-primary/40 hover:shadow-deep transition-luxe animate-float-in"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="relative aspect-[4/3] md:aspect-square overflow-hidden">
                <img
                  src={s.img}
                  alt={`Wnętrze ${s.name}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-luxe"
                  loading="lazy"
                />
                <div className="absolute top-3 left-3 px-3 py-1.5 bg-background/85 backdrop-blur-md border border-primary/40">
                  <div className="flex items-center gap-1.5">
                    <Award size={11} className="text-primary" />
                    <span className="text-[10px] tracking-[0.2em] text-primary uppercase">
                      {s.match}% match
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[10px] tracking-[0.3em] text-primary uppercase mb-3">
                  Specjalizacja: {STYLE_LABEL[s.specialty]}
                </span>
                <h3 className="font-display text-4xl mb-2">{s.name}</h3>
                <p className="text-sm text-muted-foreground mb-5">by {s.stylist}</p>

                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <MapPin size={13} className="text-primary" /> {s.city}
                  </span>
                  <span className="flex items-center gap-2">
                    <Star size={13} className="text-primary fill-primary" />
                    <span className="text-foreground">{s.rating}</span>
                    <span className="text-muted-foreground/60">({s.reviews})</span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-stretch md:items-end justify-center gap-3 md:min-w-[180px]">
                <div className="text-right">
                  <div className="text-[10px] tracking-[0.25em] text-muted-foreground uppercase">
                    Cena
                  </div>
                  <div className="font-display text-3xl text-gold">{s.price}</div>
                </div>
                <button className="px-6 py-3 bg-gradient-gold text-primary-foreground text-xs tracking-[0.25em] uppercase font-medium flex items-center justify-center gap-2 hover:shadow-glow transition-luxe">
                  <Calendar size={13} />
                  Zarezerwuj
                </button>
                <button className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-primary transition-luxe">
                  Zobacz portfolio →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
