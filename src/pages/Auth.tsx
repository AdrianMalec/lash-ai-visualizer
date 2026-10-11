import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => data.session && navigate("/"));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => s && navigate("/"));
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Sprawdź skrzynkę e-mail, aby potwierdzić konto");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Błąd logowania");
    } finally {
      setLoading(false);
    }
  };

  const social = async (provider: "google" | "apple") => {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error instanceof Error ? result.error.message : "Błąd logowania");
      return;
    }
    if (result.redirected) return;
    navigate("/");
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
          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-4 bg-gradient-gold text-primary-foreground text-xs tracking-[0.25em] uppercase font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {mode === "login" ? "Zaloguj" : "Zarejestruj"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
          className="mt-6 w-full text-center text-xs text-muted-foreground hover:text-primary transition-luxe"
        >
          {mode === "login" ? "Nie masz konta? Zarejestruj się" : "Masz konto? Zaloguj się"}
        </button>
      </div>
    </main>
  );
};

export default Auth;
