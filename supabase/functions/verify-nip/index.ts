import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

export const validNip = (nip: string) => {
  if (!/^\d{10}$/.test(nip)) return false;
  const w = [6, 5, 7, 2, 3, 4, 5, 6, 7];
  const sum = w.reduce((s, x, i) => s + x * +nip[i], 0);
  return sum % 11 === +nip[9];
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const nip = String(body?.nip ?? "").replace(/\D/g, "");
    if (!validNip(nip)) return json({ exists: false, error: "Nieprawidłowy numer NIP" });
    const date = new Date().toISOString().slice(0, 10);
    const r = await fetch(`https://wl-api.mf.gov.pl/api/search/nip/${nip}?date=${date}`);
    const d = await r.json().catch(() => null);
    const s = d?.result?.subject;
    if (!s) return json({ exists: false, error: "Nie znaleziono firmy o tym NIP w rejestrze" });
    return json({ exists: true, name: s.name, status: s.statusVat, address: s.workingAddress ?? s.residenceAddress ?? "" });
  } catch (e) {
    console.error(e);
    return json({ exists: false, error: "Nie udało się sprawdzić NIP, spróbuj ponownie" }, 500);
  }
});
