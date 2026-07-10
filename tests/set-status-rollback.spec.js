// Test 4: a failed gb_set_status RPC rolls the optimistic UI mutation back
// and shows a toast, instead of silently leaving the UI in a stale state.
const { test, expect } = require('@playwright/test');
const { loginWithMockSession } = require('./helpers/mockSupabase');

test.describe('setStatus rollback on RPC failure', () => {
  test('reverts the check + status and shows a toast when the RPC fails', async ({ page }) => {
    await loginWithMockSession(page, { rpcFails: true });

    // t-crit-1 is the first Critical card in the fixture and starts unread.
    const check = page.locator('[data-act="toggle"][data-id="t-crit-1"]');
    await expect(check).toBeVisible();
    await expect(check).not.toHaveClass(/\bon\b/);

    await check.click();

    // The RPC failure rejects, setStatus() reverts the mutation and toasts.
    const toast = page.locator('#toast');
    await expect(toast).toHaveText('Could not save. Change reverted.');
    await expect(toast).toHaveClass(/\bshow\b/);

    // Final state: reverted, not stuck showing "done".
    await expect(check).not.toHaveClass(/\bon\b/);
  });

  test('control: a successful RPC keeps the optimistic change', async ({ page }) => {
    // Same flow with rpcFails: false (default) proves the toggle mechanism
    // itself works and isn't just permanently stuck "off" for another reason.
    // NOTE: on success the item becomes status=resolved, so renderApp() drops
    // it out of the "All" tab entirely (All only lists non-resolved items) -
    // assert it lands, checked, on the Done tab instead.
    await loginWithMockSession(page, { rpcFails: false });

    await page.locator('[data-act="toggle"][data-id="t-crit-1"]').click();
    await expect(page.locator('#toast')).not.toHaveClass(/\bshow\b/);
    await expect(page.locator('[data-act="toggle"][data-id="t-crit-1"]')).toHaveCount(0);

    await page.locator('#tabs [data-tab="done"]').click();
    const doneCheck = page.locator('[data-act="toggle"][data-id="t-crit-1"]');
    await expect(doneCheck).toBeVisible();
    await expect(doneCheck).toHaveClass(/\bon\b/);
  });
});
