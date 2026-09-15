import { test, expect, type Page } from "@playwright/test";

// ============================================================================
// M2 ACCEPTANCE TESTS -- Stage 22 checklist. Final authority on whether M2 is
// finished. Each test maps to a checklist line.
//
// PREREQUISITES:
//   1. Supabase project connected via app/.env.local (same as M1)
//   2. Migrations 001 AND 002 applied
//   3. Seed app/supabase/seed/taxonomy.sql applied
//   4. Auth "Confirm email" OFF (dev), test emails use @m2test.com
//   5. App running (npm run build && npm run start, or npm run dev)
//
// Run: npx playwright test m2-acceptance
// ============================================================================

const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "REPLACE_ME";

test.describe.configure({ mode: "serial" });

test.describe("M2 acceptance", () => {
  test.skip(!HAS_SUPABASE, "Supabase not connected -- see .env.local");

  const stamp = Date.now();
  const email = `m2-${stamp}@m2test.com`;
  const password = "correcthorse9";

  async function register(page: Page) {
    await page.goto("/register");
    await page.getByLabel("First name").fill("Prof");
    await page.getByLabel("Last name").fill("Member");
    await page.getByLabel("Email or phone").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByLabel("Confirm password").fill(password);
    await page.getByRole("button", { name: "Create account" }).click();
  }

  async function login(page: Page) {
    await page.goto("/login");
    await page.getByLabel("Email or phone").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Sign in" }).click();
    // Wait for the post-login navigation to settle before the test proceeds
    // (onboarding for an incomplete member, dashboard once submitted).
    await expect(page).toHaveURL(/\/(onboarding|dashboard)/);
  }

  // Fill a given step's fields, then click Next. Assumes the wizard is on
  // that step. Each step's "Next" triggers a background router.refresh()
  // (an RSC re-fetch) that can still be in flight after the step
  // transition itself is visible. Chromium silently tolerates a later
  // navigation cancelling that request; Firefox surfaces it as
  // NS_BINDING_ABORTED on whatever navigation comes next (M10
  // cross-browser finding, 2026-09-13). Waiting for the network to settle
  // at the end of every fillStepN is a test-timing fix, not a product
  // change -- the autosave/refresh behavior itself is correct and
  // unaffected; this only protects tests that navigate (reload, goto,
  // clearCookies+login) immediately after a step transition.
  async function fillStep1(page: Page) {
    await expect(
      page.getByRole("heading", { name: "About you" }),
    ).toBeVisible();
    await page.getByLabel("Location").fill("Dar es Salaam");
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForLoadState("networkidle");
  }

  async function fillStep2(page: Page) {
    await expect(
      page.getByRole("heading", { name: "What do you do?" }),
    ).toBeVisible();
    await page.getByLabel("Primary profession").fill("Mobile Welder");
    await page.getByLabel("Industry").fill("Trade & Technical");
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForLoadState("networkidle");
  }

  async function fillStep3(page: Page) {
    // Step 3 is Experience (Journey 1 order) -- checklist test 4.
    await expect(
      page.getByRole("heading", { name: "Your experience" }),
    ).toBeVisible();
    await page.getByLabel("Employment status").selectOption("SELF_EMPLOYED");
    await page.getByLabel("Years of experience").fill("6");
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForLoadState("networkidle");
  }

  async function fillStep4(page: Page) {
    // Step 4 is Education.
    await expect(
      page.getByRole("heading", { name: "Education" }),
    ).toBeVisible();
    await page.getByLabel("Institution").fill("VETA Dar es Salaam");
    await page.getByLabel("Qualification").fill("Certificate in Welding");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("Certificate in Welding")).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForLoadState("networkidle");
  }

  async function fillStep5(page: Page) {
    await expect(page.getByRole("heading", { name: "Skills" })).toBeVisible();
    await page.getByPlaceholder("Type a skill and press Add").fill("Arc Welding");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(page.getByText("Arc Welding")).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForLoadState("networkidle");
  }

  async function fillStep6(page: Page, { skip = false } = {}) {
    await expect(page.getByRole("heading", { name: "Your CV" })).toBeVisible();
    if (!skip) {
      await page.setInputFiles('input[type="file"]', {
        name: "cv.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4 minimal test pdf"),
      });
      await expect(page.getByText("cv.pdf")).toBeVisible();
    }
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForLoadState("networkidle");
  }

  async function fillStep7(page: Page) {
    await expect(
      page.getByRole("heading", { name: "Availability" }),
    ).toBeVisible();
    await page.getByText("Open to opportunities", { exact: true }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.waitForLoadState("networkidle");
  }

  // ---- 1. Onboarding starts at step 1 for a fresh member ----
  test("registration lands in onboarding at step 1", async ({ page }) => {
    await register(page);
    await expect(page).toHaveURL("/onboarding");
    await expect(page.getByText("Step 1 of 8")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "About you" }),
    ).toBeVisible();
  });

  // ---- 2. Each step autosaves ----
  test("step 1 autosaves; reload resumes at step 2", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL("/onboarding");
    await fillStep1(page);
    await expect(page.getByText("Step 2 of 8")).toBeVisible();

    // Reload -- the server recomputes the resume step from persisted data.
    await page.reload();
    await expect(page.getByText("Step 2 of 8")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "What do you do?" }),
    ).toBeVisible();
  });

  // ---- 3. Resume after abandonment (Stage 13 scenario) ----
  test("abandon after step 3, log back in, resume at step 4", async ({
    page,
  }) => {
    await login(page);
    await fillStep2(page);
    await fillStep3(page);
    await expect(page.getByText("Step 4 of 8")).toBeVisible();

    // Simulate leaving: clear cookies, sign in again. Same
    // background-request-racing class as fillStepN's own fix -- clearing
    // cookies and immediately navigating while a prior request is still
    // settling produces a generic Firefox navigation error (M10
    // cross-browser finding, 2026-09-13); confirming idle first avoids it.
    await page.waitForLoadState("networkidle");
    await page.context().clearCookies();
    await login(page);
    await expect(page).toHaveURL("/onboarding");
    await expect(page.getByText("Step 4 of 8")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Education" }),
    ).toBeVisible();
  });

  // ---- 4. Step order matches Journey 1 (Experience=3, Education=4) ----
  test("step 3 is Experience, step 4 is Education", async ({ page }) => {
    await login(page);
    await expect(page.getByText("Step 4 of 8")).toBeVisible();
    // Already asserted headings in fillStep3/4; this test documents the
    // ordering explicitly by navigating back.
    await page.getByRole("button", { name: "Back" }).click();
    await expect(page.getByText("Step 3 of 8")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Your experience" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next" }).click();
    await expect(page.getByText("Step 4 of 8")).toBeVisible();
  });

  // ---- 5 & 6. CV upload rejects wrong type / oversize ----
  test("CV step rejects a .txt and an oversize file", async ({ page }) => {
    await login(page);
    await fillStep4(page); // now on step 5
    await fillStep5(page); // now on step 6 (CV)
    await expect(page.getByRole("heading", { name: "Your CV" })).toBeVisible();

    await page.setInputFiles('input[type="file"]', {
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello"),
    });
    await expect(
      page.getByText(
        "That file type isn't supported. Upload a PDF, DOC, or DOCX.",
      ),
    ).toBeVisible();

    await page.setInputFiles('input[type="file"]', {
      name: "big.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.alloc(11 * 1024 * 1024, 1),
    });
    await expect(
      page.getByText(
        "That file is too large. Documents must be under 10 MB.",
      ),
    ).toBeVisible();
  });

  // ---- 7. Submission blocked on a missing P0 field (Stage 13) ----
  test("submitting with no CV is blocked and stays REGISTERED", async ({
    page,
  }) => {
    await login(page);
    // On step 6 (CV) from the previous test's progress. Skip the CV, go to 7,
    // set availability, reach review, submit.
    await expect(page.getByRole("heading", { name: "Your CV" })).toBeVisible();
    await fillStep6(page, { skip: true });
    await fillStep7(page);
    await expect(page.getByText("Step 8 of 8")).toBeVisible();
    await page
      .getByRole("button", { name: "Submit for verification" })
      .click();

    await expect(page.getByText(/Add your CV before continuing/i)).toBeVisible();
    // Still in onboarding, not on the dashboard.
    await expect(page).toHaveURL("/onboarding");
  });

  // ---- 8 & 9. Profile reaches Profile Complete; both tracks -> Pending ----
  test("uploading the CV then submitting completes the profile", async ({
    page,
  }) => {
    await login(page);
    // Resume lands on step 6 (CV still missing).
    await expect(page.getByText("Step 6 of 8")).toBeVisible();
    await fillStep6(page); // upload a real (tiny) pdf
    await fillStep7(page);
    await expect(page.getByText("Step 8 of 8")).toBeVisible();
    await page
      .getByRole("button", { name: "Submit for verification" })
      .click();

    await expect(page).toHaveURL("/dashboard");
    // Both verification badges show their Pending form.
    await expect(page.getByText(/Membership — in review/i)).toBeVisible();
    await expect(page.getByText(/Credentials — in review/i)).toBeVisible();
  });

  // ---- 10. Onboarding not re-enterable after completion ----
  test("a completed member visiting /onboarding is redirected", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/onboarding");
    await expect(page).toHaveURL("/dashboard");
  });

  // ---- 11. /profile shows the completed profile with resolved badge copy --
  test("/profile renders the profile and never a bare 'Verified'", async ({
    page,
  }) => {
    await login(page);
    await page.goto("/profile");
    await expect(page.getByText("Mobile Welder")).toBeVisible();
    await expect(page.getByText("Certificate in Welding")).toBeVisible();
    await expect(page.getByText("Arc Welding")).toBeVisible();
    await expect(page.getByText("cv.pdf")).toBeVisible();
    await expect(page.getByText(/Membership — in review/i)).toBeVisible();
    // No standalone "Verified" badge anywhere.
    await expect(page.getByText(/^Verified$/)).toHaveCount(0);
  });

  // ---- 12. Availability toggle is live on the dashboard ----
  test("changing availability on the dashboard persists", async ({ page }) => {
    await login(page);
    await page.goto("/dashboard");
    await page.getByLabel("Not available").check();
    await page.waitForTimeout(500);
    await page.reload();
    await expect(page.getByLabel("Not available")).toBeChecked();
  });

  // ---- 13. Free-text profession is accepted ----
  test("the free-text profession entered at step 2 shows on /profile", async ({
    page,
  }) => {
    // "Mobile Welder" is not in the seed taxonomy; it was entered at step 2
    // and asserted visible on /profile in test 11. This test documents the
    // requirement explicitly.
    await login(page);
    await page.goto("/profile");
    await expect(page.getByText("Mobile Welder")).toBeVisible();
  });
});
