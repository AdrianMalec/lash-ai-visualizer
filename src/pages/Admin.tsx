import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, styleImage } from "@/lib/data";
import { toast } from "sonner";
import { Trash2, Plus, Loader2, Shield } from "lucide-react";

type Tab = "styles" | "salons" | "users";
const input = "w-full bg-background border border-border px-3 py-2 text-sm focus:border-primary outline-none";
const btnGold = "px-4 py-2 bg-gradient-gold text-primary-foreground text-[11px] tracking-[0.2em] uppercase font-medium flex items-center gap-2 disabled:opacity-50";
const btnDel = "p-2 border border-border hover:border-destructive hover:text-destructive transition-luxe";

const StylesTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [f, setF] = useState({ slug: "", name: "", description: "", image_url: "" });
  const load = () => supabase.from("lash_styles").select("*").order("sort_order").then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const slug = f.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const { error } = await supabase.from("lash_styles").insert({
      slug, name: f.name, description: f.description, image_url: f.image_url || null, sort_order: rows.length + 1,
    });
    if (error) return toast.error(error.message);
    toast.success("Dodano stylizację");
    setF({ slug: "", name: "", description: "", image_url: "" });
    load();
  };
  const del = async (id: string) => {
    if (!confirm("Usunąć stylizację?")) return;
    const { error } = await supabase.from("lash_styles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };
  return (
    <div className="space-y-8">
      <form onSubmit={add} className="grid md:grid-cols-2 gap-3 p-5 border border-border bg-card">
        <input required className={input} placeholder="Nazwa (np. Hybrid)" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input required className={input} placeholder="Identyfikator (np. hybrid)" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
        <input className={input + " md:col-span-2"} placeholder="Opis dla AI (np. mix klasyki i volume, 11mm C-curl)" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <input className={input} placeholder="Link do zdjęcia (opcjonalnie)" value={f.image_url} onChange={(e) => setF({ ...f, image_url: e.target.value })} />
        <button className={btnGold + " justify-center"}><Plus size={14} /> Dodaj stylizację</button>
      </form>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((s) => (
          <div key={s.id} className="flex items-center gap-4 p-3 border border-border bg-card">
            <img src={styleImage(s.slug, s.image_url)} alt={s.name} className="w-16 h-16 object-cover" />
            <div className="flex-1 min-w-0">
              <div className="font-display text-xl">{s.name}</div>
              <div className="text-xs text-muted-foreground truncate">{s.slug}</div>
            </div>
            <button className={btnDel} onClick={() => del(s.id)} aria-label="Usuń"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const SalonsTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const empty = { name: "", stylist: "", city: "", price: "", rating: "5", portfolio: "" };
  const [f, setF] = useState(empty);
  const load = () => supabase.from("salons").select("*").order("created_at").then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    // portfolio format: "volume:95, classic:80"
    const portfolio: Record<string, number> = {};
    f.portfolio.split(",").forEach((p) => {
      const [k, v] = p.split(":").map((x) => x.trim());
      if (k && v && !isNaN(+v)) portfolio[k] = Math.min(100, Math.max(0, +v));
    });
    const { error } = await supabase.from("salons").insert({
      name: f.name, stylist: f.stylist, city: f.city, price: f.price, rating: +f.rating || 5, portfolio,
    });
    if (error) return toast.error(error.message);
    toast.success("Dodano salon");
    setF(empty);
    load();
  };
  const del = async (id: string) => {
    if (!confirm("Usunąć salon?")) return;
    const { error } = await supabase.from("salons").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };
  return (
    <div className="space-y-8">
      <form onSubmit={add} className="grid md:grid-cols-3 gap-3 p-5 border border-border bg-card">
        <input required className={input} placeholder="Nazwa salonu" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={input} placeholder="Stylistka" value={f.stylist} onChange={(e) => setF({ ...f, stylist: e.target.value })} />
        <input className={input} placeholder="Miasto" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
        <input className={input} placeholder="Cena (np. od 350 zł)" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
        <input className={input} type="number" step="0.01" min="0" max="5" placeholder="Ocena" value={f.rating} onChange={(e) => setF({ ...f, rating: e.target.value })} />
        <input className={input} placeholder="Portfolio: volume:95, classic:80" value={f.portfolio} onChange={(e) => setF({ ...f, portfolio: e.target.value })} />
        <button className={btnGold + " justify-center md:col-span-3"}><Plus size={14} /> Dodaj salon</button>
      </form>
      <div className="space-y-3">
        {rows.map((s) => (
          <div key={s.id} className="flex items-center gap-4 p-4 border border-border bg-card">
            <div className="flex-1 min-w-0">
              <div className="font-display text-xl">{s.name}</div>
              <div className="text-xs text-muted-foreground">
                {s.stylist} · {s.city} · {s.price} · ★ {s.rating}
              </div>
              <div className="text-[11px] text-primary mt-1">
                {Object.entries(s.portfolio ?? {}).map(([k, v]) => `${k} ${v}`).join(" · ")}
              </div>
            </div>
            <button className={btnDel} onClick={() => del(s.id)} aria-label="Usuń"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
};

const UsersTab = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const call = (body: object) => supabase.functions.invoke("admin-users", { body });
  const load = async () => {
    setLoading(true);
    const { data, error } = await call({ action: "list" });
    setLoading(false);
    if (error || data?.error) return toast.error(data?.error ?? error?.message);
    setRows(data.users);
  };
  useEffect(() => { load(); }, []);
  const act = async (action: string, userId: string, msg: string) => {
    if (action === "delete" && !confirm("Usunąć konto na stałe?")) return;
    const { data, error } = await call({ action, userId });
    if (error || data?.error) return toast.error(data?.error ?? error?.message);
    toast.success(msg);
    load();
  };
  if (loading) return <Loader2 className="animate-spin text-primary" />;
  return (
    <div className="space-y-3">
      {rows.map((u) => (
        <div key={u.id} className="flex items-center gap-4 p-4 border border-border bg-card">
          <div className="flex-1 min-w-0">
            <div className="text-sm truncate">{u.email}</div>
            <div className="text-[11px] text-muted-foreground">
              {u.provider} · {new Date(u.created_at).toLocaleDateString("pl-PL")}
              {u.isAdmin && <span className="text-primary"> · ADMIN</span>}
            </div>
          </div>
          <button className={btnDel} title="Przełącz admina" onClick={() => act("toggleAdmin", u.id, "Zmieniono rolę")}>
            <Shield size={14} />
          </button>
          <button className={btnDel} title="Usuń konto" onClick={() => act("delete", u.id, "Usunięto konto")}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

const Admin = () => {
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("styles");

  useEffect(() => {
    if (isAdmin === false) navigate("/auth");
  }, [isAdmin, navigate]);

  if (!isAdmin)
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </main>
    );

  const tabs: [Tab, string][] = [["styles", "Stylizacje"], ["salons", "Salony"], ["users", "Konta"]];
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between h-20">
          <Link to="/" className="font-display text-3xl tracking-wider text-gold">LASHIQUE</Link>
          <span className="text-[10px] tracking-[0.4em] uppercase text-muted-foreground">Panel administracyjny</span>
        </div>
      </header>
      <div className="container py-10">
        <div className="flex gap-2 mb-8 border-b border-border">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-5 py-3 text-xs tracking-[0.25em] uppercase transition-luxe border-b-2 -mb-px ${
                tab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "styles" && <StylesTab />}
        {tab === "salons" && <SalonsTab />}
        {tab === "users" && <UsersTab />}
      </div>
    </main>
  );
};

export default Admin;
