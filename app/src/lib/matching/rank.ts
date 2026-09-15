// Stage 28 (M6) -- pure ranking. Unit-tested. No I/O.
//
// Sort order (Decision 10, exact):
//   1. matchScore DESC
//   2. lastName ASC
//   3. id ASC -- a pure determinism guarantee, NOT a ranking signal. It
//      exists only so two runs of the same query return the same order
//      when score AND last name are both identical. Never described or
//      displayed as meaning anything about candidate quality.
//
// No other secondary sort (experience, verification date, registration
// date) is used anywhere in this ordering.

export interface Rankable {
  id: string;
  lastName: string;
  matchScore: number;
}

/** Returns a NEW array, sorted descending by matchScore, then ascending by
 *  lastName, then ascending by id. Does not mutate the input. Deterministic:
 *  the same input array always produces the same output order. */
export function rankCandidates<T extends Rankable>(candidates: readonly T[]): T[] {
  return [...candidates].sort((a, b) => {
    if (a.matchScore !== b.matchScore) return b.matchScore - a.matchScore;
    const lastNameCompare = a.lastName.localeCompare(b.lastName);
    if (lastNameCompare !== 0) return lastNameCompare;
    return a.id.localeCompare(b.id);
  });
}
