import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useStyles } from "@/lib/data";
import { type ApprovedVisualization, type SalonMatch } from "@/lib/salon-matching";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin, Sparkles, Eye, Loader2, RefreshCw, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

type Result = { matches: SalonMatch[]; analyzedPhotos: number; skippedPhotos: number; emptyReason: string | null };
const EMPTY_MESSAGES: Record<string, string> = {
  no_portfolio: "Salony nie dodały jeszcze zdjęć swoich prac. Nie mamy portfolio do porównania z Twoją wizualizacją.",
  unreadable_portfolio: "Zdjęcia portfolio są obecnie niedostępne. Spróbuj ponownie później.",
  target_not_visible: "Na wizualizacji rzęsy nie są wystarczająco widoczne. Wygeneruj efekt ze zdjęcia z wyraźnie widocznymi oczami.",
  no_similar_work: "Nie znaleźliśmy jeszcze wystarczająco podobnych prac w portfolio salonów.",
};

export const Salons = () => {
  const styles = useStyles();
  const [approved, setApproved] = useState<ApprovedVisualization | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [retry, setRetry] = useState(0);
  const [opened, setOpened] = useState<SalonMatch | null>(null);
  const version = useRef(0);

  useEffect(() => {
    const onApproved = (event: Event) => {
      const detail = (event as CustomEvent<ApprovedVisualization>).detail;
      if (typeof detail?.image !== "string" || !detail.image) return;
      version.current++;
      setApproved(detail); setResult(null); setError(null); setOpened(null);
    };
    const onReset = () => {
      version.current++;
      setApproved(null); setResult(null); setError(null); setLoading(false); setOpened(null);
    };
    window.addEventListener("lash:approved", onApproved);
    window.addEventListener("lash:reset", onReset);
    return () => {
      window.removeEventListener("lash:approved", onApproved);
      window.removeEventListener("lash:reset", onReset);
    };
  }, []);

  useEffect(() => {
    if (!approved) return;
    let cancelled = false;
    const requestVersion = ++version.current;
    const current = () => !cancelled && requestVersion === version.current;
    setLoading(true); setError(null); setNeedsLogin(false); setResult(null);
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!current()) return;
        if (!session.session) { setNeedsLogin(true); return; }
        const { data, error: invokeError } = await supabase.functions.invoke<Result & { error?: string }>("match-salons", {
          body: { image: approved.image, style: approved.style },
        });
        if (!current()) return;
        if (invokeError) {
          let message = "Nie udało się dopasować salonów. Spróbuj ponownie.";
          const response = invokeError.context;
          if (response instanceof Response) {
            const body = await response.json().catch(() => null);
            if (typeof body?.error === "string") message = body.error;
            if (response.status === 401) setNeedsLogin(true);
          }
          throw new Error(message);
        }
        if (data?.error) throw new Error(data.error);
        if (!data || !Array.isArray(data.matches)) throw new Error("Nieprawidłowa odpowiedź dopasowania");
        setResult(data);
      } catch (e) {
        if (current()) setError(e instanceof Error ? e.message : "Nie udało się dopasować salonów");
      } finally { if (current()) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [approved, retry]);

  const photoLabel = (photo: SalonMatch["photos"][number]) => photo.custom_style || styles.find(s => s.slug === photo.style_slug)?.name || "Stylizacja rzęs";

  return (
    <section id="salons" className="relative py-32">
      <div className="container">
        <div className="text-center mb-14 animate-float-in">
          <span className="text-xs tracking-[0.4em] text-primary uppercase">04 — Match</span>
          <h2 className="font-display text-5xl md:text-7xl mt-4 mb-6">Salony pod <span className="text-gold italic">Twoją</span> wizję</h2>
          {approved && <div className="inline-flex items-center gap-3 text-sm text-primary"><Sparkles size={16} />{styles.find(s => s.slug === approved.style)?.name || "Twoja wizualizacja"}</div>}
        </div>

        {!approved && <p className="text-center text-muted-foreground">Zatwierdź wizualizację, aby znaleźć pasujące prace salonów.</p>}
        {loading && <div role="status" className="flex items-center justify-center gap-3 py-12 text-primary"><Loader2 className="animate-spin" />Porównujemy rzęsy ze zdjęciami portfolio…</div>}
        {needsLogin && !loading && <div className="text-center space-y-4"><p className="text-muted-foreground">Zaloguj się, aby znaleźć salon dla tej wizualizacji.</p><Button asChild><Link to="/auth"><LogIn /> Zaloguj się</Link></Button><Button variant="outline" className="ml-2" onClick={() => setRetry(v => v + 1)}><RefreshCw /> Sprawdź ponownie</Button></div>}
        {error && !needsLogin && <div role="alert" className="text-center space-y-4"><p className="text-destructive">{error}</p><Button variant="outline" onClick={() => setRetry(v => v + 1)}><RefreshCw /> Spróbuj ponownie</Button></div>}
        {result && result.matches.length === 0 && <div role="status" className="text-center max-w-xl mx-auto space-y-4"><p className="text-muted-foreground">{EMPTY_MESSAGES[result.emptyReason ?? "no_similar_work"]}</p><Button variant="outline" onClick={() => setRetry(v => v + 1)}><RefreshCw /> Sprawdź ponownie</Button></div>}
        {result && result.matches.length > 0 && <>
          <p className="text-center text-xs text-muted-foreground mb-8">Porównano {result.analyzedPhotos} zdjęć · podobieństwo ocenione przez AI</p>
          <div className="space-y-8">
            {result.matches.map(s => <article key={s.id} className="bg-card border border-border p-6">
              <div className="grid md:grid-cols-[240px,1fr] gap-6">
                <div className="relative aspect-square overflow-hidden">
                  <img src={s.photos[0]?.url} alt={`Pasująca praca salonu ${s.name}`} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 px-3 py-2 bg-background/90 border border-primary/40 text-xs text-primary">{s.match}% podobieństwa AI</span>
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <h3 className="font-display text-4xl break-words">{s.name}</h3>
                  {s.stylist && <p className="text-sm text-muted-foreground mt-2">{s.stylist}</p>}
                  {s.city && <p className="flex items-center gap-2 text-sm text-muted-foreground mt-4"><MapPin size={14} className="text-primary" />{s.city}</p>}
                  <p className="text-sm text-muted-foreground mt-4">{s.reason}</p>
                  {s.price && <p className="font-display text-2xl text-gold mt-4">{s.price}</p>}
                  <div className="flex flex-wrap gap-3 mt-5"><Button asChild><Link to={`/bookings?salon=${s.id}`}>Umów wizytę</Link></Button><Button variant="outline" onClick={() => setOpened(s)}><Eye /> Zobacz pasujące prace ({s.photos.length})</Button></div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                {s.photos.slice(0, 4).map(p => <figure key={p.id}>
                  <div className="aspect-square overflow-hidden"><img src={p.url} alt={p.caption || photoLabel(p)} loading="lazy" className="w-full h-full object-cover" /></div>
                  <figcaption className="text-xs text-muted-foreground mt-2 break-words">{photoLabel(p)} · {p.score}%</figcaption>
                </figure>)}
              </div>
            </article>)}
          </div>
        </>}
        {result && result.skippedPhotos > 0 && <p className="text-center text-xs text-muted-foreground mt-6">Nie udało się odczytać {result.skippedPhotos} zdjęć portfolio.</p>}
      </div>
      <Dialog open={!!opened} onOpenChange={open => { if (!open) setOpened(null); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Pasujące prace — {opened?.name}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4">{opened?.photos.map(p => <figure key={p.id}>
            <img src={p.url} alt={p.caption || photoLabel(p)} className="aspect-square w-full object-cover" loading="lazy" />
            <figcaption className="text-sm mt-2 break-words">{photoLabel(p)} · {p.score}%</figcaption>
            <p className="text-xs text-muted-foreground mt-1">{p.reason}</p>
          </figure>)}</div>
        </DialogContent>
      </Dialog>
    </section>
  );
};
