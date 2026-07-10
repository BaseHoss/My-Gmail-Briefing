// Route-mocking helpers for the Dawnline / My Gmail Briefing app.
// The app talks to Supabase directly from the browser (Option A architecture -
// no server-side rebuild), so tests intercept the REST/RPC calls with
// page.route() and never touch the real project.
const ITEMS_FIXTURE = require('../fixtures/triage-items.json');
const RUNS_FIXTURE = require('../fixtures/daily-runs.json');

/**
 * Mocks the two read queries (gb_triage_items, gb_daily_runs) and the
 * gb_set_status RPC. Must be called BEFORE page.goto().
 * @param {import('@playwright/test').Page} page
 * @param {object} [opts]
 * @param {any[]} [opts.items] - overrides the default fixture
 * @param {any[]} [opts.runs] - overrides the default fixture
 * @param {number} [opts.delayMs] - delay before fulfilling the read queries (for loading-state tests)
 * @param {boolean} [opts.rpcFails] - if true, gb_set_status responds with an error
 */
async function mockLedger(page, opts = {}) {
  const items = opts.items || ITEMS_FIXTURE;
  const runs = opts.runs || RUNS_FIXTURE;
  const delayMs = opts.delayMs || 0;

  await page.route('**/rest/v1/gb_triage_items*', async (route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(items) });
  });

  await page.route('**/rest/v1/gb_daily_runs*', async (route) => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(runs) });
  });

  await page.route('**/rest/v1/rpc/gb_set_status*', async (route) => {
    if (opts.rpcFails) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'mocked RPC failure', code: 'MOCK500' }),
      });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
    }
  });

  // Defensive: never let a real network call to Supabase auth escape the mock
  // (avoids CI depending on real network / real credentials).
  await page.route('**/auth/v1/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
}

/**
 * Builds a Supabase v2 Session object that looks valid (far-future expiry so
 * GoTrueClient never attempts a real network refresh during a test).
 */
function buildMockSession(email = 'bassem.hoss17@gmail.com') {
  const nowSec = Math.floor(Date.now() / 1000);
  return {
    access_token: 'mock-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: nowSec + 3600,
    refresh_token: 'mock-refresh-token',
    user: {
      id: 'mock-user-id',
      aud: 'authenticated',
      role: 'authenticated',
      email,
      email_confirmed_at: new Date().toISOString(),
      app_metadata: { provider: 'email', providers: ['email'] },
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
}

/**
 * Logs a page in without touching real Supabase auth:
 * 1. Mocks the ledger routes (call mockLedger separately first if you need
 *    custom opts - this function calls it with defaults if not already mocked).
 * 2. Navigates once (unauthenticated) so the app's `db` client exists, then
 *    reads db.auth.storageKey directly from the page - this is the exact key
 *    the installed supabase-js version computes, so there is no guessing at
 *    a version-specific format.
 * 3. Seeds localStorage with a mock session under that key and reloads.
 * 4. Waits for #appView to become visible.
 */
async function loginWithMockSession(page, mockOpts = {}) {
  await mockLedger(page, mockOpts);
  await page.goto('/');
  // NOTE: `db` is a top-level `const` inside the app's classic <script> tag, so
  // it lives in the script's lexical scope, NOT as a `window.db` property.
  // Evaluated code shares that scope, so reference it unqualified.
  await page.waitForFunction(() => typeof db !== 'undefined' && !!db.auth);

  const storageKey = await page.evaluate(() => db.auth.storageKey);
  if (!storageKey) {
    throw new Error('Could not read db.auth.storageKey from the page - supabase-js internals may have changed.');
  }

  const session = buildMockSession();
  await page.evaluate(
    ([key, val]) => window.localStorage.setItem(key, val),
    [storageKey, JSON.stringify(session)]
  );

  await page.reload();
  await page.locator('#appView').waitFor({ state: 'visible' });
}

module.exports = { mockLedger, buildMockSession, loginWithMockSession, ITEMS_FIXTURE, RUNS_FIXTURE };
