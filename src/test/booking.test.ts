import { describe, expect, it } from 'vitest';
import { bookingDate, bookingTime, canManageBooking, validContact } from '@/lib/booking';
describe('client booking', () => {
 it('requires a name and valid contact number', () => { expect(validContact('Anna Kowalska', '+48 500 600 700')).toBe(true); expect(validContact('A', '500600700')).toBe(false); expect(validContact('Anna', '123')).toBe(false); });
 it('allows management only for future confirmed visits', () => { const now = Date.parse('2026-11-06T12:00:00Z'); expect(canManageBooking('confirmed', '2026-11-07T12:00:00Z', now)).toBe(true); expect(canManageBooking('cancelled', '2026-11-07T12:00:00Z', now)).toBe(false); expect(canManageBooking('confirmed', '2026-11-05T12:00:00Z', now)).toBe(false); });
 it('uses Warsaw time even across UTC midnight and summer time', () => { expect(bookingDate(new Date('2026-11-06T23:30:00Z'))).toBe('2026-11-07'); expect(bookingTime('2026-07-01T10:00:00Z')).toBe('12:00'); expect(bookingTime('2026-11-06T10:00:00Z')).toBe('11:00'); });
});
