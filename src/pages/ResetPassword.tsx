import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast.error(error.message);
    toast.success("Hasło ustawione");
    navigate("/");
  };
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <form onSubmit={submit} className="w-full max-w-md border border-border bg-card p-10 space-y-4">
        <h1 className="font-display text-3xl text-gold text-center">Nowe hasło</h1>
        <input type="password" required minLength={6} placeholder="Nowe hasło" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-background border border-border px-4 py-3 text-sm focus:border-primary outline-none" />
        <button className="w-full px-6 py-4 bg-gradient-gold text-primary-foreground text-xs tracking-[0.25em] uppercase font-medium">
          Zapisz hasło
        </button>
      </form>
    </main>
  );
};
export default ResetPassword;
