import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStyles } from "@/lib/data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

type Salon = { id: string; name: string; city: string; stylist: string; price: string };
type Photo = { id: string; url: string; style_slug: string | null; custom_style: string; caption: string };
type Employee = { id: string; name: string; role: string; phone: string; color: string; avatar_url: string | null };
type Service = { id: string; name: string; description: string; price: string; duration_min: number };
type Appt = {
  id: string; employee_id: string | null; client_name: string; client_phone: string;
  service: string; starts_at: string; duration_min: number; notes: string;
};

const HOURS = Array.from({ length: 13 }, (_, i) => 8 + i); // 8:00–20:00
const DAYS = ["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"];
const startOfWeek = (d: Date) => {
  const x = new Date(d); x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
};
const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export default function SalonPanel() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);
  const [salon, setSalon] = useState<Salon | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      const id = s.session?.user.id;
      if (!id) return nav("/auth");
      setUid(id);
      const { data } = await supabase.from("salons").select("id,name,city,stylist,price").eq("owner_id", id).maybeSingle();
      setSalon(data as Salon | null);
      setLoading(false);
    })();
  }, [nav]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-10">
        <Link to="/" className="text-xs tracking-[0.3em] uppercase text-muted-foreground hover:text-primary">← Strona główna</Link>
        <h1 className="font-display text-5xl mt-4 mb-2">Panel salonu</h1>
        {!salon ? (
          <p className="text-muted-foreground mt-6">
            Twoje konto nie jest jeszcze powiązane z salonem. Panel pojawi się, gdy administrator zaakceptuje rejestrację salonu.
          </p>
        ) : (
          <>
            <p className="text-gold font-display text-2xl mb-8">{salon.name}</p>
            <Tabs defaultValue="calendar">
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="calendar">Kalendarz</TabsTrigger>
                <TabsTrigger value="services">Usługi</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="team">Pracownicy</TabsTrigger>
                <TabsTrigger value="profile">Profil</TabsTrigger>
              </TabsList>
              <TabsContent value="calendar"><CalendarTab salonId={salon.id} /></TabsContent>
              <TabsContent value="services"><ServicesTab salonId={salon.id} /></TabsContent>
              <TabsContent value="portfolio"><PortfolioTab salonId={salon.id} uid={uid!} /></TabsContent>
              <TabsContent value="team"><TeamTab salonId={salon.id} uid={uid!} /></TabsContent>
              <TabsContent value="profile"><ProfileTab salon={salon} onSaved={setSalon} /></TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Portfolio ---------------- */
function PortfolioTab({ salonId, uid }: { salonId: string; uid: string }) {
  const styles = useStyles();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [style, setStyle] = useState("");
  const [customStyle, setCustomStyle] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    supabase.from("salon_photos").select("*").eq("salon_id", salonId).order("created_at", { ascending: false })
      .then(({ data }) => setPhotos((data ?? []) as Photo[]));
  useEffect(() => { load(); }, [salonId]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) {
        if (f.size > 8 * 1024 * 1024) { toast.error(`${f.name}: max 8 MB`); continue; }
        const path = `${uid}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
        const up = await supabase.storage.from("salon-media").upload(path, f);
        if (up.error) throw up.error;
        const signed = await supabase.storage.from("salon-media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signed.error) throw signed.error;
        const { error } = await supabase.from("salon_photos").insert({
          salon_id: salonId, url: signed.data.signedUrl,
          style_slug: style === "__custom" ? null : style || null,
          custom_style: style === "__custom" ? customStyle.trim() : "",
          caption,
        });
        if (error) throw error;
      }
      toast.success("Dodano zdjęcia");
      setCaption("");
      setCustomStyle("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd wgrywania");
    } finally { setBusy(false); }
  };

  const remove = async (id: string) => {
    await supabase.from("salon_photos").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-8 mt-6">
      <div className="p-6 border border-border bg-card grid md:grid-cols-[1fr,1fr,auto] gap-4 items-end">
        <div>
          <Label>Stylizacja</Label>
          <select value={style} onChange={(e) => setStyle(e.target.value)}
            className="mt-2 w-full h-10 bg-background border border-input px-3 text-sm">
            <option value="">— bez kategorii —</option>
            {styles.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
            <option value="__custom">✎ Własna stylizacja…</option>
          </select>
          {style === "__custom" && (
            <Input className="mt-2" placeholder="np. Kim K, Manga, Wispy Hybrid"
              value={customStyle} onChange={(e) => setCustomStyle(e.target.value)} maxLength={60} />
          )}
        </div>
        <div>
          <Label>Opis (opcjonalnie)</Label>
          <Input className="mt-2" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={200} />
        </div>
        <Button asChild disabled={busy || (style === "__custom" && !customStyle.trim())}>
          <label className="cursor-pointer">
            {busy ? <Loader2 className="animate-spin" /> : <Upload />} Wgraj zdjęcia
            <input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
          </label>
        </Button>
      </div>
      {photos.length === 0 ? (
        <p className="text-muted-foreground">Brak zdjęć w portfolio. Dodaj swoje prace powyżej.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((p) => (
            <div key={p.id} className="relative group aspect-square border border-border overflow-hidden">
              <img src={p.url} alt={p.caption || "Zdjęcie z portfolio"} className="w-full h-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 p-2 bg-background/80 text-xs">
                <span className="text-primary">
                  {p.custom_style || styles.find((s) => s.slug === p.style_slug)?.name || "—"}
                </span>
                {p.caption && <span className="text-muted-foreground"> · {p.caption}</span>}
              </div>
              <Button size="icon" variant="destructive" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                onClick={() => remove(p.id)} aria-label="Usuń zdjęcie"><Trash2 /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- Team ---------------- */
function TeamTab({ salonId, uid }: { salonId: string; uid: string }) {
  const [list, setList] = useState<Employee[]>([]);
  const [form, setForm] = useState({ name: "", role: "Stylistka rzęs", phone: "", color: "#d4af37" });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const load = () =>
    supabase.from("salon_employees").select("*").eq("salon_id", salonId).order("created_at")
      .then(({ data }) => setList((data ?? []) as Employee[]));
  useEffect(() => { load(); }, [salonId]);

  const add = async () => {
    if (!form.name.trim()) return toast.error("Podaj imię");
    setBusy(true);
    try {
      let avatar_url: string | null = null;
      if (avatar) {
        if (avatar.size > 8 * 1024 * 1024) throw new Error("Zdjęcie: max 8 MB");
        const path = `${uid}/${crypto.randomUUID()}-${avatar.name.replace(/[^\w.-]/g, "_")}`;
        const up = await supabase.storage.from("salon-media").upload(path, avatar);
        if (up.error) throw up.error;
        const signed = await supabase.storage.from("salon-media").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
        if (signed.error) throw signed.error;
        avatar_url = signed.data.signedUrl;
      }
      const { error } = await supabase.from("salon_employees").insert({ ...form, salon_id: salonId, avatar_url });
      if (error) throw error;
      setForm({ name: "", role: "Stylistka rzęs", phone: "", color: "#d4af37" });
      setAvatar(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Błąd zapisu");
    } finally { setBusy(false); }
  };
  const remove = async (id: string) => { await supabase.from("salon_employees").delete().eq("id", id); load(); };

  return (
    <div className="space-y-8 mt-6">
      <div className="p-6 border border-border bg-card grid md:grid-cols-[1fr,1fr,1fr,auto,80px,auto] gap-4 items-end">
        <div><Label>Imię i nazwisko</Label><Input className="mt-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Stanowisko</Label><Input className="mt-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} /></div>
        <div><Label>Telefon</Label><Input className="mt-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div>
          <Label>Zdjęcie</Label>
          <Button asChild variant="outline" className="mt-2 w-full">
            <label className="cursor-pointer">
              <Upload /> {avatar ? avatar.name.slice(0, 12) : "Wybierz"}
              <input type="file" accept="image/*" hidden onChange={(e) => setAvatar(e.target.files?.[0] ?? null)} />
            </label>
          </Button>
        </div>
        <div><Label>Kolor</Label><Input type="color" className="mt-2 p-1" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
        <Button onClick={add} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Plus />} Dodaj</Button>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {list.map((e) => (
          <div key={e.id} className="p-5 border border-border bg-card flex items-center gap-4">
            {e.avatar_url ? (
              <img src={e.avatar_url} alt={e.name} className="w-12 h-12 rounded-full object-cover shrink-0 border-2" style={{ borderColor: e.color }} />
            ) : (
              <span className="w-10 h-10 rounded-full shrink-0" style={{ background: e.color }} />
            )}
            <div className="flex-1">
              <div className="font-display text-xl">{e.name}</div>
              <div className="text-xs text-muted-foreground">{e.role}{e.phone && ` · ${e.phone}`}</div>
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(e.id)} aria-label="Usuń pracownika"><Trash2 /></Button>
          </div>
        ))}
        {list.length === 0 && <p className="text-muted-foreground">Nie dodano jeszcze pracowników.</p>}
      </div>
    </div>
  );
}

/* ---------------- Services ---------------- */
function ServicesTab({ salonId }: { salonId: string }) {
  const [list, setList] = useState<Service[]>([]);
  const [form, setForm] = useState({ name: "", description: "", price: "", duration_min: 60 });
  const load = () =>
    supabase.from("salon_services").select("*").eq("salon_id", salonId).order("created_at")
      .then(({ data }) => setList((data ?? []) as Service[]));
  useEffect(() => { load(); }, [salonId]);

  const add = async () => {
    if (!form.name.trim()) return toast.error("Podaj nazwę usługi");
    const { error } = await supabase.from("salon_services").insert({ ...form, salon_id: salonId });
    if (error) return toast.error(error.message);
    setForm({ name: "", description: "", price: "", duration_min: 60 });
    load();
  };
  const remove = async (id: string) => { await supabase.from("salon_services").delete().eq("id", id); load(); };

  return (
    <div className="space-y-8 mt-6">
      <div className="p-6 border border-border bg-card grid gap-4">
        <div className="grid md:grid-cols-[2fr,1fr,1fr] gap-4">
          <div><Label>Nazwa usługi</Label><Input className="mt-2" placeholder="np. Volume 4D – uzupełnienie" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Cena</Label><Input className="mt-2" placeholder="np. 220 zł" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div><Label>Czas (min)</Label><Input className="mt-2" type="number" min={15} step={15} value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })} /></div>
        </div>
        <div><Label>Opis</Label><Textarea className="mt-2" placeholder="Krótki opis usługi, używane materiały, efekt…" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={500} /></div>
        <Button onClick={add} className="w-fit"><Plus /> Dodaj usługę</Button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {list.map((s) => (
          <div key={s.id} className="p-5 border border-border bg-card flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-display text-xl">{s.name}</div>
                <div className="text-gold font-display text-lg whitespace-nowrap">{s.price}</div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">{s.duration_min} min</div>
              {s.description && <p className="text-sm text-muted-foreground">{s.description}</p>}
            </div>
            <Button size="icon" variant="ghost" onClick={() => remove(s.id)} aria-label="Usuń usługę"><Trash2 /></Button>
          </div>
        ))}
        {list.length === 0 && <p className="text-muted-foreground">Nie dodano jeszcze usług.</p>}
      </div>
    </div>
  );
}

/* ---------------- Calendar ---------------- */
function CalendarTab({ salonId }: { salonId: string }) {
  const isMobile = useIsMobile();
  const dayCount = isMobile ? 3 : 7;
  const [week, setWeek] = useState(() => startOfWeek(new Date()));
  const [appts, setAppts] = useState<Appt[]>([]);
  const [team, setTeam] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [filter, setFilter] = useState("all");
  const [edit, setEdit] = useState<Partial<Appt> & { local?: string } | null>(null);

  const weekEnd = useMemo(() => { const d = new Date(week); d.setDate(d.getDate() + dayCount); return d; }, [week, dayCount]);
  const load = () =>
    supabase.from("appointments").select("*").eq("salon_id", salonId)
      .gte("starts_at", week.toISOString()).lt("starts_at", weekEnd.toISOString()).order("starts_at")
      .then(({ data }) => setAppts((data ?? []) as Appt[]));
  useEffect(() => { load(); }, [salonId, week, dayCount]);
  useEffect(() => {
    supabase.from("salon_employees").select("*").eq("salon_id", salonId).then(({ data }) => setTeam((data ?? []) as Employee[]));
    supabase.from("salon_services").select("*").eq("salon_id", salonId).order("name").then(({ data }) => setServices((data ?? []) as Service[]));
  }, [salonId]);

  const days = Array.from({ length: dayCount }, (_, i) => { const d = new Date(week); d.setDate(d.getDate() + i); return d; });
  const visible = appts.filter((a) => filter === "all" || a.employee_id === filter);
  const colorOf = (id: string | null) => team.find((t) => t.id === id)?.color ?? "hsl(var(--primary))";

  const openNew = (day: Date, hour: number) => {
    const d = new Date(day); d.setHours(hour, 0, 0, 0);
    setEdit({ local: toLocalInput(d), duration_min: 120, client_name: "", client_phone: "", service: "", notes: "",
      employee_id: filter !== "all" ? filter : team[0]?.id ?? null });
  };

  const save = async () => {
    if (!edit?.client_name?.trim() || !edit.local) return toast.error("Podaj klientkę i termin");
    const payload = {
      salon_id: salonId, employee_id: edit.employee_id || null, client_name: edit.client_name.trim(),
      client_phone: edit.client_phone ?? "", service: edit.service ?? "", notes: edit.notes ?? "",
      duration_min: Number(edit.duration_min) || 60, starts_at: new Date(edit.local).toISOString(),
    };
    const { error } = edit.id
      ? await supabase.from("appointments").update(payload).eq("id", edit.id)
      : await supabase.from("appointments").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Zapisano wizytę");
    setEdit(null); load();
  };
  const remove = async () => {
    if (!edit?.id) return;
    await supabase.from("appointments").delete().eq("id", edit.id);
    setEdit(null); load();
  };

  const ROW = isMobile ? 44 : 56; // px per hour
  const shift = (n: number) => setWeek(new Date(week.getTime() + n * dayCount * 864e5));
  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <Button variant="outline" size="icon" onClick={() => shift(-1)} aria-label="Wstecz"><ChevronLeft /></Button>
        <Button variant="outline" onClick={() => setWeek(isMobile ? new Date() : startOfWeek(new Date()))}>Dziś</Button>
        <Button variant="outline" size="icon" onClick={() => shift(1)} aria-label="Dalej"><ChevronRight /></Button>
        <span className="font-display text-lg sm:text-xl ml-1">
          {days[0].toLocaleDateString("pl-PL", { day: "numeric", month: "short" })} – {days[dayCount - 1].toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" })}
        </span>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="ml-auto h-10 bg-background border border-input px-3 text-sm max-w-[45vw]">
          <option value="all">Wszyscy pracownicy</option>
          {team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      <div className="border border-border bg-card overflow-x-auto touch-pan-x">
        <div className="grid" style={{ gridTemplateColumns: `44px repeat(${dayCount}, minmax(${isMobile ? 96 : 110}px, 1fr))` }}>
          <div />
          {days.map((d, i) => {
            const today = d.toDateString() === new Date().toDateString();
            return (
              <div key={i} className={`p-1 sm:p-2 text-center border-l border-b border-border ${today ? "text-primary" : ""}`}>
                <div className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{DAYS[(d.getDay() + 6) % 7]}</div>
                <div className="font-display text-lg sm:text-xl">{d.getDate()}</div>
              </div>
            );
          })}
          <div>
            {HOURS.map((h) => <div key={h} style={{ height: ROW }} className="text-[10px] text-muted-foreground text-right pr-1 sm:pr-2 pt-1">{h}:00</div>)}
          </div>
          {days.map((d, i) => (
            <div key={i} className="relative border-l border-border">
              {HOURS.map((h) => (
                <button key={h} style={{ height: ROW }} onClick={() => openNew(d, h)}
                  className="block w-full border-b border-border/50 hover:bg-primary/5 active:bg-primary/10 transition-colors" aria-label={`Dodaj wizytę ${DAYS[(d.getDay() + 6) % 7]} ${h}:00`} />
              ))}
              {visible.filter((a) => new Date(a.starts_at).toDateString() === d.toDateString()).map((a) => {
                const s = new Date(a.starts_at);
                const top = (s.getHours() + s.getMinutes() / 60 - HOURS[0]) * ROW;
                return (
                  <button key={a.id} onClick={() => setEdit({ ...a, local: toLocalInput(s) })}
                    className="absolute left-1 right-1 p-1.5 text-left text-[11px] overflow-hidden bg-background/90 border-l-4 shadow-deep"
                    style={{ top, height: Math.max(24, (a.duration_min / 60) * ROW - 2), borderColor: colorOf(a.employee_id) }}>
                    <div className="font-medium">{pad(s.getHours())}:{pad(s.getMinutes())} {a.client_name}</div>
                    <div className="text-muted-foreground truncate">{a.service}</div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Edytuj wizytę" : "Nowa wizyta"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid gap-3">
              <div><Label>Klientka</Label><Input value={edit.client_name ?? ""} onChange={(e) => setEdit({ ...edit, client_name: e.target.value })} /></div>
              <div><Label>Telefon</Label><Input value={edit.client_phone ?? ""} onChange={(e) => setEdit({ ...edit, client_phone: e.target.value })} /></div>
              <div><Label>Usługa</Label><Input placeholder="np. Volume 4D – uzupełnienie" value={edit.service ?? ""} onChange={(e) => setEdit({ ...edit, service: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Termin</Label><Input type="datetime-local" value={edit.local ?? ""} onChange={(e) => setEdit({ ...edit, local: e.target.value })} /></div>
                <div><Label>Czas (min)</Label><Input type="number" min={15} step={15} value={edit.duration_min ?? 60} onChange={(e) => setEdit({ ...edit, duration_min: Number(e.target.value) })} /></div>
              </div>
              <div>
                <Label>Pracownik</Label>
                <select value={edit.employee_id ?? ""} onChange={(e) => setEdit({ ...edit, employee_id: e.target.value || null })}
                  className="w-full h-10 bg-background border border-input px-3 text-sm">
                  <option value="">— nieprzypisana —</option>
                  {team.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div><Label>Notatki</Label><Textarea value={edit.notes ?? ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></div>
              <div className="flex gap-2 justify-end">
                {edit.id && <Button variant="destructive" onClick={remove}><Trash2 /> Usuń</Button>}
                <Button onClick={save}>Zapisz</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------------- Profile ---------------- */
function ProfileTab({ salon, onSaved }: { salon: Salon; onSaved: (s: Salon) => void }) {
  const [f, setF] = useState(salon);
  const save = async () => {
    const { error } = await supabase.from("salons").update({ city: f.city, stylist: f.stylist, price: f.price }).eq("id", salon.id);
    if (error) return toast.error(error.message);
    onSaved(f); toast.success("Zapisano profil");
  };
  return (
    <div className="mt-6 max-w-lg grid gap-4 p-6 border border-border bg-card">
      <div><Label>Miasto</Label><Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} /></div>
      <div><Label>Główna stylistka</Label><Input value={f.stylist} onChange={(e) => setF({ ...f, stylist: e.target.value })} /></div>
      <div><Label>Cennik (np. od 180 zł)</Label><Input value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} /></div>
      <Button onClick={save}>Zapisz</Button>
    </div>
  );
}
