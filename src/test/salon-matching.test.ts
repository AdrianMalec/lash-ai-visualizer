import { describe, it, expect } from "vitest";
import { eligibleSalons, portfolioPath, rankMatches, type PortfolioCandidate, type RealSalon } from "../../supabase/functions/match-salons/matching";

const salons: RealSalon[] = [
  { id: "a", name: "Real A", city: "", stylist: "", price: "", owner_id: "owner-a" },
  { id: "b", name: "Real B", city: "", stylist: "", price: "", owner_id: "owner-b" },
];
const photos: PortfolioCandidate[] = [
  { id: "p1", salon_id: "a", url: "actual-photo-1", caption: "", style_slug: "classic", custom_style: "" },
  { id: "p2", salon_id: "b", url: "actual-photo-2", caption: "", style_slug: null, custom_style: "Własna stylizacja" },
];
describe("real portfolio matching", () => {
  it("does not invent results without real portfolio photos", () => {
    expect(rankMatches(salons, [], [{ photo_id: "fake", score: 99, reason: "", visible_lashes: true }])).toEqual([]);
  });
  it("ranks actual photographed work by image similarity including custom styles", () => {
    const result = rankMatches(salons, photos, [
      { photo_id: "p1", score: 76, reason: "", visible_lashes: true },
      { photo_id: "p2", score: 95, reason: "Podobny skręt", visible_lashes: true },
    ]);
    expect(result.map(s => s.id)).toEqual(["b", "a"]);
    expect(result[0].photos[0].url).toBe("actual-photo-2");
    expect(result[0].match).toBe(95);
  });
  it("excludes simulated salons and unapproved salon accounts", () => {
    expect(eligibleSalons([...salons, { ...salons[0], id: "demo", owner_id: null }], [
      { id: "owner-a", status: "approved", account_type: "salon" },
      { id: "owner-b", status: "pending", account_type: "salon" },
    ]).map(s => s.id)).toEqual(["a"]);
  });
  it("never matches unreadable lashes or insufficient visual similarity", () => {
    expect(rankMatches(salons, photos, [
      { photo_id: "p1", score: 99, reason: "", visible_lashes: false },
      { photo_id: "p2", score: 69, reason: "", visible_lashes: true },
    ])).toEqual([]);
  });
  it("only signs actual same-backend portfolio paths belonging to the salon owner", () => {
    expect(portfolioPath("https://backend.test/storage/v1/object/sign/salon-media/owner-a/photo.jpg?token=old", "https://backend.test", "owner-a")).toBe("owner-a/photo.jpg");
    expect(portfolioPath("https://external.test/photo.jpg", "https://backend.test", "owner-a")).toBeNull();
    expect(portfolioPath("https://backend.test/storage/v1/object/sign/salon-media/other/photo.jpg", "https://backend.test", "owner-a")).toBeNull();
  });
});