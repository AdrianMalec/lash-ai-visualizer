# Architecture
- Real salon matching runs in the authenticated `match-salons` edge function and compares actual approved-salon portfolio photographs with the approved visualization; legacy numeric portfolio ratings must not participate in ranking.
- Matching domain rules live beside the edge function and are shared with frontend types and focused tests to prevent simulated or ineligible results.
- Visualization images remain transient in browser memory and are not persisted by the matching flow, to avoid retaining client selfies unnecessarily.
- Client bookings use security-definer RPCs with explicit authentication and ownership checks; availability exposes only free slots, not other clients' details.
- Booking slots follow salon-configured hours in Europe/Warsaw; a shared transaction lock and appointment validation trigger prevent conflicts for both client and salon writes.
- Online bookings and manual salon appointments share the appointments table; cancellation preserves history and prices are snapshotted at confirmation.