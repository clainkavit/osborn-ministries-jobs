import { test, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

// ============================================================================
// M8 ACCEPTANCE TESTS -- Stage 30 specification, resolved by Champion's 21
// M8 decisions (2026-09-12). Each test maps to a scenario from that
// message's testing-requirements list, numbered to match.
//
// PREREQUISITES: migrations 001-006 applied, taxonomy seeded, a CHURCH_ADMIN
// account, M3_ADMIN_EMAIL/M3_ADMIN_PASSWORD set, app running.
//
// Structure: independent describe blocks, same pattern as M3-M7's specs, so
// a slow environment only threatens one block.
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
// shared helpers (mirrors M3-M7's own helpers exactly)
// --------------------------------------------------------------------------

function candidate(tag: string) {
  const stamp = Date.now() + Math.floor(Math.random() * 1000);
  return {
    email: `m8-${tag}-${stamp}@m3test.com`,
    firstName: "M8",
    lastName: `${tag}${stamp % 100000}`,
    title: `M8 Test Role ${tag}${stamp % 100000}`,
    org: `M8 Org ${tag}${stamp % 100000}`,
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

async function newVerifiedMember(
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
  const reviewUrl = page.url();
  await page.getByRole("button", { name: /Approve membership/i }).click();
  // exact: true -- a non-exact match can also resolve to the member's own
  // name heading whenever the caller's tag happens to contain "confirmed"
  // or "reviewed" as a substring (e.g. tag "reviewedonly"), a strict-mode
  // violation unrelated to the actual status badge under test.
  await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Approve credentials/i }).click();
  await expect(page.getByText("reviewed", { exact: true })).toBeVisible();

  // This environment has documented read-after-write replication lag on
  // its Supabase connection (established across M5-M8's own sessions): the
  // client-side router.refresh() above can race ahead of the write actually
  // being visible to a subsequent, independent read (e.g. the eligibility
  // check on the member's own next page load). A full, fresh navigation
  // back to this same review screen forces a new server-side read; only
  // proceed once BOTH badges genuinely read back as approved from that
  // fresh round-trip, not merely from the optimistic client-side update.
  await page.goto(reviewUrl);
  await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
  await expect(page.getByText("reviewed", { exact: true })).toBeVisible();

  await page.context().clearCookies();
  return c;
}

async function createDraft(page: Page) {
  await loginAdmin(page);
  await page.goto("/admin/opportunities/new");
}

async function publishOpportunity(
  page: Page,
  opts: { title: string; organizationName: string; profession?: string },
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
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.getByRole("heading", { name: "Review" })).toBeVisible();
  await page.getByRole("button", { name: "Publish" }).click();
  await expect(page).toHaveURL(/\/admin\/opportunities\/([0-9a-f-]{36})$/);
  return page.url().split("/").pop()!;
}

/** Full path from a fresh verified member to a REVIEWED application on a
 *  freshly-published opportunity. Reused from M7's own helper. */
async function applyAndReview(
  page: Page,
  tag: string,
): Promise<{
  member: { email: string; firstName: string; lastName: string };
  opportunityId: string;
  applicationId: string;
}> {
  const member = await newVerifiedMember(page, tag, {
    location: "Mwanza",
    profession: "Accountant",
    industry: "Finance",
    yearsOfExperience: "5",
    availabilityLabel: "Open to opportunities",
  });

  await createDraft(page);
  const opportunityId = await publishOpportunity(page, {
    title: `M8 Apply Role ${tag}`,
    organizationName: "M8 Test Org",
    profession: "Accountant",
  });
  await page.context().clearCookies();

  await loginMember(page, member.email);
  // The Apply button gate reads membershipStatus/credentialsStatus from
  // this member-facing page's own query -- a separate read path from the
  // admin verification-review re-check newVerifiedMember() already forces.
  // Confirmed replication lag can leave this specific read stale for
  // longer than one extra round trip absorbs (M10 cross-browser finding,
  // 2026-09-13: reproduced 3 times identically on Firefox even after a
  // single retry). Poll with fresh navigations -- each one forces a new
  // server-side read, same mechanism as newVerifiedMember's own
  // established mitigation, just repeated until it actually clears rather
  // than assumed to clear after one attempt.
  const applyButton = page.getByRole("button", { name: "Apply" });
  let applyReady = false;
  for (let attempt = 0; attempt < 6; attempt++) {
    await page.goto(`/opportunities/${opportunityId}`);
    if (await applyButton.isEnabled({ timeout: 10000 }).catch(() => false)) {
      applyReady = true;
      break;
    }
  }
  if (!applyReady) {
    throw new Error(
      "Apply button never became enabled after 6 fresh navigations -- this is no longer ordinary replication lag; investigate as a possible real defect.",
    );
  }
  await applyButton.click();
  await expect(page.getByText(/view status/i)).toBeVisible();
  await page.context().clearCookies();

  await loginAdmin(page);
  await page.goto(`/admin/opportunities/${opportunityId}/applications`);
  const row = page.getByRole("link", { name: new RegExp(member.lastName) });
  await expect(row).toBeVisible();
  const href = await row.getAttribute("href");
  const applicationId = href!.split("/").pop()!;

  await page.goto(`/admin/applications/${applicationId}`);
  await page.getByRole("button", { name: "Mark reviewed" }).click();
  await expect(page.getByText("Reviewed", { exact: true })).toBeVisible();

  return { member, opportunityId, applicationId };
}

async function adminClient() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const sb = createClient(SUPABASE_URL!, key);
  await sb.auth.signInWithPassword({
    email: ADMIN_EMAIL!,
    password: ADMIN_PASSWORD!,
  });
  return sb;
}

// ============================================================================
// BLOCK A -- Shortlisted, Interview, Selected, Rejected notifications.
// Scenarios 1-4, 7, 8, 9.
// ============================================================================
test.describe("M8 acceptance -- Application status notifications", () => {
  test.describe.configure({ mode: "serial" });

  test("1, 7, 8, 9 -- Shortlisted creates a correct, unread, recipient-only notification; opening it marks it read and navigates", async ({
    page,
  }) => {
    const { member, applicationId } = await applyAndReview(page, "shortlist");

    await page.getByRole("button", { name: "Shortlist" }).click();
    await expect(page.getByText("Shortlisted", { exact: true })).toBeVisible();
    await page.context().clearCookies();

    await loginMember(page, member.email);
    await page.goto("/notifications");
    const row = page.getByText(/shortlisted for/i);
    await expect(row).toBeVisible();
    // 7 -- unread on creation: the bold-dot marker precedes read styling.
    await expect(
      page.locator("button").filter({ hasText: /shortlisted for/i }),
    ).toHaveClass(/font-medium/);

    // 9 -- opening marks it read and navigates to the application detail.
    await row.click();
    await expect(page).toHaveURL(`/applications/${applicationId}`);
    await page.goto("/notifications");
    await expect(
      page.locator("button").filter({ hasText: /shortlisted for/i }),
    ).not.toHaveClass(/font-medium/);
  });

  test("2 -- Interview creates the correct notification", async ({
    page,
  }) => {
    const { member, applicationId } = await applyAndReview(page, "interview");
    await page.getByRole("button", { name: "Shortlist" }).click();
    await expect(page.getByText("Shortlisted", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Schedule interview" }).click();
    await page.getByLabel("Date").fill("2026-10-15");
    await page.getByLabel("Time").fill("10:00");
    await page.getByLabel("Location").fill("Church office");
    await page.getByRole("button", { name: "Confirm interview" }).click();
    await expect(
      page.locator('[data-slot="badge"]').getByText("Interview", { exact: true }),
    ).toBeVisible();
    await page.context().clearCookies();

    await loginMember(page, member.email);
    await page.goto("/notifications");
    const row = page.getByText(/invited to interview for/i);
    await expect(row).toBeVisible();
    await row.click();
    await expect(page).toHaveURL(`/applications/${applicationId}`);
  });

  test("3 -- Selected creates the correct notification", async ({ page }) => {
    const { member } = await applyAndReview(page, "selected");
    await page.getByRole("button", { name: "Shortlist" }).click();
    await expect(page.getByText("Shortlisted", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Schedule interview" }).click();
    await page.getByLabel("Date").fill("2026-10-20");
    await page.getByLabel("Time").fill("11:00");
    await page.getByLabel("Location").fill("Church office");
    await page.getByRole("button", { name: "Confirm interview" }).click();
    await expect(
      page.locator('[data-slot="badge"]').getByText("Interview", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Mark selected" }).click();
    await expect(page.getByText("Selected", { exact: true })).toBeVisible();
    await page.context().clearCookies();

    await loginMember(page, member.email);
    await page.goto("/notifications");
    await expect(page.getByText(/you've been selected for/i)).toBeVisible();
  });

  test("4 -- Rejected creates the correct notification, with no admin-internal notes exposed", async ({
    page,
  }) => {
    const { member, applicationId } = await applyAndReview(page, "rejected");
    await page.getByRole("button", { name: "Shortlist" }).click();
    await expect(page.getByText("Shortlisted", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Schedule interview" }).click();
    await page.getByLabel("Date").fill("2026-10-22");
    await page.getByLabel("Time").fill("12:00");
    await page.getByLabel("Location").fill("Church office");
    await page.getByRole("button", { name: "Confirm interview" }).click();
    await expect(
      page.locator('[data-slot="badge"]').getByText("Interview", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Mark rejected" }).click();
    await expect(page.getByText("Rejected", { exact: true })).toBeVisible();
    await page.context().clearCookies();

    await loginMember(page, member.email);
    await page.goto("/notifications");
    const row = page.getByText(/weren't selected for/i);
    await expect(row).toBeVisible();
    await row.click();
    await expect(page).toHaveURL(`/applications/${applicationId}`);
    await expect(page.getByText(/notes/i)).toHaveCount(0);
  });
});

// ============================================================================
// BLOCK B -- Excluded events: no notification. Scenarios 10, 11, 12.
// ============================================================================
test.describe("M8 acceptance -- Excluded events create no notification", () => {
  test.describe.configure({ mode: "serial" });

  // newVerifiedMember's own admin-approval step legitimately creates two
  // M3 notifications (Membership confirmed, Credentials reviewed) for
  // every member these tests create -- so "no notification" for the M7
  // event under test must be proven as "the count doesn't grow beyond
  // those two baseline rows," never as "the list is empty" (it never is,
  // for a verified member).

  test("10 -- marking Reviewed creates no notification", async ({ page }) => {
    const { member } = await applyAndReview(page, "reviewedonly");
    await page.context().clearCookies();

    await loginMember(page, member.email);
    await page.goto("/notifications");
    await expect(page.getByText("Your membership has been confirmed.")).toBeVisible();
    await expect(
      page.getByText("Your professional information has been reviewed."),
    ).toBeVisible();
    await expect(page.locator("main ul > li")).toHaveCount(2);
  });

  // Regression (M10, 2026-09-14): approving Membership and then immediately
  // approving Credentials on the same review screen, back-to-back with no
  // wait between clicks, must persist BOTH tracks. This exact interaction
  // was investigated as a suspected Firefox-only defect -- the suspicion
  // was disproved (see M10 report): the Credentials write genuinely
  // completes, it just takes several seconds server-side (three sequential
  // Supabase round trips per verifyTrack call), during which the UI
  // correctly shows "Saving...". The regression here is against actual
  // persisted DB state, read back with a signed-in admin client (respects
  // RLS), not against UI text alone.
  test("regression -- immediate back-to-back Membership+Credentials approval persists both tracks", async ({
    page,
  }) => {
    const c = candidate("seqapprove");
    await register(page, c);
    await completeOnboarding(page, {
      location: "Dodoma",
      profession: "Accountant",
      industry: "Finance",
      yearsOfExperience: "3",
      availabilityLabel: "Open to opportunities",
    });
    await page.context().clearCookies();

    await loginAdmin(page);
    await page.goto("/admin/verification?tab=ALL");
    await page.getByRole("link", { name: new RegExp(c.lastName) }).click();
    await expect(page).toHaveURL(/\/admin\/verification\/[0-9a-f-]{36}/);

    await page.getByRole("button", { name: /Approve membership/i }).click();
    await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
    // No wait here -- this is the exact interaction under investigation:
    // the second approval fired as soon as it's clickable, not after any
    // extra delay.
    await page.getByRole("button", { name: /Approve credentials/i }).click();
    await expect(page.getByText("reviewed", { exact: true })).toBeVisible();

    const sb = await adminClient();
    const { data: member, error } = await sb
      .from("members")
      .select("id, membership_status, credentials_status")
      .eq("email", c.email)
      .single();
    expect(error).toBeNull();
    expect(member?.membership_status).toBe("CONFIRMED");
    expect(member?.credentials_status).toBe("REVIEWED");

    const { data: history } = await sb
      .from("verification_history")
      .select("track, action")
      .eq("member_id", member!.id);
    expect(
      history?.filter((h) => h.track === "MEMBERSHIP" && h.action === "APPROVED"),
    ).toHaveLength(1);
    expect(
      history?.filter((h) => h.track === "CREDENTIALS" && h.action === "APPROVED"),
    ).toHaveLength(1);
  });

  test("11 -- withdrawing an application creates no notification", async ({
    page,
  }) => {
    const member = await newVerifiedMember(page, "withdrawnnotif", {
      location: "Mtwara",
      profession: "Accountant",
      industry: "Finance",
      yearsOfExperience: "4",
      availabilityLabel: "Open to opportunities",
    });

    await createDraft(page);
    const opportunityId = await publishOpportunity(page, {
      title: `M8 Withdraw Role ${Date.now()}`,
      organizationName: "M8 Test Org",
      profession: "Accountant",
    });
    await page.context().clearCookies();

    await loginMember(page, member.email);
    await page.goto(`/opportunities/${opportunityId}`);
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/view status/i)).toBeVisible();
    await page.getByText(/view status/i).click();
    await page.getByRole("button", { name: "Withdraw application" }).click();
    await expect(page.getByText("Withdrawn", { exact: true })).toBeVisible();

    await page.goto("/notifications");
    await expect(page.locator("main ul > li")).toHaveCount(2);
  });

  test("12 -- applying to an opportunity creates no persisted notification", async ({
    page,
  }) => {
    const member = await newVerifiedMember(page, "applyonly", {
      location: "Iringa",
      profession: "Accountant",
      industry: "Finance",
      yearsOfExperience: "3",
      availabilityLabel: "Open to opportunities",
    });

    await createDraft(page);
    const opportunityId = await publishOpportunity(page, {
      title: `M8 Apply Only Role ${Date.now()}`,
      organizationName: "M8 Test Org",
      profession: "Accountant",
    });
    await page.context().clearCookies();

    await loginMember(page, member.email);
    await page.goto(`/opportunities/${opportunityId}`);
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/view status/i)).toBeVisible();

    await page.goto("/notifications");
    await expect(page.locator("main ul > li")).toHaveCount(2);
  });
});

// ============================================================================
// BLOCK C -- Opportunity-closed notification, fired only from
// closeRemainingApplications. Scenarios 5, 6, 17, 18, 19.
// ============================================================================
test.describe("M8 acceptance -- Opportunity-closed fan-out notification", () => {
  test.describe.configure({ mode: "serial" });

  const stamp = Date.now();
  let openMemberEmail: string;
  let selectedMemberEmail: string;
  let selectedMemberLastName: string;
  let opportunityId: string;
  let selectedAppId: string;
  let openAppId: string;

  test("setup 1/3 -- two verified members", async ({ page }) => {
    const openMember = await newVerifiedMember(page, `openm${stamp}`, {
      location: "Mtwara",
      profession: "Accountant",
      industry: "Finance",
      yearsOfExperience: "5",
      availabilityLabel: "Open to opportunities",
    });
    const selectedMember = await newVerifiedMember(page, `selm${stamp}`, {
      location: "Mtwara",
      profession: "Accountant",
      industry: "Finance",
      yearsOfExperience: "5",
      availabilityLabel: "Open to opportunities",
    });
    openMemberEmail = openMember.email;
    selectedMemberEmail = selectedMember.email;
    selectedMemberLastName = selectedMember.lastName;
  });

  test("setup 2/3 -- both members apply to a fresh opportunity", async ({
    page,
  }) => {
    await createDraft(page);
    opportunityId = await publishOpportunity(page, {
      title: `M8 Close Role ${stamp}`,
      organizationName: "M8 Test Org",
      profession: "Accountant",
    });
    await page.context().clearCookies();

    await loginMember(page, openMemberEmail);
    await page.goto(`/opportunities/${opportunityId}`);
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/view status/i)).toBeVisible();
    await page.context().clearCookies();

    await loginMember(page, selectedMemberEmail);
    await page.goto(`/opportunities/${opportunityId}`);
    await page.getByRole("button", { name: "Apply" }).click();
    await expect(page.getByText(/view status/i)).toBeVisible();
  });

  test("setup 3/3 -- the selected-member's application is driven to Selected", async ({
    page,
  }) => {
    await page.context().clearCookies();
    await loginAdmin(page);
    await page.goto(`/admin/opportunities/${opportunityId}/applications`);

    const selectedRow = page.getByRole("link", {
      name: new RegExp(selectedMemberLastName),
    });
    const selectedHref = await selectedRow.getAttribute("href");
    selectedAppId = selectedHref!.split("/").pop()!;

    const openRow = page.getByRole("link", { name: /openm/ });
    const openHref = await openRow.getAttribute("href");
    openAppId = openHref!.split("/").pop()!;

    await page.goto(`/admin/applications/${selectedAppId}`);
    await page.getByRole("button", { name: "Mark reviewed" }).click();
    await expect(page.getByText("Reviewed", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Shortlist" }).click();
    await expect(page.getByText("Shortlisted", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Schedule interview" }).click();
    await page.getByLabel("Date").fill("2026-10-25");
    await page.getByLabel("Time").fill("11:00");
    await page.getByLabel("Location").fill("Church office");
    await page.getByRole("button", { name: "Confirm interview" }).click();
    await expect(
      page.locator('[data-slot="badge"]').getByText("Interview", { exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Mark selected" }).click();
    await expect(page.getByText("Selected", { exact: true })).toBeVisible();
  });

  test("5, 6, 17, 18, 19 -- closing remaining applications notifies only the rejected one, leaves Selected untouched, and reports counts", async ({
    page,
  }) => {
    await loginAdmin(page);
    await page.goto(`/admin/opportunities/${opportunityId}`);
    await page.getByRole("button", { name: "Close" }).click();
    await expect(page.getByText("Closed", { exact: true })).toBeVisible();

    await page.goto(`/admin/opportunities/${opportunityId}/applications`);
    await page
      .getByRole("button", { name: "Close remaining applications" })
      .click();

    // 19 -- fan-out result counts surfaced to the caller.
    await expect(page.getByText(/application.*closed/i)).toBeVisible();
    await expect(page.getByText(/1 application closed/i)).toBeVisible();

    // "Close remaining applications" fans out a bulk write server-side; its
    // confirmation text can become visible slightly before that action's own
    // background refresh has settled. A subsequent page.goto() firing while
    // that refresh is still in flight surfaces as NS_BINDING_ABORTED on
    // Firefox (same class of race already root-caused and fixed for M2 --
    // see m2-acceptance.spec.ts). Let the network settle first.
    await page.waitForLoadState("networkidle");

    // 18 -- the open application was actually rejected (the only eligible
    // one -- Selected was never touched).
    await page.goto(`/admin/applications/${openAppId}`);
    await expect(page.getByText("Rejected", { exact: true })).toBeVisible();

    // 6 -- Selected remains untouched.
    await page.goto(`/admin/applications/${selectedAppId}`);
    await expect(page.getByText("Selected", { exact: true })).toBeVisible();
    await page.context().clearCookies();

    // 5 -- the open member (now rejected via closure) got the notification;
    await loginMember(page, openMemberEmail);
    await page.goto("/notifications");
    await expect(page.getByText(/has closed/i)).toBeVisible();
    await expect(
      page.getByText(/wasn't carried forward/i),
    ).toBeVisible();
    await page.context().clearCookies();

    // 6 -- the selected member (never touched by closeRemainingApplications)
    // got no such notification.
    await loginMember(page, selectedMemberEmail);
    await page.goto("/notifications");
    await expect(page.getByText(/has closed/i)).toHaveCount(0);
  });
});

// ============================================================================
// BLOCK D -- RLS: member cannot insert notifications. Scenarios 14, 15.
// ============================================================================
test.describe("M8 acceptance -- Notification INSERT RLS", () => {
  test("14 -- a member cannot insert a notification for themselves", async ({
    page,
  }) => {
    const member = await newVerifiedMember(page, "selfinsert", {
      location: "Dodoma",
      profession: "Accountant",
      industry: "Finance",
      yearsOfExperience: "3",
      availabilityLabel: "Open to opportunities",
    });
    void page;

    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const sb = createClient(SUPABASE_URL!, key);
    await sb.auth.signInWithPassword({ email: member.email, password: PASSWORD });

    // Attempt a self-targeted insert as the member's own authenticated
    // client -- the tightened policy (is_church_admin() only) must reject
    // this regardless of which member_id is supplied, since this caller
    // is never an admin.
    const { data: myMember } = await sb
      .from("members")
      .select("id")
      .eq("email", member.email)
      .maybeSingle();

    const { error } = await sb.from("notifications").insert({
      member_id: myMember!.id,
      type: "APPLICATION_SHORTLISTED",
      body_text: "Forged self-notification attempt.",
    });
    expect(error).not.toBeNull();
  });

  test("15 -- a member cannot insert a notification for another member", async ({
    page,
  }) => {
    const memberA = await newVerifiedMember(page, "targetA", {
      location: "Songea",
      profession: "Accountant",
      industry: "Finance",
      yearsOfExperience: "3",
      availabilityLabel: "Open to opportunities",
    });
    await page.context().clearCookies();
    const memberB = await newVerifiedMember(page, "attackerB", {
      location: "Songea",
      profession: "Accountant",
      industry: "Finance",
      yearsOfExperience: "3",
      availabilityLabel: "Open to opportunities",
    });

    const key =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const sbB = createClient(SUPABASE_URL!, key);
    await sbB.auth.signInWithPassword({
      email: memberB.email,
      password: PASSWORD,
    });

    const admin = await adminClient();
    const { data: targetMember } = await admin
      .from("members")
      .select("id")
      .eq("email", memberA.email)
      .maybeSingle();

    const { error } = await sbB.from("notifications").insert({
      member_id: targetMember!.id,
      type: "APPLICATION_SHORTLISTED",
      body_text: "Forged notification for another member.",
    });
    expect(error).not.toBeNull();
  });
});

// ============================================================================
// BLOCK E -- Existing M3 flows still work after the RLS tightening.
// Scenario 16.
// ============================================================================
test.describe("M8 acceptance -- Existing M3 notification flows still work", () => {
  test("16 -- Membership Confirmed still creates a notification after the INSERT policy change", async ({
    page,
  }) => {
    const c = candidate("m3regress");
    await register(page, c);
    await completeOnboarding(page, {
      location: "Mwanza",
      profession: "Accountant",
      industry: "Finance",
      yearsOfExperience: "4",
      availabilityLabel: "Open to opportunities",
    });
    await page.context().clearCookies();

    await loginAdmin(page);
    await page.goto("/admin/verification?tab=ALL");
    await page.getByRole("link", { name: new RegExp(c.lastName) }).click();
    await page.getByRole("button", { name: /Approve membership/i }).click();
    await expect(page.getByText("confirmed", { exact: true })).toBeVisible();
    await page.context().clearCookies();

    await loginMember(page, c.email);
    await page.goto("/notifications");
    await expect(
      page.getByText("Your membership has been confirmed."),
    ).toBeVisible();
  });
});

// ============================================================================
// BLOCK F -- M6 boundary. Scenario 13.
// ============================================================================
test.describe("M8 acceptance -- M6 boundary preserved", () => {
  test("13 -- Find Matches produces no notification of any kind", async ({
    page,
  }) => {
    const member = await newVerifiedMember(page, "m6nomatch", {
      location: "Mbeya",
      profession: "Accountant",
      industry: "Finance",
      yearsOfExperience: "5",
      availabilityLabel: "Open to opportunities",
    });

    await createDraft(page);
    const opportunityId = await publishOpportunity(page, {
      title: `M8 Matches Role ${Date.now()}`,
      organizationName: "M8 Test Org",
      profession: "Accountant",
    });
    await page.goto(`/admin/opportunities/${opportunityId}/matches`);
    await expect(
      page.getByRole("heading", { name: "Find matches" }),
    ).toBeVisible();
    await page.context().clearCookies();

    // newVerifiedMember's own admin-approval step legitimately creates two
    // M3 notifications (Membership confirmed, Credentials reviewed) --
    // this test proves Find Matches adds NOTHING beyond those, not that
    // the list is empty (it never is, for a verified member).
    await loginMember(page, member.email);
    await page.goto("/notifications");
    await expect(page.getByText("Your membership has been confirmed.")).toBeVisible();
    await expect(
      page.getByText("Your professional information has been reviewed."),
    ).toBeVisible();
    const items = page.locator("main ul > li");
    await expect(items).toHaveCount(2);
    await expect(page.getByText(/match/i)).toHaveCount(0);
  });
});
