import { describe, it, expect } from "vitest";
import { rankCandidates, type Rankable } from "@/lib/matching/rank";

// Stage 28 (M6) checklist §8/§10 Decision 10 -- score DESC, then lastName
// ASC, then id ASC as a pure determinism guarantee (not a ranking signal).

describe("rankCandidates -- primary sort: matchScore descending", () => {
  it("sorts strictly descending by score", () => {
    const input: Rankable[] = [
      { id: "1", lastName: "A", matchScore: 50 },
      { id: "2", lastName: "B", matchScore: 90 },
      { id: "3", lastName: "C", matchScore: 10 },
    ];
    expect(rankCandidates(input).map((c) => c.id)).toEqual(["2", "1", "3"]);
  });

  it("does not mutate the input array", () => {
    const input: Rankable[] = [
      { id: "1", lastName: "A", matchScore: 10 },
      { id: "2", lastName: "B", matchScore: 90 },
    ];
    const originalOrder = input.map((c) => c.id);
    rankCandidates(input);
    expect(input.map((c) => c.id)).toEqual(originalOrder);
  });
});

describe("rankCandidates -- tie-break: lastName ascending", () => {
  it("breaks a score tie alphabetically by last name", () => {
    const input: Rankable[] = [
      { id: "1", lastName: "Zulu", matchScore: 80 },
      { id: "2", lastName: "Alpha", matchScore: 80 },
      { id: "3", lastName: "Mike", matchScore: 80 },
    ];
    expect(rankCandidates(input).map((c) => c.lastName)).toEqual([
      "Alpha",
      "Mike",
      "Zulu",
    ]);
  });

  it("score still takes priority over last name when they conflict", () => {
    const input: Rankable[] = [
      { id: "1", lastName: "Aaron", matchScore: 40 },
      { id: "2", lastName: "Zeta", matchScore: 90 },
    ];
    expect(rankCandidates(input).map((c) => c.id)).toEqual(["2", "1"]);
  });
});

describe("rankCandidates -- final tiebreaker: id ascending, determinism only", () => {
  it("breaks a tie on BOTH score and last name using id", () => {
    const input: Rankable[] = [
      { id: "b-id", lastName: "Smith", matchScore: 70 },
      { id: "a-id", lastName: "Smith", matchScore: 70 },
    ];
    expect(rankCandidates(input).map((c) => c.id)).toEqual(["a-id", "b-id"]);
  });

  it("is stable across repeated calls with the same input (determinism, not a hidden signal)", () => {
    const input: Rankable[] = [
      { id: "b-id", lastName: "Smith", matchScore: 70 },
      { id: "a-id", lastName: "Smith", matchScore: 70 },
      { id: "c-id", lastName: "Jones", matchScore: 70 },
    ];
    const first = rankCandidates(input).map((c) => c.id);
    const second = rankCandidates(input).map((c) => c.id);
    const third = rankCandidates([...input].reverse()).map((c) => c.id);
    expect(first).toEqual(second);
    expect(first).toEqual(third);
  });
});

describe("rankCandidates -- full three-level ordering", () => {
  it("applies score, then last name, then id in strict priority order", () => {
    const input: Rankable[] = [
      { id: "z", lastName: "Same", matchScore: 50 },
      { id: "a", lastName: "Same", matchScore: 50 },
      { id: "m", lastName: "Aardvark", matchScore: 50 },
      { id: "x", lastName: "Zebra", matchScore: 99 },
    ];
    expect(rankCandidates(input).map((c) => c.id)).toEqual([
      "x", // highest score, alone
      "m", // score 50, lastName Aardvark (alphabetically first)
      "a", // score 50, lastName Same, id "a" < "z"
      "z", // score 50, lastName Same, id "z"
    ]);
  });
});
