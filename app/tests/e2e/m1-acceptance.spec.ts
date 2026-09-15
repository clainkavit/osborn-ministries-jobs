import { test, expect } from "@playwright/test";

// ============================================================================
// M1 ACCEPTANCE TESTS -- Stage 21 section 30. This suite is the FINAL AUTHORITY
// on whether M1 is finished. Every check below maps to a line in that section.
//
// PREREQUISITES (cannot pass without these):
//   1. A Supabase project, connected via app/.env.local
//   2. Migration app/supabase/migrations/001_initial_schema.sql applied
//   3. At least one row in `members` with role = 'CHURCH_ADMIN' for the
//      admin-path tests (create it in the Supabase dashboard: sign that user
//      up through the app first, then UPDATE members SET role='CHURCH_ADMIN'
//      WHERE email='...').
//   4. The app running (npm run build && npm run start, or npm run dev).
//
// Run: npm run test:e2e
//
// Until the Supabase project exists these are skipped, not failing -- see the
// test.skip guard. That is deliberate: a red suite that can't be run yet is
// noise. Remove the guard once .env.local is real.
// ============================================================================

const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "REPLACE_ME";

// Serial: later tests (login, duplicate-email, logout) depend on the account
// created by the first registration test. The config sets fullyParallel, so
// this override is what keeps the ordering.
test.describe.configure({ mode: "serial" });

test.describe("M1 acceptance", () => {
  test.skip(!HAS_SUPABASE, "Supabase project not connected -- see .env.local");

  // Unique per run so re-runs don't collide on the duplicate-email check.
  const stamp = Date.now();
  const memberEmail = `m1-member-${stamp}@m1test.com`;
  const password = "correcthorse9";

  test.describe("Registration (section 30)", () => {
    test("a new member can register and enters onboarding", async ({ page }) => {
      // Journey 1 step 3: registration leads straight into the 8-step
      // onboarding. (M1's earlier draft asserted /dashboard; corrected once
      // M2 made onboarding real.)
      await page.goto("/register");
      await page.getByLabel("First name").fill("Test");
      await page.getByLabel("Last name").fill("Member");
      await page.getByLabel("Email or phone").fill(memberEmail);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByLabel("Confirm password").fill(password);
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(page).toHaveURL("/onboarding");
      await expect(page.getByText("Step 1 of 8")).toBeVisible();
    });

    test("weak password is rejected inline", async ({ page }) => {
      await page.goto("/register");
      await page.getByLabel("First name").fill("Weak");
      await page.getByLabel("Last name").fill("Pass");
      await page.getByLabel("Email or phone").fill(`weak-${stamp}@m1test.com`);
      await page.getByLabel("Password", { exact: true }).fill("short");
      await page.getByLabel("Confirm password").fill("short");
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(
        page.getByText("Password must contain at least 8 characters."),
      ).toBeVisible();
      await expect(page).toHaveURL("/register");
    });

    test("password confirmation mismatch is rejected inline", async ({ page }) => {
      await page.goto("/register");
      await page.getByLabel("First name").fill("Mismatch");
      await page.getByLabel("Last name").fill("Pass");
      await page.getByLabel("Email or phone").fill(`mismatch-${stamp}@m1test.com`);
      await page.getByLabel("Password", { exact: true }).fill("correcthorse9");
      await page.getByLabel("Confirm password").fill("differenthorse9");
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(page.getByText("Passwords do not match.")).toBeVisible();
    });

    test("duplicate email is rejected", async ({ page }) => {
      // memberEmail was registered in the first test.
      await page.goto("/register");
      await page.getByLabel("First name").fill("Dup");
      await page.getByLabel("Last name").fill("Licate");
      await page.getByLabel("Email or phone").fill(memberEmail);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByLabel("Confirm password").fill(password);
      await page.getByRole("button", { name: "Create account" }).click();

      await expect(
        page.getByText(/already exists|Sign in instead/i),
      ).toBeVisible();
    });
  });

  test.describe("Login + logout (section 30)", () => {
    // The member registered above never completed onboarding, so
    // postAuthDestination sends them to /onboarding (Journey 1) -- this is
    // correct behaviour, updated once M2 made onboarding real.
    test("valid credentials sign the member in", async ({ page }) => {
      await page.goto("/login");
      await page.getByLabel("Email or phone").fill(memberEmail);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL(/\/(onboarding|dashboard)/);
    });

    test("invalid credentials fail with the standard message", async ({ page }) => {
      await page.goto("/login");
      await page.getByLabel("Email or phone").fill(memberEmail);
      await page.getByLabel("Password", { exact: true }).fill("wrongpassword");
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page.getByText("Incorrect email or password.")).toBeVisible();
    });

    test("logout ends the session and protected pages redirect to login", async ({ page }) => {
      await page.goto("/login");
      await page.getByLabel("Email or phone").fill(memberEmail);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL(/\/(onboarding|dashboard)/);

      await page.getByRole("button", { name: /Sign out/ }).click();
      await expect(page).toHaveURL("/login");

      await page.goto("/dashboard");
      await expect(page).toHaveURL("/login");
    });
  });

  test.describe("Route protection (section 30 Security)", () => {
    test("an unauthenticated user cannot reach a protected route", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page).toHaveURL("/login");
    });

    test("a plain member cannot reach the admin area", async ({ page }) => {
      await page.goto("/login");
      await page.getByLabel("Email or phone").fill(memberEmail);
      await page.getByLabel("Password", { exact: true }).fill(password);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL(/\/(onboarding|dashboard)/);

      // Server-side redirect, not just hidden nav -- Stage 21 section 14.
      // A plain member hitting /admin/* is bounced to /dashboard.
      await page.goto("/admin/dashboard");
      await expect(page).toHaveURL("/dashboard");

      await page.goto("/admin/verification");
      await expect(page).toHaveURL("/dashboard");
    });
  });

  test.describe("Password reset (section 30)", () => {
    test("the reset request shows the non-committal confirmation", async ({ page }) => {
      await page.goto("/forgot-password");
      await page.getByLabel("Email").fill(memberEmail);
      await page.getByRole("button", { name: "Send reset link" }).click();
      await expect(page.getByTestId("reset-sent")).toBeVisible();
    });
    // Completing the reset requires clicking the emailed link -- covered
    // manually or with a mail-catcher in CI, out of scope for this file.
  });

  test.describe("Admin path (section 30) -- needs a CHURCH_ADMIN row", () => {
    // Same CHURCH_ADMIN account/env-var pair every other milestone's admin
    // tests already use (see m3/m7/m8/m9-acceptance.spec.ts) -- M1_ADMIN_*
    // was a leftover, never-populated naming mismatch, not a missing
    // credential.
    const adminEmail = process.env.M3_ADMIN_EMAIL;
    const adminPassword = process.env.M3_ADMIN_PASSWORD;

    test.skip(
      !adminEmail || !adminPassword,
      "Set M3_ADMIN_EMAIL / M3_ADMIN_PASSWORD to a CHURCH_ADMIN account",
    );

    test("an admin reaches the admin dashboard", async ({ page }) => {
      await page.goto("/admin/login");
      await page.getByLabel("Email").fill(adminEmail!);
      await page.getByLabel("Password", { exact: true }).fill(adminPassword!);
      await page.getByRole("button", { name: "Sign in" }).click();
      await expect(page).toHaveURL("/admin/dashboard");
      await expect(
        page.getByRole("heading", { name: /Welcome to the Professional Network/ }),
      ).toBeVisible();
    });
  });
});
