export type { SalonMatch, MatchedPhoto } from "../../supabase/functions/match-salons/matching";

export type ApprovedVisualization = { style: string; image: string };

export function clearSalonMatches() {
  window.dispatchEvent(new Event("lash:reset"));
}

// Keep selfies transient: never persist visualization events in browser storage.
export function approveVisualization(detail: ApprovedVisualization) {
  window.dispatchEvent(new CustomEvent<ApprovedVisualization>("lash:approved", { detail }));
}