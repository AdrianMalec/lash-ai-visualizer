export const bookingDate = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
export const bookingTime = (value: string) => new Date(value).toLocaleTimeString('pl-PL', { timeZone: 'Europe/Warsaw', hour: '2-digit', minute: '2-digit' });
export const bookingDay = (value: string) => new Date(value).toLocaleDateString('pl-PL', { timeZone: 'Europe/Warsaw', weekday: 'long', day: 'numeric', month: 'long' });
export const validContact = (name: string, phone: string) => name.trim().length >= 2 && name.length <= 100 && phone.length <= 30 && /^\d{9,15}$/.test(phone.replace(/\D/g, ''));
export const canManageBooking = (status: string, startsAt: string, now = Date.now()) => status === 'confirmed' && new Date(startsAt).getTime() > now;
export type BookingSalon = { id: string; name: string; city: string; image_url: string | null; stylist: string };
export type ClientAppointment = { id: string; salon_id: string; salon_name: string; city: string; employee_id: string | null; employee_name: string | null; service_id: string | null; service: string; starts_at: string; duration_min: number; price: string; status: string; client_name: string; client_phone: string };
