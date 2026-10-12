# Security review

Authentication comes from trusted Sites dispatch; hosted identity headers are
not accepted directly from an untrusted public reverse proxy. The local companion
binds 127.0.0.1, validates Host, and implements an explicitly documented test identity
with random, HttpOnly, SameSite sessions. Its sign-in is not for public hosting.

Authorization is server-side: pending records are owner/moderator-only; public
responses omit owner IDs; mutation endpoints require identity; moderation requires
an explicit allowlist or database moderator role. Cross-origin mutations are
rejected. Bodies are bounded as they are read; JSON and uploaded images are size-
limited. SQL uses bound parameters. HTML content is rendered as React text.

Uploads accept only JPEG/PNG/WebP with matching magic headers; SVG/HTML are rejected.
The provided browser uploader re-encodes images to strip EXIF metadata. Images are
served with nosniff and a restrictive document CSP. Submissions require moderation
before public display. A deployment must add server-side re-encoding/scanning
before allowing unknown API clients to upload photos at large scale.

Write rate limits are database-backed. Routes use a shared bounded routing quota.
No child, private-home or emergency contact information is imported.
Account deletion removes owned records, associated activity, photos and notifications,
and anonymizes remaining audit actor references. Host backups have their own retention.

Potential follow-up hardening: server-side image sanitization; strict CSP compatible
with the framework; moderation response/body redaction workflows; abuse escalation;
formal backup/retention controls; smaller paging than the initial 1,000-record cap.

## Dependency audit checkpoint

This phase applies the tested runtime patch updates used by the other independent
apps: Next.js 16.3.8, React/React DOM/React Server DOM 19.2.8, Vite 8.0.16 and
patched sharp, source-map-js, image-size, undici and ws dependencies. Commit the
independent lockfile and verify with a clean npm ci. Production and full-toolchain
audit outcomes are recorded in PROGRESS.md. Development glob/parser dependencies
remain a release-review task; do not imply a fully clean build toolchain.

Verified on 12 October 2026: `npm audit --omit=dev` reports 0 findings.
Full `npm audit` reports 19 findings: 11 high, 5 moderate and 3 low.
Remaining chains include glob/brace parsing, Drizzle’s legacy esbuild loader,
and framework build tooling. An automatic major downgrade is not an acceptable
fix; a supported toolchain migration and separate compatibility review remain open.
