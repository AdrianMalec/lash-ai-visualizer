import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import lashClassic from "@/assets/lash-classic.jpg";
import lashVolume from "@/assets/lash-volume.jpg";
import lashCateye from "@/assets/lash-cateye.jpg";
import lashFox from "@/assets/lash-fox.jpg";
import { Upload, Check, Sparkles, Loader2, RefreshCw, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";

const styles = [
  { id: "classic", name: "Classic", img: lashClassic },
  { id: "volume", name: "Mega Volume", img: lashVolume },
  { id: "cateye", name: "Cat Eye", img: lashCateye },
  { id: "fox", name: "Fox Eye", img: lashFox },
];

const fileToDataUrl = (file: File): Promise<string> =>
  new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

export const Scanner = () => {
  const [active, setActive] = useState(styles[1]);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<"pending" | "approved" | "rejected">("pending");
  const inputRef = useRef<HTMLInputElement>(null);

  const onUpload = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Maksymalny rozmiar zdjęcia to 8 MB");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setSourceImage(dataUrl);
    setResultImage(null);
    setDecision("pending");
  };

  const generate = async (styleOverride?: typeof styles[number]) => {
    if (!sourceImage) {
      toast.error("Najpierw wgraj swoje zdjęcie");
      return;
    }
    const chosen = styleOverride ?? active;
    if (styleOverride) setActive(styleOverride);
    setLoading(true);
    setResultImage(null);
    setDecision("pending");
    try {
      const { data, error } = await supabase.functions.invoke("lash-tryon", {
        body: { imageUrl: sourceImage, style: chosen.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data?.image) throw new Error("Brak obrazu w odpowiedzi");
      setResultImage(data.image);
      toast.success(`Stylizacja ${chosen.name} gotowa`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Coś poszło nie tak";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const approve = () => {
    setDecision("approved");
    window.dispatchEvent(new CustomEvent("lash:approved", { detail: { style: active.id } }));
    toast.success("Świetnie! Dobieramy salony pod tę stylizację");
    setTimeout(() => {
      document.getElementById("salons")?.scrollIntoView({ behavior: "smooth" });
    }, 200);
  };

  const reject = () => {
    setDecision("rejected");
    setResultImage(null);
    toast("Spróbuj innej stylizacji poniżej", { icon: "✨" });
  };

  const reset = () => {
    setSourceImage(null);
    setResultImage(null);
    setDecision("pending");
  };

  const suggestions = styles.filter((s) => s.id !== active.id);
  const displayed = resultImage ?? sourceImage;

  return (
    <section id="scanner" className="relative py-32 overflow-hidden">
      <div className="container">
        <div className="text-center mb-20 animate-float-in">
          <span className="text-xs tracking-[0.4em] text-primary uppercase">02 — Try-on</span>
          <h2 className="font-display text-5xl md:text-7xl mt-4 mb-6">
            Zobacz <span className="text-gold italic">siebie</span> w nowych rzęsach
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto font-light">
            Wgraj swoje zdjęcie, wybierz stylizację — AI nałoży ją fotorealistycznie na Twoje oczy
            w kilka sekund.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.1fr,1fr] gap-12 items-center">
          {/* Preview frame */}
          <div className="relative">
            <div className="relative aspect-[3/4] max-w-md mx-auto bg-card border border-border overflow-hidden shadow-deep">
              {!displayed && (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-4 hover:bg-primary/5 transition-luxe group"
                >
                  <div className="w-20 h-20 rounded-full border border-primary/40 flex items-center justify-center group-hover:border-primary group-hover:shadow-glow transition-luxe">
                    <ImagePlus size={28} className="text-primary" />
                  </div>
                  <div className="text-center px-8">
                    <div className="font-display text-2xl mb-2">Wgraj swoje zdjęcie</div>
                    <div className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                      Najlepiej selfie en face
                    </div>
                  </div>
                </button>
              )}

              {displayed && (
                <>
                  <img
                    src={displayed}
                    alt="Twoje zdjęcie z nałożoną stylizacją rzęs"
                    className="w-full h-full object-cover"
                  />
                  {loading && (
                    <>
                      <div className="absolute inset-0 bg-background/40 backdrop-blur-sm" />
                      <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-primary/40 to-transparent animate-scan pointer-events-none" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="text-primary animate-spin" size={32} />
                        <span className="text-[10px] tracking-[0.3em] text-primary uppercase">
                          AI generuje try-on...
                        </span>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Corner brackets */}
              {[
                "top-4 left-4 border-l border-t",
                "top-4 right-4 border-r border-t",
                "bottom-4 left-4 border-l border-b",
                "bottom-4 right-4 border-r border-b",
              ].map((c) => (
                <div key={c} className={`absolute ${c} border-primary w-8 h-8 pointer-events-none`} />
              ))}

              {displayed && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-background/70 backdrop-blur-md border border-primary/30">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="text-[10px] tracking-[0.3em] text-primary uppercase">
                    {resultImage ? "AI Result" : "Original"}
                  </span>
                </div>
              )}

              {resultImage && (
                <div className="absolute bottom-6 inset-x-6 p-4 bg-background/85 backdrop-blur-xl border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase">
                      Stylizacja
                    </span>
                    <span className="text-[10px] text-primary">AI generated</span>
                  </div>
                  <div className="font-display text-2xl">{active.name}</div>
                </div>
              )}
            </div>

            {sourceImage && (
              <button
                onClick={reset}
                className="mt-4 mx-auto flex items-center gap-2 text-[10px] tracking-[0.3em] text-muted-foreground hover:text-primary uppercase transition-luxe"
              >
                <RefreshCw size={11} /> Zmień zdjęcie
              </button>
            )}

            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
            />
          </div>

          {/* Controls */}
          <div className="space-y-10">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Sparkles size={14} className="text-primary" />
                <span className="text-xs tracking-[0.3em] text-muted-foreground uppercase">
                  Wybierz styl
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {styles.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActive(s)}
                    disabled={loading}
                    className={`group relative aspect-square overflow-hidden border transition-luxe disabled:opacity-50 ${
                      active.id === s.id
                        ? "border-primary shadow-gold"
                        : "border-border hover:border-primary/50"
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

            {decision !== "approved" && (
              <div className="space-y-3">
                <button
                  onClick={() => generate()}
                  disabled={loading || !sourceImage}
                  className="w-full px-6 py-4 bg-gradient-gold text-primary-foreground text-xs tracking-[0.25em] uppercase font-medium flex items-center justify-center gap-3 hover:shadow-glow transition-luxe disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Generowanie...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} /> {resultImage ? "Wygeneruj ponownie" : "Wygeneruj try-on AI"}
                    </>
                  )}
                </button>
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={loading}
                  className="w-full px-6 py-4 border border-primary/40 text-foreground text-xs tracking-[0.25em] uppercase flex items-center justify-center gap-3 hover:bg-primary/5 transition-luxe disabled:opacity-50"
                >
                  <Upload size={16} />
                  {sourceImage ? "Wgraj inne zdjęcie" : "Wgraj swoje zdjęcie"}
                </button>
              </div>
            )}

            {resultImage && decision === "pending" && !loading && (
              <div className="space-y-4 p-5 border border-primary/30 bg-primary/5">
                <div className="text-[10px] tracking-[0.3em] uppercase text-primary text-center">
                  Podoba Ci się efekt?
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={reject}
                    className="px-4 py-3 border border-border text-foreground text-[11px] tracking-[0.25em] uppercase flex items-center justify-center gap-2 hover:border-destructive hover:text-destructive transition-luxe"
                  >
                    <X size={14} /> Odrzuć
                  </button>
                  <button
                    onClick={approve}
                    className="px-4 py-3 bg-gradient-gold text-primary-foreground text-[11px] tracking-[0.25em] uppercase font-medium flex items-center justify-center gap-2 hover:shadow-glow transition-luxe"
                  >
                    <Check size={14} /> Zatwierdź
                  </button>
                </div>
              </div>
            )}

            {decision === "rejected" && !loading && (
              <div className="space-y-4 p-5 border border-primary/30 bg-card">
                <div className="text-[10px] tracking-[0.3em] uppercase text-primary text-center">
                  Może któraś z tych?
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => generate(s)}
                      className="group relative aspect-square overflow-hidden border border-border hover:border-primary transition-luxe"
                    >
                      <img src={s.img} alt={s.name} className="w-full h-full object-cover" loading="lazy" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
                      <span className="absolute bottom-2 left-2 right-2 font-display text-sm">
                        {s.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {decision === "approved" && (
              <div className="p-5 border border-primary/40 bg-primary/5 text-center space-y-3">
                <div className="text-[10px] tracking-[0.3em] uppercase text-primary">
                  Stylizacja zatwierdzona
                </div>
                <div className="font-display text-2xl text-gold">{active.name}</div>
                <button
                  onClick={() => setDecision("pending")}
                  className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground hover:text-primary transition-luxe"
                >
                  ← Wróć do wyboru
                </button>
              </div>
            )}

            <div className="hairline" />

            <p className="text-xs text-muted-foreground font-light leading-relaxed">
              ✦ Najlepsze efekty: zdjęcie en face, dobre oświetlenie, oczy szeroko otwarte.
              Możesz też wkleić inspirację z Pinterest jako zdjęcie referencyjne.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
