// Test 5 (from kickoff scope): "offline: SW serves the cached shell (register
// SW, go offline via context, reload)."
//
// SKIPPED, not deleted: as of this test suite, index.html registers NO
// service worker (no `navigator.serviceWorker.register(...)` anywhere in the
// app) and the repo has no sw.js. A previous session's PWA/offline scope was
// blocked on Bassem uploading the Phase B PNG icon set and was never
// completed (see Handoff_Gmail-Briefing-App.md). This session's rules forbid
// changing index.html, so there is no real SW to test yet.
//
// Writing a test-only SW here (unregistered by the app) would only prove
// Playwright's offline mechanics work, not that the PRODUCTION app has
// offline support - that would be a misleading green check. Skipping instead
// of faking a pass. Un-skip this once a real SW ships in the app, updating
// the register-then-reload flow below to match whatever the app actually
// registers.
const { test, expect } = require('@playwright/test');

test.describe('offline shell (service worker)', () => {
  test.use({ serviceWorkers: 'allow' });

  test.skip(
    true,
    'No service worker exists in production index.html yet - see file header. Blocked on Phase B icon upload + a future SW build; nothing to test until then.'
  );

  test('a registered SW serves the cached shell when offline', async ({ page, context }) => {
    // Intended shape for when a real SW ships (kept here so un-skipping this
    // test is a one-line change, not a rewrite):
    // 1. await page.goto('/');
    // 2. await page.evaluate(() => navigator.serviceWorker.register('/sw.js'));
    // 3. await page.waitForFunction(() => navigator.serviceWorker.controller);
    // 4. await context.setOffline(true);
    // 5. await page.reload();
    // 6. assert the cached shell renders (e.g. #loginView or #appView visible,
    //    not a browser offline error page) and an "offline - last updated"
    //    banner is shown per the SW scope's offline-fallback requirement.
    expect(true).toBe(true);
  });
});
