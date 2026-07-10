// Test 3: the .spinner loading state is visible in #main before the first
// loadData() call resolves, then replaced by real content once it does.
const { test, expect } = require('@playwright/test');
const { loginWithMockSession } = require('./helpers/mockSupabase');

test.describe('loading state', () => {
  test('spinner shows before first load resolves, then is replaced', async ({ page }) => {
    // Delay the mocked Supabase responses so there's a real window in which
    // the app has authenticated (appView visible) but data hasn't arrived yet.
    await loginWithMockSession(page, { delayMs: 1200 });

    // Right after appView appears, showApp() has already rendered the spinner
    // into #main because loadData() has not resolved yet.
    const spinner = page.locator('#main .spinner');
    await expect(spinner).toBeVisible();
    // Confirm it's actually the CSS spinner, not a placeholder - it should
    // report a non-zero box (the animated ring), not a collapsed element.
    const box = await spinner.boundingBox();
    expect(box).not.toBeNull();
    expect(box.width).toBeGreaterThan(0);
    expect(box.height).toBeGreaterThan(0);

    // Once the delayed fixture data resolves, the spinner is replaced by real
    // cards and the header count updates.
    await expect(page.locator('#main .spinner')).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('#main .card').first()).toBeVisible();
    await expect(page.locator('#hdrSub')).not.toHaveText('Loading...');
  });
});
