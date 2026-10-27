import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/** Signs out any account that the admin has not approved yet. */
export const ApprovalGuard = () => {
  useEffect(() => {
    const check = async (uid?: string) => {
      if (!uid || window.location.pathname === "/reset-password") return;
      const { data } = await supabase.from("profiles").select("status").eq("id", uid).maybeSingle();
      if (data?.status === "approved") return;
      const { data: admin } = await supabase.rpc("has_role", { _user_id: uid, _role: "admin" });
      if (admin) return;
      await supabase.auth.signOut();
      toast.error(
        data?.status === "rejected"
          ? "Twoje konto zostało odrzucone przez administratora"
          : "Konto czeka na akceptację administratora",
      );
    };
    supabase.auth.getSession().then(({ data }) => check(data.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setTimeout(() => check(s?.user.id), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);
  return null;
};
