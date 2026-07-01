import { useEffect, useMemo, useState } from "react";
import salon1 from "@/assets/salon-1.jpg";
import salon2 from "@/assets/salon-2.jpg";
import salon3 from "@/assets/salon-3.jpg";
import lashClassic from "@/assets/lash-classic.jpg";
import lashVolume from "@/assets/lash-volume.jpg";
import lashCateye from "@/assets/lash-cateye.jpg";
import lashFox from "@/assets/lash-fox.jpg";
import { MapPin, Star, Calendar, Award, Sparkles, Eye } from "lucide-react";

type Style = "classic" | "volume" | "cateye" | "doll" | "fox" | "wet";

const STYLE_LABEL: Record<Style, string> = {
  classic: "Classic",
  volume: "Mega Volume",
  cateye: "Cat Eye",
  doll: "Doll",
  fox: "Fox Eye",
  wet: "Wet Look",
};

const STYLE_IMG: Partial<Record<Style, string>> = {
  classic: lashClassic,
  volume: lashVolume,
  cateye: lashCateye,
  fox: lashFox,
  doll: lashClassic,
  wet: lashVolume,
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
  {
    name: "Studio Éclat",
    stylist: "Julia Nowak",
    img: salon2,
    city: "Gdańsk, Wrzeszcz",
    rating: 4.92,
    reviews: 156,
    price: "od 360 zł",
    portfolio: { classic: 96, doll: 88, volume: 84, cateye: 70 },
  },
  {
    name: "Atelier Rouge",
    stylist: "Zofia Lewandowska",
    img: salon1,
    city: "Poznań, Jeżyce",
    rating: 4.9,
    reviews: 201,
    price: "od 350 zł",
    portfolio: { doll: 95, classic: 90, volume: 82, fox: 76 },
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
      const base = approvedStyle ? s.portfolio[approvedStyle] ?? 0 : 90;
      const match = Math.min(99, Math.round(base + (s.rating - 4.9) * 8));
      const topStyles = (Object.entries(s.portfolio) as [Style, number][])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 4);
      const specialty = topStyles[0]?.[0] ?? "classic";
      return { ...s, match, specialty, topStyles };
    });
    scored.sort((a, b) => b.match - a.match);
    // when a style is approved, show only salons that actually master it (>=70)
    return approvedStyle
      ? scored.filter((s) => (s.portfolio[approvedStyle] ?? 0) >= 70).slice(0, 3)
      : scored.slice(0, 3);
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
            {approvedStyle
              ? "Wybraliśmy dla Ciebie stylistki, które specjalizują się dokładnie w tej stylizacji. Zobacz ich portfolio poniżej."
              : "Zatwierdź stylizację w skanerze, a my automatycznie pokażemy Ci top stylistki z najlepszym portfolio pod Twój wybór."}
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

        <div className="space-y-8">
          {ranked.map((s, i) => (
            <article
              key={s.name}
              className="group bg-card border border-border hover:border-primary/40 hover:shadow-deep transition-luxe animate-float-in"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="grid md:grid-cols-[320px,1fr,auto] gap-8 p-6">
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
                </div>
              </div>

              {/* Portfolio strip */}
              <div className="border-t border-border/60 px-6 py-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Eye size={13} className="text-primary" />
                    <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
                      Portfolio stylistki
                    </span>
                  </div>
                  <button className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground hover:text-primary transition-luxe">
                    Zobacz wszystko →
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {s.topStyles.map(([styleKey, score]) => {
                    const isMatch = approvedStyle === styleKey;
                    return (
                      <div
                        key={styleKey}
                        className={`relative aspect-square overflow-hidden border transition-luxe ${
                          isMatch ? "border-primary shadow-gold" : "border-border/60"
                        }`}
                      >
                        <img
                          src={STYLE_IMG[styleKey] ?? lashClassic}
                          alt={`${s.name} — ${STYLE_LABEL[styleKey]}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/20 to-transparent" />
                        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                          <span className="font-display text-xs leading-tight">
                            {STYLE_LABEL[styleKey]}
                          </span>
                          <span
                            className={`text-[9px] tracking-wider ${
                              isMatch ? "text-gold" : "text-muted-foreground"
                            }`}
                          >
                            {score}
                          </span>
                        </div>
                        {isMatch && (
                          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] tracking-[0.15em] uppercase">
                            Twój wybór
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
