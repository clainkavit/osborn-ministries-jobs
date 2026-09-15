import { test, expect, type Page } from "@playwright/test";
import { ROSTER, type RosterMember } from "./roster";

// ============================================================================
// M10 demo/QA member seeding driver -- Champion's approved approach
// (2026-09-13). NOT part of the M1-M9 regression suite: lives outside
// tests/e2e/ (playwright.config.ts's testDir), so it never runs as part of
// `npm run test:e2e` or any milestone's own spec run. Invoked explicitly:
//
//   npx playwright test scripts/seed/seed-members.spec.ts --project=chromium --workers=1
//
// Drives every roster member (scripts/seed/roster.ts) through the REAL
// register -> 8-step onboarding -> submit -> admin-decision flow, using the
// exact same Server Actions and RLS-gated routes a real browser session
// uses -- identical mechanics to tests/e2e/*.spec.ts's own
// newVerifiedMember() helper, just run once deliberately for demo content
// instead of repeatedly for test assertions. No service-role key, no
// direct auth.users manipulation, no new capability.
//
// PREREQUISITES: 00_cleanup_dev_fixtures.sql has been run (clean dev DB),
// migrations 001-006 applied, taxonomy seeded, the one CHURCH_ADMIN account
// exists, M3_ADMIN_EMAIL/M3_ADMIN_PASSWORD set, app running.
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

// --------------------------------------------------------------------------
// Helpers -- same shape as every M1-M9 spec's own helpers, extended only
// where the roster's richer data (multiple skills, real institution/
// qualification per member) needs it.
// --------------------------------------------------------------------------

function candidateFor(m: RosterMember, tag: string) {
  const stamp = Date.now() + Math.floor(Math.random() * 1000);
  return {
    email: `m10-${tag}-${stamp}@m3test.com`,
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
  // Rendered as "Qualification — Institution" in one combined text node
  // (confirmed against the real onboarding UI), not qualification alone.
  await expect(page.getByText(m.qualification)).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
  for (const skill of m.skills) {
    await page.getByPlaceholder("Type a skill and press Add").fill(skill);
    await page.getByRole("button", { name: "Add", exact: true }).click();
    // Each added skill renders as a Badge containing both the skill name
    // text node AND a sibling "Remove {name}" button -- an exact getByText
    // match against the Badge's own combined text content ("Skill×") never
    // matches the bare skill name. The remove button's aria-label is the
    // unambiguous, exact signal that this specific skill was added.
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

/** Applies the roster member's planned VerificationPlan via the real admin
 *  review UI. FULL approves both tracks; MEMBERSHIP_ONLY approves only
 *  Membership; PENDING leaves both untouched (the member simply stays in
 *  the queue); NEEDS_CORRECTION flags Credentials with a realistic note. */
async function applyVerificationPlan(
  page: Page,
  lastName: string,
  plan: RosterMember["verification"],
) {
  if (plan === "PENDING") return; // nothing to do -- stays Pending by default

  await loginAdmin(page);
  await page.goto("/admin/verification?tab=ALL");
  // .first(): a rare mid-run retry (this environment's documented
  // read-after-write lag can time out a "reviewed" check even after the
  // write succeeded, causing Playwright's own retry to re-register the
  // same roster member under a fresh email) can leave two queue rows
  // sharing a last name. Either is a valid, real member -- picking the
  // first is a harmless, deterministic choice, not a data-integrity issue.
  await page
    .getByRole("link", { name: new RegExp(lastName) })
    .first()
    .click();
  await expect(page).toHaveURL(/\/admin\/verification\/[0-9a-f-]{36}/);
  const reviewUrl = page.url();

  // Idempotency guard: a mid-run retry (this environment's documented
  // read-after-write lag) can re-select an already-partially-approved
  // queue row via the .first() fallback above. Only click "Approve
  // membership"/"Approve credentials" if that specific button is still
  // present -- once a track is approved, its Approve button is replaced
  // by "Request correction" only (see review-panel.tsx's TrackControls),
  // so checking visibility first avoids waiting forever for a button that
  // correctly no longer exists.
  const approveMembershipBtn = page.getByRole("button", {
    name: /Approve membership/i,
  });
  const approveCredentialsBtn = page.getByRole("button", {
    name: /Approve credentials/i,
  });

  if (plan === "FULL" || plan === "MEMBERSHIP_ONLY") {
    if (await approveMembershipBtn.isVisible().catch(() => false)) {
      await approveMembershipBtn.click();
      try {
        await expect(page.getByText("confirmed")).toBeVisible({ timeout: 20000 });
      } catch {
        await page.goto(reviewUrl);
        await expect(page.getByText("confirmed")).toBeVisible();
      }
    } else {
      await expect(page.getByText("confirmed")).toBeVisible();
    }
  }

  if (plan === "FULL") {
    if (await approveCredentialsBtn.isVisible().catch(() => false)) {
      await approveCredentialsBtn.click();
      // Documented read-after-write replication lag on this environment's
      // Supabase connection (established M5-M9) -- a fresh navigation
      // back to the same review URL forces a genuine server round trip if
      // the client-side optimistic update races ahead of the write's
      // visibility.
      try {
        await expect(page.getByText("reviewed")).toBeVisible({ timeout: 20000 });
      } catch {
        await page.goto(reviewUrl);
        await expect(page.getByText("reviewed")).toBeVisible();
      }
    } else {
      await expect(page.getByText("reviewed")).toBeVisible();
    }
  }

  if (plan === "NEEDS_CORRECTION") {
    // The Credentials track's review panel is the second one on the page;
    // both tracks render a "Request correction" button with identical
    // text, so scope to the panel whose status line still reads Pending
    // (Membership was already approved above for FULL/MEMBERSHIP_ONLY
    // plans -- NEEDS_CORRECTION never runs alongside those, so both
    // panels are still in their pre-decision state here).
    await page
      .getByRole("button", { name: "Request correction" })
      .last()
      .click();
    await page
      .getByPlaceholder("What does the member need to fix?")
      .fill("Please re-upload a clearer copy of your qualification certificate.");
    await page.getByRole("button", { name: "Send correction" }).click();
    await expect(page.getByText(/Waiting on the member/i)).toBeVisible();
  }

  // Documented read-after-write replication lag on this environment's
  // Supabase connection (established M5-M9) -- force a fresh server round
  // trip before moving on to the next member.
  await page.goto(reviewUrl);
  await page.context().clearCookies();
}

// --------------------------------------------------------------------------
// The seeding run itself -- one test per roster member, serial, so a
// mid-run failure (this environment's documented server/connection
// instability) only loses that one member's progress, not the whole batch,
// and Playwright's own pass/fail report doubles as a completion log.
// --------------------------------------------------------------------------

test.describe.configure({ mode: "serial" });

for (const [index, member] of ROSTER.entries()) {
  test(`seed ${index + 1}/${ROSTER.length} -- ${member.firstName} ${member.lastName} (${member.profession}, ${member.verification})`, async ({
    page,
  }) => {
    const tag = `${index}`;
    const c = candidateFor(member, tag);
    await register(page, c);
    await completeOnboarding(page, member);
    await page.context().clearCookies();

    await applyVerificationPlan(page, c.lastName, member.verification);
  });
}
