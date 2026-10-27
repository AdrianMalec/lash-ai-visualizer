import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Brak autoryzacji" }, 401);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u, error: ue } = await admin.auth.getUser(token);
    if (ue || !u.user) return json({ error: "Brak autoryzacji" }, 401);
    const { data: role } = await admin.from("user_roles").select("id").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!role) return json({ error: "Brak uprawnień" }, 403);

    const { action, userId } = await req.json();
    if (action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
      if (error) throw error;
      const { data: roles } = await admin.from("user_roles").select("user_id, role");
      const { data: profs } = await admin.from("profiles").select("*");
      return json({
        users: data.users.map((x) => {
          const p = profs?.find((r) => r.id === x.id);
          return {
            id: x.id,
            email: x.email,
            created_at: x.created_at,
            provider: x.app_metadata?.provider,
            isAdmin: !!roles?.find((r) => r.user_id === x.id && r.role === "admin"),
            status: p?.status ?? "pending",
            account_type: p?.account_type ?? "user",
            company_name: p?.company_name, nip: p?.nip, city: p?.city, address: p?.address,
          };
        }),
      });
    }
    if (action === "approve" || action === "reject") {
      if (!userId) return json({ error: "Brak użytkownika" }, 400);
      const status = action === "approve" ? "approved" : "rejected";
      const { data: p, error } = await admin.from("profiles").update({ status }).eq("id", userId).select().maybeSingle();
      if (error) throw error;
      if (action === "approve" && p?.account_type === "salon" && p.company_name) {
        const { data: ex } = await admin.from("salons").select("id").eq("name", p.company_name).maybeSingle();
        if (!ex) await admin.from("salons").insert({ name: p.company_name, city: p.city ?? "", rating: 5, portfolio: {} });
      }
      return json({ ok: true });
    }
    if (action === "delete") {
      if (!userId || userId === u.user.id) return json({ error: "Nie możesz usunąć własnego konta" }, 400);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return json({ ok: true });
    }
    if (action === "toggleAdmin") {
      if (!userId || userId === u.user.id) return json({ error: "Nie możesz zmienić własnej roli" }, 400);
      const { data: ex } = await admin.from("user_roles").select("id").eq("user_id", userId).eq("role", "admin").maybeSingle();
      if (ex) await admin.from("user_roles").delete().eq("id", ex.id);
      else await admin.from("user_roles").insert({ user_id: userId, role: "admin" });
      return json({ ok: true });
    }
    return json({ error: "Nieznana akcja" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "Błąd" }, 500);
  }
});
