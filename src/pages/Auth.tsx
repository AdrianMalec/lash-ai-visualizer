import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const field = "w-full bg-background border border-border px-4 py-3 text-sm focus:border-primary outline-none";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initial = searchParams.get("mode");
  const requestedNext = searchParams.get("next") || sessionStorage.getItem("auth-next") || "/";
  const next = requestedNext.startsWith("/bookings") && !requestedNext.startsWith("//") ? requestedNext : "/";
  const [mode, setMode] = useState<"login" | "signup" | "salon">(
    initial === "signup" ? "signup" : initial === "salon" ? "salon" : "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [salon, setSalon] = useState({ company_name: "", nip: "", city: "", address: "" });
  const [nipInfo, setNipInfo] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && navigate(next));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { if (s) { sessionStorage.removeItem("auth-next"); navigate(next); } });
    return () => sub.subscription.unsubscribe();
  }, [navigate, next]);

  const checkNip = async () => {
    const { data, error } = await supabase.functions.invoke("verify-nip", { body: { nip: salon.nip } });
    if (error || !data?.exists) {
      setNipInfo({ ok: false, text: data?.error ?? "Nie udało się sprawdzić NIP" });
      return false;
    }
    setNipInfo({ ok: true, text: `Firma znaleziona: ${data.name}` });
    if (!salon.company_name) setSalon((s) => ({ ...s, company_name: data.name }));
    return true;
  };

  const reset = async () => {
    if (!email) return toast.error("Wpisz najpierw adres e-mail");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return toast.error(error.message);
    toast.success("Wysłaliśmy link do ustawienia hasła");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return;
      }
      if (mode === "salon" && !(await checkNip())) return;
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: mode === "salon" ? { account_type: "salon", ...salon } : { account_type: "user" },
        },
      });
      if (error) throw error;
      toast.success("Potwierdź e-mail. Konto będzie aktywne po akceptacji administratora.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd logowania");
    } finally {
      setLoading(false);
    }
  };

  const social = async (provider: "google" | "apple") => {
    sessionStorage.setItem("auth-next", next);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error instanceof Error ? result.error.message : "Błąd logowania");
      return;
    }
    if (result.redirected) return;
    navigate(next);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-md border border-border bg-card p-10 shadow-deep">
        <Link to="/" className="block text-center font-display text-3xl tracking-wider text-gold mb-2">
          LASHIQUE
        </Link>
        <p className="text-center text-xs tracking-[0.3em] uppercase text-muted-foreground mb-8">
          {mode === "login" ? "Zaloguj się" : "Załóż konto"}
        </p>
        {mode !== "login" && (
          <p className="text-center text-[11px] text-muted-foreground -mt-4 mb-6">
            Nowe konta są aktywowane po akceptacji administratora.
          </p>
        )}

        <div className="space-y-3 mb-6">
          <button
            onClick={() => social("google")}
            className="w-full px-6 py-3 border border-border hover:border-primary text-xs tracking-[0.2em] uppercase transition-luxe"
          >
            Kontynuuj z Google
          </button>
          <button
            onClick={() => social("apple")}
            className="w-full px-6 py-3 border border-border hover:border-primary text-xs tracking-[0.2em] uppercase transition-luxe"
          >
            Kontynuuj z Apple
          </button>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="hairline flex-1" />
          <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">lub</span>
          <div className="hairline flex-1" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 text-sm focus:border-primary outline-none"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-background border border-border px-4 py-3 text-sm focus:border-primary outline-none"
          />
          {mode === "salon" && (
            <>
              <div className="flex gap-2">
                <input required inputMode="numeric" placeholder="NIP (10 cyfr)" value={salon.nip}
                  onChange={(e) => { setSalon({ ...salon, nip: e.target.value }); setNipInfo(null); }} className={field} />
                <button type="button" onClick={checkNip}
                  className="px-4 border border-border hover:border-primary text-[11px] tracking-[0.2em] uppercase whitespace-nowrap">
                  Sprawdź
                </button>
              </div>
              {nipInfo && <p className={`text-xs ${nipInfo.ok ? "text-primary" : "text-destructive"}`}>{nipInfo.text}</p>}
              <input required placeholder="Nazwa salonu" value={salon.company_name}
                onChange={(e) => setSalon({ ...salon, company_name: e.target.value })} className={field} />
              <input required placeholder="Miasto" value={salon.city}
                onChange={(e) => setSalon({ ...salon, city: e.target.value })} className={field} />
              <input required placeholder="Adres salonu" value={salon.address}
                onChange={(e) => setSalon({ ...salon, address: e.target.value })} className={field} />
            </>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-gradient-gold text-primary-foreground text-xs tracking-[0.25em] uppercase font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === "login" ? "Zaloguj" : mode === "salon" ? "Zarejestruj salon" : "Zarejestruj"}
          </button>
        </form>

        {mode === "login" && (
          <button onClick={reset} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-primary">
            Nie pamiętasz hasła / logowałeś się przez Google? Ustaw hasło
          </button>
        )}
        <div className="mt-6 flex flex-col gap-2 text-center text-xs text-muted-foreground">
          {mode !== "login" && <button onClick={() => setMode("login")} className="hover:text-primary">Masz konto? Zaloguj się</button>}
          {mode !== "signup" && <button onClick={() => setMode("signup")} className="hover:text-primary">Załóż konto klientki</button>}
          {mode !== "salon" && <button onClick={() => setMode("salon")} className="hover:text-primary">Zarejestruj salon (wymagany NIP)</button>}
        </div>
      </div>
    </main>
  );
};

export default Auth;
