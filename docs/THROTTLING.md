# Authentication throttling — version 0.2.4

Configured auth routes now apply a bounded process-local token bucket before reading a body or invoking Firebase. Invalid methods/origins are rejected before consuming the accepted-origin budget. No email address, provider UID or cookie is used as an unverified rate-limit identity.

| Bucket | Burst capacity | Refill |
| --- | --- | --- |
| Login/session exchange per transport peer | 12 | 12 per minute |
| Session restore per transport peer | 120 | 120 per minute |
| Profile completion per transport peer | 20 | 20 per minute |
| Logout per transport peer | 12 | 12 per minute |
| All accepted auth requests, process-wide | 240 | 240 per minute |

At most eight auth operations are admitted concurrently. Capacity is released in finally, including failed requests. At most 1,024 transport-peer entries are retained; stale entries are cleaned when necessary. When full, unknown peers are rejected instead of evicting active counters. A monotonic clock drives refill; no database or personal identifiers are stored by this limiter.

Excess requests receive HTTP 429 with Retry-After seconds and no provider call. The client displays a wait-and-retry message; it does not retry automatically. Health/static routes are unaffected. A login bucket cannot consume the separate logout bucket, but process-wide/concurrency limits necessarily apply to both.

## Deployment limits
This is an application-process guard, not a distributed abuse-prevention system. Counters reset on process restart and are separate in multiple instances. Socket remoteAddress is the peer key; X-Forwarded-For and similar client-supplied headers are deliberately ignored. With a local reverse proxy, clients share the proxy’s bucket. Before public hosting, configure and test per-client throttling/body/time limits at the trusted HTTPS proxy and revisit these small-service defaults. Do not blindly trust forwarded headers to get individual client addresses.

Firebase email/password signup and reset are browser-to-provider operations. This API limiter protects Comos session/profile endpoints, not the provider endpoints themselves. Firebase’s provider-side controls and actual configured project behavior still require review. No claim of production-scale load testing or complete abuse protection is made.

## Verified
Tests cover refill, peer/operation isolation, concurrency, global limits against rotating peers, bounded map behavior, Retry-After, forged forwarded headers, rejected Origin, release after errors, and client handling without automatic retries. Tests use synthetic services and a controlled clock; no live authentication traffic was sent.
