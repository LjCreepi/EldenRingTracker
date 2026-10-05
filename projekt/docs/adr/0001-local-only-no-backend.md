# Local-only persistence, no backend

## Context

The tracker was initially conceived with user accounts and cross-device sync
(Supabase Auth + Postgres). It is being built as an ÜK 335 project: four course
days, six or more releases, and a hard requirement that every release is deployed
and error-free. The only data to persist is a few hundred to a few thousand
completion booleans per character plus a small preferences object.

## Decision

No backend for the duration of the ÜK. All state is persisted in `localStorage`,
behind a `StorageService` interface. A single implicit "Main" character is
modelled so completion records already carry a `characterId`.

## Why

- Building and hardening auth + sync inside four days is the single biggest threat
  to the "deployed and error-free" criterion; cutting it removes that risk.
- The persistence requirement is met fully by `localStorage`: synchronous, trivial
  to unit-test, and far below its size limit for this data.
- Accounts add no value while the app tracks one person on one device.

## Consequences

- No cross-device sync. Clearing site data loses progress.
- `localStorage` holds strings only and has no query capability — acceptable at
  this scale, mitigated by keeping all access behind `StorageService`.
- Swapping in IndexedDB or a Supabase-backed implementation later touches only
  that one service, not its callers. The `characterId` on completion records
  keeps the multi-character model open.
