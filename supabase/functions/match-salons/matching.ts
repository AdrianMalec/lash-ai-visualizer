export type PortfolioCandidate = {
  id: string;
  salon_id: string;
  url: string;
  caption: string;
  style_slug: string | null;
  custom_style: string;
};

export type PhotoScore = { photo_id: string; score: number; reason: string; visible_lashes: boolean };
export type RealSalon = { id: string; name: string; stylist: string; city: string; price: string; owner_id: string | null };
export type OwnerProfile = { id: string; status: string; account_type: string };
export type MatchedPhoto = PortfolioCandidate & { score: number; reason: string };
export type SalonMatch = RealSalon & { match: number; reason: string; photos: MatchedPhoto[] };

export function eligibleSalons(salons: RealSalon[], profiles: OwnerProfile[]) {
  const approved = new Set(profiles.filter(p => p.status === "approved" && p.account_type === "salon").map(p => p.id));
  return salons.filter(s => s.owner_id !== null && approved.has(s.owner_id));
}

// Only actual photographed work can be evidence. Ratings and legacy portfolio scores are never inputs.
export function rankMatches(salons: RealSalon[], photos: PortfolioCandidate[], scores: PhotoScore[]): SalonMatch[] {
  const byPhoto = new Map<string, PhotoScore>();
  for (const score of scores) {
    if (score.visible_lashes && Number.isFinite(score.score) && score.score >= 70 && score.score <= 100) {
      byPhoto.set(score.photo_id, score);
    }
  }
  return salons.flatMap(salon => {
    const evidence = photos.filter(p => p.salon_id === salon.id && byPhoto.has(p.id)).map(p => {
      const score = byPhoto.get(p.id);
      return { ...p, score: score?.score ?? 0, reason: score?.reason ?? "" };
    }).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
    const best = evidence[0];
    return best ? [{ ...salon, match: best.score, reason: best.reason, photos: evidence }] : [];
  }).sort((a, b) => b.match - a.match || a.id.localeCompare(b.id)).slice(0, 3);
}

export function portfolioPath(url: string, baseUrl: string, ownerId: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.origin !== new URL(baseUrl).origin) return null;
    const prefix = /^\/storage\/v1\/object\/(?:sign|public|authenticated)\/salon-media\//;
    if (!prefix.test(parsed.pathname)) return null;
    const path = decodeURIComponent(parsed.pathname.replace(prefix, ""));
    if (!path.startsWith(`${ownerId}/`) || path.split("/").some(p => p === "." || p === "..")) return null;
    return path;
  } catch { return null; }
}