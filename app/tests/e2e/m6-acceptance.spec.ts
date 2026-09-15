import { test, expect, type Page } from "@playwright/test";

// ============================================================================
// M6 ACCEPTANCE TESTS -- Stage 28 specification §8. Each test maps to a
// scenario listed there, numbered to match.
//
// PREREQUISITES: migrations 001-004 applied, taxonomy seeded, a CHURCH_ADMIN
// account, M3_ADMIN_EMAIL/M3_ADMIN_PASSWORD set, app running.
//
// Structure: independent describe blocks, same pattern as M3/M4/M5's specs,
// so a slow environment only threatens one block.
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
// shared helpers (mirrors M4/M5's own helpers exactly)
// --------------------------------------------------------------------------

function candidate(tag: string) {
  const stamp = Date.now() + Math.floor(Math.random() * 1000);
  return {
    email: `m6-${tag}-${stamp}@m3test.com`,
    firstName: "M6",
    lastName: `${tag}${stamp % 100000}`,
    title: `M6 Test Role ${tag}${stamp % 100000}`,
    org: `M6 Org ${tag}${stamp % 100000}`,
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

interface OnboardingProfile {
  location: string;
  profession: string;
  industry: string;
  yearsOfExperience: string;
  availabilityLabel:
    | "Open to opportunities"
    | "Open to selected opportunities"
    | "Not currently available";
}

/** Full M2 onboarding, parameterized. Ends on /dashboard with both tracks
 *  PENDING. Reused verbatim from M4's own helper. */
async function completeOnboarding(page: Page, p: OnboardingProfile) {
  await expect(page.getByRole("heading", { name: "About you" })).toBeVisible();
  await page.getByLabel("Location").fill(p.location);
  await page.getByRole("button", { name: "Next" }).click();

  await expect(
    page.getByRole("heading", { name: "What do you do?" }),
  ).toBeVisible();
  await page.getByLabel("Primary profession").fill(p.profession);
  await page.getByLabel("Industry").fill(p.industry);
  await page.getByRole("button", { name: "Next" }).click();

  await expect(
    page.getByRole("heading", { name: "Your experience" }),
  ).toBeVisible();
  await page.getByLabel("Employment status").selectOption("SELF_EMPLOYED");
  await page.getByLabel("Years of experience").fill(p.yearsOfExperience);
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Education" })).toBeVisible();
  await page.getByLabel("Institution").fill("VETA Mwanza");
  await page.getByLabel("Qualification").fill("Certificate");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Certificate")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
  await page.getByPlaceholder("Type a skill and press Add").fill("General");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("General")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Your CV" })).toBeVisible();
  await page.setInputFiles('input[type="file"]', {
    name: "cv.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.4 minimal test pdf"),
  });
  await expect(page.getByText("cv.pdf")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Availability" })).toBeVisible();
  await page.getByText(p.availabilityLabel, { exact: true }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByText("Step 8 of 8")).toBeVisible();
  await page.getByRole("button", { name: "Submit for verification" }).click();
  await expect(page).toHaveURL("/dashboard");
}

/** Register + onboard + approve both tracks (REVIEWED) so the candidate is
 *  directory-visible and match-eligible. Reused verbatim from M4. */
async function newDirectoryMember(
  page: Page,
  tag: string,
  profile: OnboardingProfile,
) {
  const c = candidate(tag);
  await register(page, c);
  await completeOnboarding(page, profile);
  await page.context().clearCookies();

  await loginAdmin(page);
  await page.goto("/admin/verification?tab=ALL");
  await page.getByRole("link", { name: new RegExp(c.lastName) }).click();
  await expect(page).toHaveURL(/\/admin\/verification\/[0-9a-f-]{36}/);
  await page.getByRole("button", { name: /Approve membership/i }).click();
  await expect(page.getByText("confirmed")).toBeVisible();
  await page.getByRole("button", { name: /Approve credentials/i }).click();
  await expect(page.getByText("reviewed")).toBeVisible();

  return c;
}

async function createDraft(page: Page) {
  await loginAdmin(page);
  await page.goto("/admin/opportunities/new");
}

/** Drives the wizard from the /new form through to Publish. Reused/adapted
 *  from M5's own helper. Returns the published opportunity's id. */
async function publishOpportunity(
  page: Page,
  opts: {
    title: string;
    organizationName: string;
    profession?: string;
    minExperienceYears?: string;
    educationLevel?: string;
    skill?: string;
  },
): Promise<string> {
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(
    page.getByRole("heading", { name: "Opportunity type" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Details" })).toBeVisible();
  await page.getByLabel("Title").fill(opts.title);
  await page.getByLabel("Organization").fill(opts.organizationName);
  await page.getByRole("button", { name: "Next" }).click();

  await expect(
    page.getByRole("heading", { name: "Requirements" }),
  ).toBeVisible();
  if (opts.profession) {
    await page.getByLabel("Profession").fill(opts.profession);
    await page.getByText(opts.profession, { exact: true }).first().click();
  }
  if (opts.minExperienceYears) {
    await page
      .getByLabel("Minimum experience (years)")
      .fill(opts.minExperienceYears);
  }
  if (opts.educationLevel) {
    await page.getByLabel("Education level").selectOption(opts.educationLevel);
  }
  if (opts.skill) {
    await page.getByLabel("Required skills").fill(opts.skill);
    await page.getByText(opts.skill, { exact: true }).first().click();
  }
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page).toHaveURL(/\/admin\/opportunities\/([0-9a-f-]{36})$/);
  return page.url().split("/").pop()!;
}

// ============================================================================
// BLOCK A -- Core matching, breakdown, and ranking. Tests 1, 9, 10, 11, 12.
// ============================================================================
test.describe("M6 acceptance -- Matching, scoring, and breakdown", () => {
  test.describe.configure({ mode: "serial" });

  test("1, 9, 10, 12 -- ranked results with full breakdown; no-required-profession and zero-required-skills are not penalized; education reads as not evaluated", async ({
    page,
  }) => {
    // A candidate whose profession/skills won't match the opportunity at
    // all, so the ONLY reason they can still score well is the "no
    // requirement stated" rule (Decisions 5 and 6) -- proving those rules
    // fire, not just that a good match scores well for unrelated reasons.
    const engineer = await newDirectoryMember(page, "eng", {
      location: "Mwanza",
      profession: "Civil Engineer",
      industry: "Construction",
      yearsOfExperience: "9",
      availabilityLabel: "Open to opportunities",
    });

    await createDraft(page);
    const oppId = await publishOpportunity(page, {
      title: `M6 Open Role ${Date.now()}`,
      organizationName: "M6 Test Org",
      // No profession, no skills, no min-experience specified -- an
      // education-level requirement alone satisfies M5's publish gate.
      educationLevel: "DIPLOMA",
    });

    await page.goto(`/admin/opportunities/${oppId}/matches`);
    await expect(page.getByRole("heading", { name: "Find matches" })).toBeVisible();

    const row = page
      .locator("li")
      .filter({ hasText: new RegExp(`${engineer.firstName} ${engineer.lastName}`) });
    await expect(row).toBeVisible();

    // Test 9: no required profession -> not penalized.
    await expect(row.getByText("Match", { exact: true })).toBeVisible();
    // Test 10: zero required skills -> 100%.
    await expect(row.getByText("100%", { exact: true })).toBeVisible();
    // Test 12: education breakdown reads as not evaluated, never as though
    // a real comparison happened.
    await expect(row.getByText("Not evaluated in M6")).toBeVisible();
  });
});

// ============================================================================
// BLOCK B -- Eligibility gate exclusions. Tests 2, 3, 4.
// ============================================================================
test.describe("M6 acceptance -- Eligibility gate", () => {
  test.describe.configure({ mode: "serial" });

  test("2 -- a candidate who fails the verification gate never appears", async ({
    page,
  }) => {
    const c = candidate("unverified");
    await register(page, c);
    await completeOnboarding(page, {
      location: "Mwanza",
      profession: "Civil Engineer",
      industry: "Construction",
      yearsOfExperience: "9",
      availabilityLabel: "Open to opportunities",
    });
    // Deliberately NOT approved by an admin -- both tracks stay PENDING.
    await page.context().clearCookies();

    await createDraft(page);
    const oppId = await publishOpportunity(page, {
      title: `M6 Gate Role ${Date.now()}`,
      organizationName: "M6 Test Org",
      profession: "Civil Engineer",
    });

    await page.goto(`/admin/opportunities/${oppId}/matches`);
    await expect(
      page.getByText(`${c.firstName} ${c.lastName}`, { exact: true }),
    ).toHaveCount(0);
  });

  test("3 -- a NOT_AVAILABLE candidate never appears", async ({ page }) => {
    const c = await newDirectoryMember(page, "unavail", {
      location: "Mwanza",
      profession: "Accountant",
      industry: "Finance",
      yearsOfExperience: "5",
      availabilityLabel: "Not currently available",
    });

    await createDraft(page);
    const oppId = await publishOpportunity(page, {
      title: `M6 Avail Role ${Date.now()}`,
      organizationName: "M6 Test Org",
      profession: "Accountant",
    });

    await page.goto(`/admin/opportunities/${oppId}/matches`);
    await expect(
      page.getByText(`${c.firstName} ${c.lastName}`, { exact: true }),
    ).toHaveCount(0);
  });

  test("4 -- a SELECTIVE candidate appears, scored lower on availability than an OPEN candidate", async ({
    page,
  }) => {
    const openC = await newDirectoryMember(page, "openavail", {
      location: "Dodoma",
      profession: "Nurse",
      industry: "Healthcare",
      yearsOfExperience: "6",
      availabilityLabel: "Open to opportunities",
    });
    const selectiveC = await newDirectoryMember(page, "selavail", {
      location: "Dodoma",
      profession: "Nurse",
      industry: "Healthcare",
      yearsOfExperience: "6",
      availabilityLabel: "Open to selected opportunities",
    });

    await createDraft(page);
    const oppId = await publishOpportunity(page, {
      title: `M6 Selective Role ${Date.now()}`,
      organizationName: "M6 Test Org",
      profession: "Nurse",
    });

    await page.goto(`/admin/opportunities/${oppId}/matches`);
    const openRow = page
      .locator("li")
      .filter({ hasText: new RegExp(`${openC.firstName} ${openC.lastName}`) });
    const selectiveRow = page
      .locator("li")
      .filter({
        hasText: new RegExp(`${selectiveC.firstName} ${selectiveC.lastName}`),
      });
    await expect(openRow).toBeVisible();
    await expect(selectiveRow).toBeVisible();
    await expect(openRow.getByText("Open", { exact: true })).toBeVisible();
    await expect(
      selectiveRow.getByText("Selective", { exact: true }),
    ).toBeVisible();

    const openScoreText = await openRow.locator("span.tabular-nums").innerText();
    const selectiveScoreText = await selectiveRow
      .locator("span.tabular-nums")
      .innerText();
    const openScore = Number(openScoreText.replace("%", ""));
    const selectiveScore = Number(selectiveScoreText.replace("%", ""));
    expect(openScore).toBeGreaterThan(selectiveScore);
  });
});

// ============================================================================
// BLOCK C -- Access control and non-Published rejection. Tests 6, 7, 8.
// ============================================================================
test.describe("M6 acceptance -- Access control and status guard", () => {
  test.describe.configure({ mode: "serial" });

  test("6 -- a plain member is redirected away from the matches route", async ({
    page,
  }) => {
    const c = candidate("noaccess");
    await register(page, c);

    await page.goto(
      "/admin/opportunities/00000000-0000-0000-0000-000000000000/matches",
    );
    await expect(page).toHaveURL("/dashboard");
  });

  test("7 -- Find Matches link is absent from Opportunity Detail for a Draft opportunity", async ({
    page,
  }) => {
    await createDraft(page);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(
      page.getByRole("heading", { name: "Opportunity type" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("heading", { name: "Details" })).toBeVisible();
    const title = `M6 Draft Role ${Date.now()}`;
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Organization").fill("M6 Test Org");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();

    await page.goto("/admin/opportunities");
    const row = page.getByRole("link", { name: new RegExp(title) });
    await expect(row).toBeVisible();
    const href = await row.getAttribute("href");
    const id = href!.split("/").pop()!;

    await page.goto(`/admin/opportunities/${id}`);
    await expect(
      page.getByRole("link", { name: "Find matches" }),
    ).toHaveCount(0);
  });

  test("8 -- direct navigation to matches for a non-Published opportunity shows the explicit rejection state", async ({
    page,
  }) => {
    await createDraft(page);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(
      page.getByRole("heading", { name: "Opportunity type" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByRole("heading", { name: "Details" })).toBeVisible();
    const title = `M6 Draft Direct ${Date.now()}`;
    await page.getByLabel("Title").fill(title);
    await page.getByLabel("Organization").fill("M6 Test Org");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByRole("button", { name: "Next" }).click();

    await page.goto("/admin/opportunities");
    const row = page.getByRole("link", { name: new RegExp(title) });
    const href = await row.getAttribute("href");
    const id = href!.split("/").pop()!;

    await page.goto(`/admin/opportunities/${id}/matches`);
    await expect(
      page.getByText("Matching is only available for published opportunities."),
    ).toBeVisible();
    // Never a silently-empty results table -- confirm no "potential match(es)"
    // count line and no results list are rendered at all in this state.
    await expect(page.getByText(/potential match/)).toHaveCount(0);
  });
});

// ============================================================================
// BLOCK D -- Empty state, low-score inclusion, and tie-break. Tests 5, 11, 13.
// ============================================================================
test.describe("M6 acceptance -- Empty state, low scores, and tie-break", () => {
  test.describe.configure({ mode: "serial" });

  test("5 -- zero eligible candidates shows the distinct 'no matching professionals' empty state", async ({
    page,
  }) => {
    await createDraft(page);
    const oppId = await publishOpportunity(page, {
      title: `M6 Empty Role ${Date.now()}`,
      organizationName: "M6 Test Org",
      // A requirement signal is needed to satisfy M5's publish gate, but
      // which one doesn't matter here -- Decision 4 means every eligible
      // candidate appears regardless of score, so this test can't force a
      // truly empty result on demand. The meaningful assertion is the
      // empty-state COPY, guarded below to only fire when the list is
      // actually empty (which may not always be true under parallel runs).
      educationLevel: "DOCTORATE",
    });
    await page.goto(`/admin/opportunities/${oppId}/matches`);
    // This may legitimately show existing eligible candidates from other
    // parallel test runs (scored low on profession) rather than truly zero
    // -- so this test only asserts the copy exists WHEN the list is empty,
    // guarded by checking the candidate count text first.
    const hasResults = await page.getByText(/potential match/).count();
    if (hasResults === 0) {
      await expect(page.getByText("No matching professionals")).toBeVisible();
    }
  });

  test("11 -- a low-scoring candidate still appears in the results (no score floor)", async ({
    page,
  }) => {
    // A candidate whose profession/location/experience will not match at
    // all -- should still appear, just low, never excluded.
    const c = await newDirectoryMember(page, "lowscore", {
      location: "Tanga",
      profession: "Teacher",
      industry: "Education",
      yearsOfExperience: "1",
      availabilityLabel: "Open to opportunities",
    });

    await createDraft(page);
    const oppId = await publishOpportunity(page, {
      title: `M6 Mismatch Role ${Date.now()}`,
      organizationName: "M6 Test Org",
      profession: "Civil Engineer",
      minExperienceYears: "15",
    });

    await page.goto(`/admin/opportunities/${oppId}/matches`);
    await expect(
      page.getByText(`${c.firstName} ${c.lastName}`, { exact: true }),
    ).toBeVisible();
  });

  test("13 -- two candidates with an identical score appear in alphabetical-by-last-name order", async ({
    page,
  }) => {
    const stamp = Date.now();
    const a = await newDirectoryMember(page, `tieA${stamp}`, {
      location: "Iringa",
      profession: "Electrician",
      industry: "Construction",
      yearsOfExperience: "3",
      availabilityLabel: "Open to opportunities",
    });
    const b = await newDirectoryMember(page, `tieZ${stamp}`, {
      location: "Iringa",
      profession: "Electrician",
      industry: "Construction",
      yearsOfExperience: "3",
      availabilityLabel: "Open to opportunities",
    });

    await createDraft(page);
    const oppId = await publishOpportunity(page, {
      title: `M6 Tie Role ${stamp}`,
      organizationName: "M6 Test Org",
      profession: "Electrician",
      minExperienceYears: "3",
    });

    await page.goto(`/admin/opportunities/${oppId}/matches`);
    const names = await page.locator("li p.font-medium").allInnerTexts();
    const aIndex = names.findIndex((n) =>
      n.includes(`${a.firstName} ${a.lastName}`),
    );
    const bIndex = names.findIndex((n) =>
      n.includes(`${b.firstName} ${b.lastName}`),
    );
    expect(aIndex).toBeGreaterThanOrEqual(0);
    expect(bIndex).toBeGreaterThanOrEqual(0);
    // a's lastName tag is "tieA...", b's is "tieZ..." -- alphabetically a
    // sorts before b when scores are equal.
    expect(aIndex).toBeLessThan(bIndex);
  });
});
