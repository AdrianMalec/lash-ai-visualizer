import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];
const time = (n: number) => `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
const minutes = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
export function BookingHours({ salonId }: { salonId: string }) {
 const [rows, setRows] = useState(Array.from({ length: 7 }, (_, weekday) => ({ salon_id: salonId, weekday, opens_min: 480, closes_min: 1200, enabled: false })));
 const [loading, setLoading] = useState(true); const [busy, setBusy] = useState(false);
 useEffect(() => { supabase.from('salon_booking_hours').select('*').eq('salon_id', salonId).then(({ data, error }) => { if (error) toast.error(error.message); else setRows(prev => prev.map(r => data?.find(x => x.weekday === r.weekday) ?? r)); setLoading(false); }); }, [salonId]);
 const save = async () => { if (rows.some(r => !Number.isFinite(r.opens_min) || !Number.isFinite(r.closes_min) || r.opens_min >= r.closes_min)) return toast.error('Godzina zamknięcia musi być późniejsza niż otwarcia'); setBusy(true); const { error } = await supabase.from('salon_booking_hours').upsert(rows); setBusy(false); if (error) toast.error(error.message); else toast.success('Zapisano godziny rezerwacji'); };
 const change = (weekday: number, patch: Partial<typeof rows[number]>) => setRows(rows.map(r => r.weekday === weekday ? { ...r, ...patch } : r));
 return <div className="max-w-xl py-6 space-y-5"><h2 className="font-display text-3xl">Godziny rezerwacji online</h2>{loading ? <Loader2 className="animate-spin" /> : <>{[1,2,3,4,5,6,0].map(d => { const r = rows[d]; return <div key={d} className="grid grid-cols-[1fr,auto] sm:grid-cols-[1fr,auto,auto] gap-3 items-center border-b border-border pb-4"><label className="flex items-center gap-3 text-sm"><Switch checked={r.enabled} onCheckedChange={enabled => change(d, { enabled })} aria-label={days[d]} />{days[d]}</label><div className="flex gap-2 col-span-2 sm:col-span-1"><Input aria-label={`${days[d]} otwarcie`} type="time" step={900} disabled={!r.enabled} value={time(r.opens_min)} onChange={e => change(d, { opens_min: minutes(e.target.value) })} /><Input aria-label={`${days[d]} zamknięcie`} type="time" step={900} disabled={!r.enabled} value={time(r.closes_min)} onChange={e => change(d, { closes_min: minutes(e.target.value) })} /></div></div>; })}<Button disabled={busy} onClick={save}>{busy ? <Loader2 className="animate-spin" /> : <Save />} Zapisz godziny</Button></>}</div>;
}
