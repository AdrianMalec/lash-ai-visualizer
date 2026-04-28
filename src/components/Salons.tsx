import salon1 from "@/assets/salon-1.jpg";
import salon2 from "@/assets/salon-2.jpg";
import salon3 from "@/assets/salon-3.jpg";
import { MapPin, Star, Calendar, Award } from "lucide-react";

const salons = [
  {
    name: "Maison Lumière",
    stylist: "Anna Kowalewska",
    img: salon1,
    city: "Warszawa, Mokotów",
    rating: 4.98,
    reviews: 312,
    specialty: "Mega Volume",
    match: 96,
    price: "od 380 zł",
  },
  {
    name: "Velvet Lash Bar",
    stylist: "Karolina Wiśniewska",
    img: salon2,
    city: "Kraków, Kazimierz",
    rating: 4.94,
    reviews: 248,
    specialty: "Cat Eye & Fox",
    match: 93,
    price: "od 340 zł",
  },
  {
    name: "Noir Atelier",
    stylist: "Magda Borkowska",
    img: salon3,
    city: "Wrocław, Stare Miasto",
    rating: 4.96,
    reviews: 189,
    specialty: "Editorial",
    match: 91,
    price: "od 420 zł",
  },
];

export const Salons = () => {
  return (
    <section id="salons" className="relative py-32">
      <div className="container">
        <div className="text-center mb-20 animate-float-in">
          <span className="text-xs tracking-[0.4em] text-primary uppercase">04 — Match</span>
          <h2 className="font-display text-5xl md:text-7xl mt-4 mb-6">
            Salony pod <span className="text-gold italic">Twoją</span> wizję
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-light">
            Algorytm porównuje wybraną stylizację z portfolio stylistek i pokazuje top dopasowania
            — uwzględniając styl, ocenę i lokalizację.
          </p>
        </div>

        <div className="space-y-6">
          {salons.map((s, i) => (
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
                    <span className="text-[10px] tracking-[0.2em] text-primary uppercase">{s.match}% match</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-[10px] tracking-[0.3em] text-primary uppercase mb-3">{s.specialty}</span>
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
                  <div className="text-[10px] tracking-[0.25em] text-muted-foreground uppercase">Cena</div>
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
