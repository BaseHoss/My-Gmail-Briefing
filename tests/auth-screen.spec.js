// Test 1: an unauthenticated visitor sees the OTP auth screen, not the app.
const { test, expect } = require('@playwright/test');

test.describe('unauthenticated render', () => {
  test('shows the OTP auth screen and not the app view', async ({ page }) => {
    // No session seeded, no routes mocked: with an empty localStorage, the app's
    // boot() resolves getSession() -> null purely from local state (no network
    // call needed), so this deliberately exercises the real cold-boot path.
    await page.goto('/');

    await expect(page.locator('#loginView')).toBeVisible();
    await expect(page.locator('#appView')).toBeHidden();

    // The email step is the default; the code step is hidden until a code is sent.
    await expect(page.locator('#emailStep')).toBeVisible();
    await expect(page.locator('#codeStep')).toBeHidden();

    await expect(page.locator('#emailInput')).toBeVisible();
    await expect(page.locator('#sendBtn')).toHaveText('Email me a code');
    await expect(page.locator('#codeInput')).toHaveAttribute('maxlength', '8');
  });
});
