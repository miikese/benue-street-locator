# Executed validation

- 20 Vitest unit/API tests pass against a real in-memory SQLite database using the
  committed migration. Coverage includes authentication, origin checks, validation,
  pending-record privacy, moderator-only approval, history, notifications,
  favorites, account deletion, rate limits, LGA filters and distance calculations.
- TypeScript strict type check passes.
- ESLint on authored application, API, tests and local runner passes.
- Both the local production build and hosted Worker build complete.
- Python Playwright checks the actual built application on desktop and a 390px
  mobile viewport: search, local sign-in, private submission, UI moderation,
  favorite persistence, generated PNG QR, temporary-data cleanup, mobile navigation,
  horizontal overflow and sign-out. No browser JavaScript errors were observed.
- Actual screenshots: screenshots/desktop.png and screenshots/mobile.png.

Run browser checks after starting the lightweight runner:

```sh
python3 -m pip install playwright
python3 -m playwright install chromium
python3 scripts/e2e.py
```

A system Chrome can be used with PLAYWRIGHT_CHROMIUM_EXECUTABLE.
External tiles and routing are best-effort services; a route outage is an expected
graceful fallback, not a fabricated successful navigation test.
Hosted ChatGPT sign-in and external data providers have not been simulated as
production successes by the local development account.
