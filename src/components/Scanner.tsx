import { useState } from "react";
import arScan from "@/assets/ar-scan.jpg";
import lashClassic from "@/assets/lash-classic.jpg";
import lashVolume from "@/assets/lash-volume.jpg";
import lashCateye from "@/assets/lash-cateye.jpg";
import lashFox from "@/assets/lash-fox.jpg";
import { Camera, Upload, Check, Sparkles } from "lucide-react";

const styles = [
  { id: "classic", name: "Classic", img: lashClassic },
  { id: "volume", name: "Mega Volume", img: lashVolume },
  { id: "cateye", name: "Cat Eye", img: lashCateye },
  { id: "fox", name: "Fox Eye", img: lashFox },
];

export const Scanner = () => {
  const [active, setActive] = useState(styles[1]);

  return (
    <section id="scanner" className="relative py-32 overflow-hidden">
      <div className="container">
        <div className="text-center mb-20 animate-float-in">
          <span className="text-xs tracking-[0.4em] text-primary uppercase">02 — Try-on</span>
          <h2 className="font-display text-5xl md:text-7xl mt-4 mb-6">
            Zobacz <span className="text-gold italic">siebie</span> w nowych rzęsach
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-light">
            Nasza AI mapuje 468 punktów twarzy w czasie rzeczywistym i nakłada wybraną stylizację
            — także z Twoich inspiracji z Pinterest.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.1fr,1fr] gap-12 items-center">
          {/* AR camera mockup */}
          <div className="relative">
            <div className="relative aspect-[3/4] max-w-md mx-auto bg-card border border-border overflow-hidden shadow-deep">
              <img
                src={arScan}
                alt="Skan twarzy AR z nakładką stylizacji rzęs"
                className="w-full h-full object-cover"
                loading="lazy"
                width={1080}
                height={1440}
              />
              {/* Scan line */}
              <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-primary/30 to-transparent animate-scan pointer-events-none" />

              {/* Corner brackets */}
              {[
                "top-4 left-4 border-l border-t",
                "top-4 right-4 border-r border-t",
                "bottom-4 left-4 border-l border-b",
                "bottom-4 right-4 border-r border-b",
              ].map((c) => (
                <div key={c} className={`absolute ${c} border-primary w-8 h-8`} />
              ))}

              {/* Top status */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-background/70 backdrop-blur-md border border-primary/30">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                <span className="text-[10px] tracking-[0.3em] text-primary uppercase">Live AI Scan</span>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-6 inset-x-6 p-4 bg-background/80 backdrop-blur-xl border border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">Aktualnie</span>
                  <span className="text-[10px] text-primary">98% match</span>
                </div>
                <div className="font-display text-2xl">{active.name}</div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Sparkles size={14} className="text-primary" />
                <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">Wybierz styl</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActive(s)}
                    className={`group relative aspect-square overflow-hidden border transition-luxe ${
                      active.id === s.id ? "border-primary shadow-gold" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <img src={s.img} alt={s.name} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <span className="font-display text-lg">{s.name}</span>
                      {active.id === s.id && (
                        <span className="w-6 h-6 rounded-full bg-gradient-gold flex items-center justify-center">
                          <Check size={12} className="text-primary-foreground" />
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <button className="w-full px-6 py-4 bg-gradient-gold text-primary-foreground text-xs tracking-[0.25em] uppercase font-medium flex items-center justify-center gap-3 hover:shadow-glow transition-luxe">
                <Camera size={16} />
                Włącz kamerę
              </button>
              <button className="w-full px-6 py-4 border border-primary/40 text-foreground text-xs tracking-[0.25em] uppercase flex items-center justify-center gap-3 hover:bg-primary/5 transition-luxe">
                <Upload size={16} />
                Wklej z Pinterest
              </button>
            </div>

            <div className="hairline" />

            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { n: "01", l: "Skan 3D" },
                { n: "02", l: "Try-on" },
                { n: "03", l: "Match" },
              ].map((s) => (
                <div key={s.n}>
                  <div className="font-display text-2xl text-gold">{s.n}</div>
                  <div className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
