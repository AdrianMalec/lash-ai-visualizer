import { useState } from "react";
import lashClassic from "@/assets/lash-classic.jpg";
import lashVolume from "@/assets/lash-volume.jpg";
import lashCateye from "@/assets/lash-cateye.jpg";
import lashDoll from "@/assets/lash-doll.jpg";
import lashFox from "@/assets/lash-fox.jpg";
import lashWet from "@/assets/lash-wet.jpg";
import { Heart } from "lucide-react";

const items = [
  { name: "Classic Natural", tag: "Codzienne", img: lashClassic, length: "9-11mm", curl: "C" },
  { name: "Mega Volume", tag: "Glamour", img: lashVolume, length: "13-15mm", curl: "D" },
  { name: "Cat Eye", tag: "Kuszący", img: lashCateye, length: "10-13mm", curl: "CC" },
  { name: "Doll Look", tag: "Romantyczny", img: lashDoll, length: "10-12mm", curl: "D" },
  { name: "Fox Eye", tag: "Editorial", img: lashFox, length: "11-14mm", curl: "L" },
  { name: "Wet Spikes", tag: "Anime", img: lashWet, length: "12-14mm", curl: "M" },
];

const filters = ["Wszystkie", "Codzienne", "Glamour", "Editorial", "Anime"];

export const Gallery = () => {
  const [filter, setFilter] = useState("Wszystkie");
  const [liked, setLiked] = useState<string[]>([]);

  const toggle = (n: string) =>
    setLiked((p) => (p.includes(n) ? p.filter((x) => x !== n) : [...p, n]));

  const visible = filter === "Wszystkie" ? items : items.filter((i) => i.tag === filter);

  return (
    <section id="gallery" className="relative py-32 bg-card/30">
      <div className="container">
        <div className="flex flex-wrap items-end justify-between gap-8 mb-16">
          <div>
            <span className="text-xs tracking-[0.4em] text-primary uppercase">03 — Inspiracje</span>
            <h2 className="font-display text-5xl md:text-7xl mt-4">
              Galeria <span className="text-gold italic">stylizacji</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2.5 text-[10px] tracking-[0.25em] uppercase border transition-luxe ${
                  filter === f
                    ? "bg-gradient-gold text-primary-foreground border-transparent"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visible.map((item, i) => (
            <article
              key={item.name}
              className="group relative aspect-[4/5] overflow-hidden bg-card border border-border hover:border-primary/40 transition-luxe animate-float-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <img
                src={item.img}
                alt={`Stylizacja rzęs ${item.name}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-luxe"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

              <button
                onClick={() => toggle(item.name)}
                className="absolute top-4 right-4 w-10 h-10 bg-background/60 backdrop-blur-md border border-border flex items-center justify-center hover:border-primary transition-luxe"
                aria-label="Polub"
              >
                <Heart
                  size={14}
                  className={liked.includes(item.name) ? "fill-primary text-primary" : "text-foreground"}
                />
              </button>

              <div className="absolute bottom-0 inset-x-0 p-6">
                <span className="text-[10px] tracking-[0.3em] text-primary uppercase">{item.tag}</span>
                <h3 className="font-display text-3xl mt-2 mb-3">{item.name}</h3>
                <div className="flex gap-4 text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                  <span>L {item.length}</span>
                  <span className="text-border">|</span>
                  <span>Skręt {item.curl}</span>
                </div>
                <button className="mt-4 text-xs tracking-[0.25em] uppercase text-primary opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-luxe">
                  Przymierz →
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
