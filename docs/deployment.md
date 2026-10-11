# Deployment

The hosted application uses Vinext's Cloudflare Worker adapter and the maintained
Sites build integration. It does not require a paid mapping API.

1. `npm ci`.
2. Declare `d1: "DB"` and `r2: "BUCKET"` in .openai/hosting.json.
3. Configure ADMIN_USER_IDS or ADMIN_EMAILS through the host's runtime secrets.
   Choose trusted moderators explicitly. Platform user IDs are Site-specific.
4. Optionally configure ROUTING_URL with an OSRM-compatible driving endpoint.
5. `npm run typecheck && npm test && npm run build`.
6. The connected Sites source helper pushes source and packages the build.
   Sites applies the committed Drizzle schema migrations and provisions D1/R2.
7. Publish the exact pushed commit and archive. New Sites are private by default.
8. Check `/api/health`, sign-in, submission and moderator workflows.

For conventional hosting, the lightweight companion is deliberately loopback-only
and uses development sign-in; **do not expose it as a public production server**.
Use the Worker build with trusted dispatch authentication. The full source is
in the independent GitHub repository.

## Framework preview database

After building, apply each unapplied Drizzle SQL file in order:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_romantic_kitty_pryde.sql
node scripts/seed.mjs
```

These operate only on Wrangler's local preview database. The lightweight companion
uses a separate SQLite database and records migrations before applying them.
Never put seeds or personal data into schema migrations. The OSM seed snapshot
is separate; its imports are idempotent by source ID.

Production data backups, data retention policy, recovery drills and operational
monitoring should be established before a broad public launch.
