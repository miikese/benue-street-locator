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
