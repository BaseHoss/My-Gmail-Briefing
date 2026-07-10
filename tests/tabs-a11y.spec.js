// Test 2: with a mocked session, tabs switch and carry role=tab / aria-selected.
//
// Expected counts below are HARDCODED against tests/fixtures/triage-items.json
// on purpose, not recomputed from the fixture at test time - recomputing from
// the same file the app renders from would make the assertion tautological
// (it would still "pass" against a corrupted fixture, since both sides would
// agree on the wrong number). If the fixture's category/status values change,
// these constants must be updated to match, and that update IS the fixture's
// deliberately-broken-fixture check.
const { test, expect } = require('@playwright/test');
const { loginWithMockSession } = require('./helpers/mockSupabase');

const EXPECTED_CRITICAL_COUNT = 2; // t-crit-1, t-crit-2
const EXPECTED_DONE_COUNT = 1; // t-done-1

test.describe('tab navigation + a11y attributes', () => {
  test('tabs switch content and carry role=tab / aria-selected', async ({ page }) => {
    await loginWithMockSession(page);

    const tabs = page.locator('#tabs');
    await expect(tabs).toHaveAttribute('role', 'tablist');

    const tabButtons = tabs.locator('.tab');
    await expect(tabButtons).toHaveCount(6);

    // Every tab button carries role=tab.
    const roles = await tabButtons.evaluateAll((els) => els.map((e) => e.getAttribute('role')));
    expect(roles).toEqual(['tab', 'tab', 'tab', 'tab', 'tab', 'tab']);

    // "All" is active by default.
    await expect(tabs.locator('[data-tab="all"]')).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.locator('[data-tab="critical"]')).toHaveAttribute('aria-selected', 'false');

    await expect(tabs.locator('[data-tab="critical"] .pill')).toHaveText(String(EXPECTED_CRITICAL_COUNT));

    // Switch to Critical: aria-selected flips, exactly the critical items render.
    await tabs.locator('[data-tab="critical"]').click();
    await expect(tabs.locator('[data-tab="critical"]')).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.locator('[data-tab="all"]')).toHaveAttribute('aria-selected', 'false');
    await expect(page.locator('#main .card')).toHaveCount(EXPECTED_CRITICAL_COUNT);

    // Switch to Calendar: no cards, calendar grid renders with nav aria-labels.
    await tabs.locator('[data-tab="calendar"]').click();
    await expect(tabs.locator('[data-tab="calendar"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('.cal-grid')).toBeVisible();
    await expect(page.locator('[data-cal-nav="-1"]')).toHaveAttribute('aria-label', 'Previous month');
    await expect(page.locator('[data-cal-nav="1"]')).toHaveAttribute('aria-label', 'Next month');

    // Switch to Done: only resolved items render.
    await tabs.locator('[data-tab="done"]').click();
    await expect(tabs.locator('[data-tab="done"]')).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('#main .card')).toHaveCount(EXPECTED_DONE_COUNT);
  });

  test('toast element exposes aria-live=polite', async ({ page }) => {
    await loginWithMockSession(page);
    await expect(page.locator('#toast')).toHaveAttribute('aria-live', 'polite');
  });
});
