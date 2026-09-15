import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// ============================================================================
// M4 ACCEPTANCE TESTS -- Stage 25 checklist (which reconciles Stage 24's
// review with Champion's 7 decisions). Each test maps to a checklist §11
// scenario, numbered to match.
//
// PREREQUISITES: same as M3 -- migrations 001-003 applied, taxonomy seeded,
// a CHURCH_ADMIN account, M3_ADMIN_EMAIL/M3_ADMIN_PASSWORD set, app running.
//
// Structure: independent describe blocks, each creating its own candidate(s)
// and driving them to the state its tests need, same pattern as M3's spec
// (so a slow environment only threatens one block, and blocks can run in
// parallel workers safely).
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
// shared helpers
// --------------------------------------------------------------------------

function candidate(tag: string) {
  const stamp = Date.now() + Math.floor(Math.random() * 1000);
  return {
    email: `m4-${tag}-${stamp}@m3test.com`,
    firstName: "M4",
    lastName: `${tag}${stamp % 100000}`,
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
  availabilityLabel: "Open to opportunities" | "Open to selected opportunities" | "Not currently available";
  useFreetextProfession?: boolean;
}

/** Full M2 onboarding, parameterized so M4's search/filter tests have
 *  distinguishable, known field values per candidate. Ends on /dashboard
 *  with both tracks PENDING (unchanged M2/M3 behavior). */
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

/** Register + onboard + approve both tracks (REVIEWED, not REVIEW_PENDING)
 *  so the candidate becomes directory-visible. */
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

// ============================================================================
// BLOCK A -- Directory visibility gate + badge wording + access control.
// Tests 1, 6 (partial), 7.
// ============================================================================
test.describe("M4 acceptance -- Directory gate", () => {
  test.describe.configure({ mode: "serial" });

  test("1 -- directory visibility requires both tracks approved (Confirmed + Pending credentials does NOT appear)", async ({
    page,
  }) => {
    const c = candidate("gate");
    await register(page, c);
    await completeOnboarding(page, {
      location: "Arusha",
      profession: "Quantity Surveyor",
      industry: "Construction",
      yearsOfExperience: "4",
      availabilityLabel: "Open to opportunities",
    });
    await page.context().clearCookies();

    await loginAdmin(page);
    await page.goto("/admin/verification?tab=ALL");
    await page.getByRole("link", { name: new RegExp(c.lastName) }).click();
    // Approve Membership ONLY -- credentials stays PENDING.
    await page.getByRole("button", { name: /Approve membership/i }).click();
    await expect(page.getByText("confirmed")).toBeVisible();

    await page.goto("/admin/professionals");
    await expect(
      page.getByText(`${c.firstName} ${c.lastName}`, { exact: true }),
    ).toHaveCount(0);
  });

  test("7 -- badge wording on the directory list and Admin Professional Profile is exact, never 'Verified' alone", async ({
    page,
  }) => {
    const c = await newDirectoryMember(page, "badge", {
      location: "Dodoma",
      profession: "Accountant",
      industry: "Finance",
      yearsOfExperience: "6",
      availabilityLabel: "Open to opportunities",
    });

    await page.goto("/admin/professionals");
    // Other directory-visible test members from earlier runs are expected to
    // be present too (real test data, not a bug) -- scope to this
    // candidate's own row rather than asserting on the whole page.
    const row = page.getByRole("link", { name: new RegExp(c.lastName) });
    await expect(row.getByText("Membership confirmed")).toBeVisible();
    await expect(row.getByText("Credentials reviewed")).toBeVisible();
    await expect(page.getByText(/^Verified$/)).toHaveCount(0);

    await row.click();
    await expect(page).toHaveURL(/\/admin\/professionals\/[0-9a-f-]{36}/);
    await expect(page.getByText("Membership confirmed")).toBeVisible();
    await expect(page.getByText("Credentials reviewed")).toBeVisible();
    await expect(page.getByText(/^Verified$/)).toHaveCount(0);
  });

  test("6 -- a plain member cannot reach /admin/professionals or the Admin Professional Profile", async ({
    page,
  }) => {
    const c = candidate("access");
    await register(page, c);
    await completeOnboarding(page, {
      location: "Mbeya",
      profession: "Nurse",
      industry: "Healthcare",
      yearsOfExperience: "2",
      availabilityLabel: "Open to opportunities",
    });

    await page.goto("/admin/professionals");
    await expect(page).toHaveURL("/dashboard");
    await page.goto("/admin/professionals/00000000-0000-0000-0000-000000000000");
    await expect(page).toHaveURL("/dashboard");
  });
});

// ============================================================================
// BLOCK B -- Search and filters. Tests 2, 3, 4, 5, 14.
// ============================================================================
test.describe("M4 acceptance -- Search and filters", () => {
  test.describe.configure({ mode: "serial" });

  const engineer = candidate("eng");
  const freetext = candidate("free");
  const selective = candidate("sel");
  const notAvailable = candidate("na");

  // Split into 4 separate tests, each its own onboard+approve flow -- one
  // combined setup test driving all 4 sequentially routinely exceeded even a
  // 240s budget in this environment (each onboard+approve round-trip alone
  // can take 1-2+ minutes here). Splitting gives each its own budget; the
  // describe block's serial mode keeps them in order.
  async function makeVisible(
    page: Page,
    c: ReturnType<typeof candidate>,
    profile: OnboardingProfile,
  ) {
    await register(page, c);
    await completeOnboarding(page, profile);
    await page.context().clearCookies();
    await loginAdmin(page);
    await page.goto("/admin/verification?tab=ALL");
    await page.getByRole("link", { name: new RegExp(c.lastName) }).click();
    await page.getByRole("button", { name: /Approve membership/i }).click();
    await expect(page.getByText("confirmed")).toBeVisible();
    await page.getByRole("button", { name: /Approve credentials/i }).click();
    await expect(page.getByText("reviewed")).toBeVisible();
  }

  test("setup 1/4 -- engineer (Civil Engineer, Mwanza, Construction, Open)", async ({
    page,
  }) => {
    await makeVisible(page, engineer, {
      location: "Mwanza",
      profession: "Civil Engineer",
      industry: "Construction",
      yearsOfExperience: "9",
      availabilityLabel: "Open to opportunities",
    });
  });

  test("setup 2/4 -- freetext profession (Freelance Tanzanite Cutter, Mining, Open)", async ({
    page,
  }) => {
    await makeVisible(page, freetext, {
      location: "Mwanza",
      profession: "Freelance Tanzanite Cutter",
      industry: "Mining",
      yearsOfExperience: "3",
      availabilityLabel: "Open to opportunities",
    });
  });

  test("setup 3/4 -- selective availability (Teacher, Tanga, Education)", async ({
    page,
  }) => {
    await makeVisible(page, selective, {
      location: "Tanga",
      profession: "Teacher",
      industry: "Education",
      yearsOfExperience: "5",
      availabilityLabel: "Open to selected opportunities",
    });
  });

  test("setup 4/4 -- not-available (Teacher, Tanga, Education)", async ({
    page,
  }) => {
    await makeVisible(page, notAvailable, {
      location: "Tanga",
      profession: "Teacher",
      industry: "Education",
      yearsOfExperience: "5",
      availabilityLabel: "Not currently available",
    });
  });

  test("2a -- substring search on a taxonomy profession name ('Engineer' matches 'Civil Engineer')", async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto("/admin/professionals?q=Engineer");
    await expect(
      page.getByText(`${engineer.firstName} ${engineer.lastName}`, {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("2b -- Decision 3: search matches profession_freetext, not only the taxonomy", async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto("/admin/professionals?q=Tanzanite");
    await expect(
      page.getByText(`${freetext.firstName} ${freetext.lastName}`, {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("2c -- a true-synonym search does NOT match (no taxonomy synonym matching in M4)", async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto("/admin/professionals?q=Structural%20Engineer");
    await expect(
      page.getByText(`${engineer.firstName} ${engineer.lastName}`, {
        exact: true,
      }),
    ).toHaveCount(0);
  });

  test("3 -- Available filter shows OPEN only, excluding Selective and Not Available", async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto("/admin/professionals?location=Tanga&available=1");
    await expect(
      page.getByText(`${selective.firstName} ${selective.lastName}`, {
        exact: true,
      }),
    ).toHaveCount(0);
    await expect(
      page.getByText(`${notAvailable.firstName} ${notAvailable.lastName}`, {
        exact: true,
      }),
    ).toHaveCount(0);
  });

  test("4 -- Industry filter narrows correctly (Decision 2)", async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto("/admin/professionals?industry=Mining");
    await expect(
      page.getByText(`${freetext.firstName} ${freetext.lastName}`, {
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(`${engineer.firstName} ${engineer.lastName}`, {
        exact: true,
      }),
    ).toHaveCount(0);
  });

  test("5 -- no Verification filter control exists on the search/filter form (Decision 1)", async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto("/admin/professionals");
    // Scope to the search/filter <form> -- the sidebar nav's own
    // "Verification" link (to the Verification Queue) is expected to be
    // present on every admin page and is not a directory filter.
    const filterForm = page.locator("form");
    await expect(filterForm.getByLabel(/verification/i)).toHaveCount(0);
    await expect(filterForm.getByText(/^Verification$/)).toHaveCount(0);
  });

  test("14 -- search is submit-triggered, not live-as-you-type", async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto("/admin/professionals");
    // Typing alone must not navigate/filter -- only Enter or the Search
    // button does. Confirm the URL has no q= param after typing.
    await page.getByLabel("Search").fill("Engineer");
    await expect(page).toHaveURL("/admin/professionals");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/[?&]q=Engineer/);
  });
});

// ============================================================================
// BLOCK C -- Admin Professional Profile: Contact/Shortlist state, the
// conditional Review-verification link, empty states, the dashboard stat.
// Tests 8, 9, 10, 11, 12, 13.
// ============================================================================
test.describe("M4 acceptance -- Profile screen and dashboard", () => {
  test.describe.configure({ mode: "serial" });

  test("8, 9 -- Contact and Shortlist are disabled, never a working action, in M4", async ({
    page,
  }) => {
    const c = await newDirectoryMember(page, "actions", {
      location: "Iringa",
      profession: "Electrician",
      industry: "Construction",
      yearsOfExperience: "7",
      availabilityLabel: "Open to opportunities",
    });

    await page.goto("/admin/professionals");
    await page.getByRole("link", { name: new RegExp(c.lastName) }).click();

    const contact = page.getByRole("button", { name: "Contact" });
    await expect(contact).toBeDisabled();
    const shortlist = page.getByRole("button", { name: "Shortlist" });
    await expect(shortlist).toBeDisabled();

    // No phone/email ever rendered in M4.
    await expect(page.getByText(/@/)).toHaveCount(0);
  });

  test("10 -- directory row opens the Admin Professional Profile, NOT Verification Review directly (Decision 5)", async ({
    page,
  }) => {
    const c = await newDirectoryMember(page, "route", {
      location: "Songea",
      profession: "Driver",
      industry: "Transport",
      yearsOfExperience: "10",
      availabilityLabel: "Open to opportunities",
    });

    await page.goto("/admin/professionals");
    await page.getByRole("link", { name: new RegExp(c.lastName) }).click();
    await expect(page).toHaveURL(/\/admin\/professionals\/[0-9a-f-]{36}/);
  });

  test("11 -- 'Review verification' link appears ONLY when credentials = REVIEW_PENDING, absent for a fully-reviewed member", async ({
    page,
  }) => {
    const c = await newDirectoryMember(page, "revlink", {
      location: "Moshi",
      profession: "Plumber",
      industry: "Construction",
      yearsOfExperience: "5",
      availabilityLabel: "Open to opportunities",
    });

    await page.goto("/admin/professionals");
    await page.getByRole("link", { name: new RegExp(c.lastName) }).click();
    // Fully REVIEWED, not REVIEW_PENDING -- link must be absent.
    await expect(
      page.getByRole("link", { name: "Review verification" }),
    ).toHaveCount(0);
  });

  test("12a -- zero-search-results empty state (Stage 11 canonical copy)", async ({
    page,
  }) => {
    // Stage 31 (M9) empty-state audit aligned this screen's filtered-zero
    // copy to Stage 11's exact canonical wording (it previously read "No
    // professionals found / Try adjusting your search or filters.", close
    // but not verbatim). Test-only update, no behavior change.
    await loginAdmin(page);
    await page.goto(
      "/admin/professionals?q=NoSuchProfessionExistsXYZ123",
    );
    await expect(
      page.getByText(
        "No professionals match your search. Try a broader profession or clear a filter.",
      ),
    ).toBeVisible();
  });

  function verifiedProfessionalsStatValue(page: Page) {
    return page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("Verified Professionals", { exact: true }) })
      .locator("span");
  }

  test("13 -- admin dashboard Verified Professionals stat matches the visibility gate's own predicate", async ({
    page,
  }) => {
    // Cross-checks the dashboard stat against a direct DB count at the same
    // moment, rather than assuming "before + 1" -- other M4 test blocks can
    // run concurrently in parallel workers and legitimately add their own
    // directory-visible members in between, so a before/after delta of
    // exactly 1 is not a safe assumption when the full suite runs together
    // (confirmed: this test alone, and this block alone, both pass with the
    // simpler delta check; only concurrent cross-block runs make it flaky --
    // that's test isolation, not an app bug).
    test.skip(
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY &&
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      "no publishable/anon key for a direct count cross-check",
    );

    await newDirectoryMember(page, "stat", {
      location: "Zanzibar",
      profession: "Chef",
      industry: "Hospitality",
      yearsOfExperience: "3",
      availabilityLabel: "Open to opportunities",
    });

    await loginAdmin(page);
    await page.goto("/admin/dashboard");
    const statValue = Number(
      await verifiedProfessionalsStatValue(page).innerText(),
    );

    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const sb = createClient(SUPABASE_URL!, key);
    await sb.auth.signInWithPassword({
      email: ADMIN_EMAIL!,
      password: ADMIN_PASSWORD!,
    });
    const { count } = await sb
      .from("members")
      .select("id", { count: "exact", head: true })
      .eq("profile_status", "PROFILE_COMPLETE")
      .eq("membership_status", "CONFIRMED")
      .in("credentials_status", ["REVIEWED", "REVIEW_PENDING"]);

    expect(statValue).toBe(count);
  });
});
