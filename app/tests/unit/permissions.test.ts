import { describe, it, expect } from "vitest";
import {
  isMember,
  isChurchAdmin,
  isSuperAdmin,
  isAdmin,
} from "@/lib/authorization/permissions";

// Stage 20 section 33 names permissions.test.ts as one of the three
// most-important unit suites. In M1 the role predicates are the whole of
// the authorization surface; these lock in the "MEMBER cannot enter admin"
// rule from Stage 21 sections 8 and 14.

describe("role predicates", () => {
  it("isMember is true only for MEMBER", () => {
    expect(isMember("MEMBER")).toBe(true);
    expect(isMember("CHURCH_ADMIN")).toBe(false);
    expect(isMember("SUPER_ADMIN")).toBe(false);
    expect(isMember(null)).toBe(false);
  });

  it("isChurchAdmin is true only for CHURCH_ADMIN", () => {
    expect(isChurchAdmin("CHURCH_ADMIN")).toBe(true);
    expect(isChurchAdmin("MEMBER")).toBe(false);
    expect(isChurchAdmin("SUPER_ADMIN")).toBe(false);
    expect(isChurchAdmin(null)).toBe(false);
  });

  it("isSuperAdmin is true only for SUPER_ADMIN", () => {
    expect(isSuperAdmin("SUPER_ADMIN")).toBe(true);
    expect(isSuperAdmin("MEMBER")).toBe(false);
    expect(isSuperAdmin("CHURCH_ADMIN")).toBe(false);
    expect(isSuperAdmin(null)).toBe(false);
  });

  it("isAdmin covers both admin roles and nothing else", () => {
    expect(isAdmin("CHURCH_ADMIN")).toBe(true);
    expect(isAdmin("SUPER_ADMIN")).toBe(true);
    expect(isAdmin("MEMBER")).toBe(false);
    expect(isAdmin(null)).toBe(false);
  });
});
