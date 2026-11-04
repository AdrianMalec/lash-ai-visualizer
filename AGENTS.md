# Architecture
- Real salon matching runs in the authenticated `match-salons` edge function and compares actual approved-salon portfolio photographs with the approved visualization; legacy numeric portfolio ratings must not participate in ranking.
- Matching domain rules live beside the edge function and are shared with frontend types and focused tests to prevent simulated or ineligible results.
- Visualization images remain transient in browser memory and are not persisted by the matching flow, to avoid retaining client selfies unnecessarily.