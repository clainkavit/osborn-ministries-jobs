import { test, expect, type Page } from "@playwright/test";
import { ROSTER, type RosterMember } from "./roster";

// ============================================================================
// M10 demo/QA application seeding driver -- Champion's approved approach
// (2026-09-13). NOT part of the M1-M9 regression suite: lives outside
// tests/e2e/, invoked via the dedicated seed config:
//
//   npx playwright test --config=scripts/seed/playwright.seed.config.ts --grep "app-seed"
//
// Design note: applying is a member-side action (Apply flow, Stage 29),
// and this app never exposes a member's email to the admin until AFTER
// they're shortlisted (Stage 8's contact-visibility gate -- correctly
// frozen, not worked around here). seed-members.spec.ts's already-created
// 49 roster members used one-off, unrecoverable random emails, so this
// script cannot log in as any of them after the fact. Rather than bypass
// the contact gate or re-run the full 49-member batch, this script
// registers 9 SPECIFIC named roster members fresh (same real names,
// same real profile data, a second real account each -- realistic, since
// a name is not unique in reality) and drives each through onboarding,
// verification, and the application flow in one continuous run. This adds
// 9 extra real accounts to the ~50 already seeded; it does not modify or
// duplicate the original 49's own application-less state.
//
// No new capability: identical mechanics to seed-members.spec.ts and to
// M7/M8/M9's own established E2E helpers (register -> onboard -> submit,
// admin approves, member applies, admin drives the status transition).
//
// PREREQUISITES: supabase/seed/02_opportunities.sql has been run (the
// founding-case + extra opportunities exist), M3_ADMIN_EMAIL/
// M3_ADMIN_PASSWORD set, app running.
// ============================================================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const HAS_SUPABASE = !!SUPABASE_URL && SUPABASE_URL !== "REPLACE_ME";
const ADMIN_EMAIL = process.env.M3_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.M3_ADMIN_PASSWORD;
const PASSWORD = "correcthorse9";

test.skip(!HAS_SUPABASE, "Supabase not connected -- see .env.local");
test.skip(
  !ADMIN_EMAIL || !ADMIN_PASSWORD,
  "Set M3_ADMIN_EMAIL / M3_ADMIN_PASSWORD to a CHURCH_ADMIN account",
);

function findRoster(lastName: string): RosterMember {
  const m = ROSTER.find((r) => r.lastName === lastName);
  if (!m) throw new Error(`No roster member with last name "${lastName}"`);
  return m;
}

function candidateFor(m: RosterMember, tag: string) {
  const stamp = Date.now() + Math.floor(Math.random() * 1000);
  return {
    email: `m10app-${tag}-${stamp}@m3test.com`,
    firstName: m.firstName,
    lastName: m.lastName,
  };
}

async function register(
  page: Page,
  c: { email: string; firstName: string; lastName: string },
) {
  await page.goto("/register");
  await page.getByLabel("First name").fill(c.firstName);
  await page.getByLabel("Last name").fill(c.lastName);
  await page.getByLabel("Email or phone").fill(c.email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByLabel("Confirm password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
}

async function loginMember(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email or phone").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}

async function loginAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL!);
  await page.getByLabel("Password", { exact: true }).fill(ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/admin/dashboard");
}

async function completeOnboarding(page: Page, m: RosterMember) {
  await expect(page.getByRole("heading", { name: "About you" })).toBeVisible();
  await page.getByLabel("Location").fill(m.location);
  await page.getByRole("button", { name: "Next" }).click();

  await expect(
    page.getByRole("heading", { name: "What do you do?" }),
  ).toBeVisible();
  await page.getByLabel("Primary profession").fill(m.profession);
  await page.getByLabel("Industry").fill(m.industry);
  await page.getByRole("button", { name: "Next" }).click();

  await expect(
    page.getByRole("heading", { name: "Your experience" }),
  ).toBeVisible();
  await page.getByLabel("Employment status").selectOption(m.employmentStatus);
  await page.getByLabel("Years of experience").fill(m.yearsOfExperience);
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Education" })).toBeVisible();
  await page.getByLabel("Institution").fill(m.institution);
  await page.getByLabel("Qualification").fill(m.qualification);
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText(m.qualification)).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
  for (const skill of m.skills) {
    await page.getByPlaceholder("Type a skill and press Add").fill(skill);
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(
      page.getByRole("button", { name: `Remove ${skill}`, exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Your CV" })).toBeVisible();
  await page.setInputFiles('input[type="file"]', {
    name: `${m.firstName.replace(/\s+/g, "")}-${m.lastName}-cv.pdf`,
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 minimal demo cv"),
  });
  await expect(page.getByText(/cv\.pdf|-cv\.pdf/i)).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Availability" })).toBeVisible();
  await page.getByText(m.availabilityLabel, { exact: true }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("Step 8 of 8")).toBeVisible();
  await page.getByRole("button", { name: "Submit for verification" }).click();
  await expect(page).toHaveURL("/dashboard");
}

/** Registers, onboards, and fully verifies (both tracks approved) a fresh
 *  account for the named roster member. Returns the member's email so the
 *  caller can log back in as them to apply. */
async function newFullyVerifiedMember(
  page: Page,
  lastName: string,
  tag: string,
): Promise<{ email: string }> {
  const m = findRoster(lastName);
  const c = candidateFor(m, tag);
  await register(page, c);
  await completeOnboarding(page, m);
  await page.context().clearCookies();

  await loginAdmin(page);
  await page.goto("/admin/verification?tab=ALL");
  // .last(): the queue orders oldest-submitted-first (ascending
  // updated_at). This script deliberately registers a second account for
  // an already-seeded roster name (see file header), so when that name
  // collides with the original from seed-members.spec.ts, the freshly
  // registered one -- the one this function is actually verifying -- is
  // always the most recently submitted, i.e. last in the list.
  await page.getByRole("link", { name: new RegExp(c.lastName) }).last().click();
  await expect(page).toHaveURL(/\/admin\/verification\/[0-9a-f-]{36}/);
  const reviewUrl = page.url();

  await page.getByRole("button", { name: /Approve membership/i }).click();
  try {
    await expect(page.getByText("confirmed")).toBeVisible({ timeout: 20000 });
  } catch {
    await page.goto(reviewUrl);
    await expect(page.getByText("confirmed")).toBeVisible();
  }

  await page.getByRole("button", { name: /Approve credentials/i }).click();
  try {
    await expect(page.getByText("reviewed")).toBeVisible({ timeout: 20000 });
  } catch {
    await page.goto(reviewUrl);
    await expect(page.getByText("reviewed")).toBeVisible();
  }

  await page.context().clearCookies();
  return { email: c.email };
}

async function applyToOpportunity(
  page: Page,
  memberEmail: string,
  opportunityTitle: string,
): Promise<string> {
  await loginMember(page, memberEmail);
  await page.goto(`/opportunities?q=${encodeURIComponent(opportunityTitle)}`);
  await page.getByText(opportunityTitle, { exact: true }).first().click();
  await expect(page).toHaveURL(/\/opportunities\/[0-9a-f-]{36}/);
  const opportunityId = page.url().split("/").pop()!;
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByText(/view status/i)).toBeVisible();
  await page.context().clearCookies();
  return opportunityId;
}

async function findApplicationId(
  page: Page,
  opportunityId: string,
  lastName: string,
): Promise<string> {
  await page.goto(`/admin/opportunities/${opportunityId}/applications`);
  const row = page.getByRole("link", { name: new RegExp(lastName) }).first();
  await expect(row).toBeVisible();
  const href = await row.getAttribute("href");
  return href!.split("/").pop()!;
}

test.describe.configure({ mode: "serial" });

test("app-seed 1 -- Nuru Kaijage applies to Driver (stays APPLIED)", async ({
  page,
}) => {
  const { email } = await newFullyVerifiedMember(page, "Kaijage", "as1");
  await applyToOpportunity(page, email, "Driver");
});

test("app-seed 2 -- Elias Mabula applies to Driver, admin marks Reviewed", async ({
  page,
}) => {
  const { email } = await newFullyVerifiedMember(page, "Mabula", "as2");
  const opportunityId = await applyToOpportunity(page, email, "Driver");

  await loginAdmin(page);
  const applicationId = await findApplicationId(page, opportunityId, "Mabula");
  await page.goto(`/admin/applications/${applicationId}`);
  await page.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(page.getByText("Reviewed", { exact: true })).toBeVisible();
  await page.context().clearCookies();
});

test("app-seed 3 -- Hamisi Selemani applies to Driver, admin shortlists", async ({
  page,
}) => {
  const { email } = await newFullyVerifiedMember(page, "Selemani", "as3");
  const opportunityId = await applyToOpportunity(page, email, "Driver");

  await loginAdmin(page);
  const applicationId = await findApplicationId(page, opportunityId, "Selemani");
  await page.goto(`/admin/applications/${applicationId}`);
  await page.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(page.getByText("Reviewed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Shortlist" }).click();
  await expect(page.getByText("Shortlisted", { exact: true })).toBeVisible();
  await page.context().clearCookies();
});

test("app-seed 4 -- Peniel Mwakalinga applies to Driver, admin schedules interview", async ({
  page,
}) => {
  const { email } = await newFullyVerifiedMember(page, "Mwakalinga", "as4");
  const opportunityId = await applyToOpportunity(page, email, "Driver");

  await loginAdmin(page);
  const applicationId = await findApplicationId(page, opportunityId, "Mwakalinga");
  await page.goto(`/admin/applications/${applicationId}`);
  await page.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(page.getByText("Reviewed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Shortlist" }).click();
  await expect(page.getByText("Shortlisted", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Schedule interview" }).click();
  await page.getByLabel("Date").fill("2026-10-06");
  await page.getByLabel("Time").fill("10:00");
  await page.getByLabel("Location").fill("ABC Logistics Ltd, Mwanza");
  await page.getByRole("button", { name: "Confirm interview" }).click();
  await expect(
    page.locator('[data-slot="badge"]').getByText("Interview", { exact: true }),
  ).toBeVisible();
  await page.context().clearCookies();
});

test("app-seed 5 -- Grace Rweyemamu applies to Driver, admin selects her", async ({
  page,
}) => {
  const { email } = await newFullyVerifiedMember(page, "Rweyemamu", "as5");
  const opportunityId = await applyToOpportunity(page, email, "Driver");

  await loginAdmin(page);
  const applicationId = await findApplicationId(page, opportunityId, "Rweyemamu");
  await page.goto(`/admin/applications/${applicationId}`);
  await page.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(page.getByText("Reviewed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Shortlist" }).click();
  await expect(page.getByText("Shortlisted", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Schedule interview" }).click();
  await page.getByLabel("Date").fill("2026-10-03");
  await page.getByLabel("Time").fill("09:00");
  await page.getByLabel("Location").fill("ABC Logistics Ltd, Mwanza");
  await page.getByRole("button", { name: "Confirm interview" }).click();
  await expect(
    page.locator('[data-slot="badge"]').getByText("Interview", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark selected" }).click();
  await expect(page.getByText("Selected", { exact: true })).toBeVisible();
  await page.context().clearCookies();
});

test("app-seed 6 -- Sarah Kessy applies to HR Manager, admin selects her", async ({
  page,
}) => {
  const { email } = await newFullyVerifiedMember(page, "Kessy", "as6");
  const opportunityId = await applyToOpportunity(page, email, "HR Manager");

  await loginAdmin(page);
  const applicationId = await findApplicationId(page, opportunityId, "Kessy");
  await page.goto(`/admin/applications/${applicationId}`);
  await page.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(page.getByText("Reviewed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Shortlist" }).click();
  await expect(page.getByText("Shortlisted", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Schedule interview" }).click();
  await page.getByLabel("Date").fill("2026-10-08");
  await page.getByLabel("Time").fill("14:00");
  await page.getByLabel("Location").fill("ABC Logistics Ltd, Mwanza");
  await page.getByRole("button", { name: "Confirm interview" }).click();
  await expect(
    page.locator('[data-slot="badge"]').getByText("Interview", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark selected" }).click();
  await expect(page.getByText("Selected", { exact: true })).toBeVisible();
  await page.context().clearCookies();
});

test("app-seed 7 -- David Mwakalindile applies to Accountant, admin rejects him", async ({
  page,
}) => {
  const { email } = await newFullyVerifiedMember(page, "Mwakalindile", "as7");
  const opportunityId = await applyToOpportunity(page, email, "Accountant");

  await loginAdmin(page);
  const applicationId = await findApplicationId(page, opportunityId, "Mwakalindile");
  await page.goto(`/admin/applications/${applicationId}`);
  await page.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(page.getByText("Reviewed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Shortlist" }).click();
  await expect(page.getByText("Shortlisted", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Schedule interview" }).click();
  await page.getByLabel("Date").fill("2026-10-05");
  await page.getByLabel("Time").fill("11:00");
  await page.getByLabel("Location").fill("Kilimo Fresh Distributors, Mwanza");
  await page.getByRole("button", { name: "Confirm interview" }).click();
  await expect(
    page.locator('[data-slot="badge"]').getByText("Interview", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark rejected" }).click();
  await expect(page.getByText("Rejected", { exact: true })).toBeVisible();
  await page.context().clearCookies();
});

test("app-seed 8 -- Ombeni Lwenge applies to Secondary School Teacher, admin marks Reviewed", async ({
  page,
}) => {
  const { email } = await newFullyVerifiedMember(page, "Lwenge", "as8");
  const opportunityId = await applyToOpportunity(
    page,
    email,
    "Secondary School Teacher",
  );

  await loginAdmin(page);
  const applicationId = await findApplicationId(page, opportunityId, "Lwenge");
  await page.goto(`/admin/applications/${applicationId}`);
  await page.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(page.getByText("Reviewed", { exact: true })).toBeVisible();
  await page.context().clearCookies();
});

test("app-seed 9 -- Elizabeth Massaka applies to Secondary School Teacher, then withdraws", async ({
  page,
}) => {
  const { email } = await newFullyVerifiedMember(page, "Massaka", "as9");
  await applyToOpportunity(page, email, "Secondary School Teacher");

  await loginMember(page, email);
  await page.goto("/applications");
  await page.getByText("Secondary School Teacher", { exact: true }).click();
  await page.getByRole("button", { name: "Withdraw application" }).click();
  await expect(page.getByText("Withdrawn", { exact: true })).toBeVisible();
  await page.context().clearCookies();
});
