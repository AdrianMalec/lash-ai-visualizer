import heroEye from "@/assets/hero-eye.jpg";
import { ArrowRight, Sparkles } from "lucide-react";

export const Hero = () => {
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroEye}
          alt="Luksusowe przedłużanie rzęs — close-up oka"
          className="w-full h-full object-cover opacity-70"
          width={1920}
          height={1080}
        />
        <div className="absolute inset-0 bg-overlay-dark" />
        <div className="absolute inset-0 bg-radial-gold opacity-50" />
      </div>

      <div className="container relative z-10 grid md:grid-cols-2 gap-12 items-center pt-24 pb-16">
        <div className="animate-float-in">
          <div className="flex items-center gap-3 mb-8">
            <div className="hairline w-12" />
            <span className="text-xs tracking-[0.4em] text-primary uppercase flex items-center gap-2">
              <Sparkles size={12} /> AI Beauty Studio
            </span>
          </div>

          <h1 className="font-display text-6xl md:text-8xl leading-[0.95] mb-8">
            Twoje
            <span className="block text-gold italic">marzone</span>
            rzęsy.
          </h1>

          <p className="text-lg text-muted-foreground max-w-md mb-12 font-light leading-relaxed">
            Zeskanuj swoją twarz, przymierz dowolną stylizację rzęs w czasie rzeczywistym i znajdź stylistkę,
            której portfolio idealnie pasuje do Twojej wizji.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => scrollTo("scanner")}
              className="group px-8 py-4 bg-gradient-gold text-primary-foreground text-xs tracking-[0.25em] uppercase font-medium hover:shadow-glow transition-luxe flex items-center gap-3"
            >
              Rozpocznij skan AI
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-luxe" />
            </button>
            <button
              onClick={() => scrollTo("gallery")}
              className="px-8 py-4 border border-primary/40 text-foreground text-xs tracking-[0.25em] uppercase hover:bg-primary/5 transition-luxe"
            >
              Zobacz inspiracje
            </button>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-md">
            {[
              { n: "2.4k+", l: "Stylistek" },
              { n: "180+", l: "Stylizacji" },
              { n: "98%", l: "Trafień AI" },
            ].map((s) => (
              <div key={s.l}>
                <div className="font-display text-3xl text-gold">{s.n}</div>
                <div className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 animate-shimmer">
        <span className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">Przewiń</span>
        <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
      </div>
    </section>
  );
};
