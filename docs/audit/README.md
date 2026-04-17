# Audit reports

Point-in-time audit of the Fain si Punct codebase across 20 viewpoints,
run on **2026-04-16** against `origin/main` @ `59bd599` (post PR #8).
Seven agents worked in parallel against a fresh worktree; consolidated
findings live in `AUDIT.md`.

## Files

| File | Scope |
|---|---|
| [AUDIT.md](AUDIT.md) | Dashboard — grades, top-10 critical, top-10 high, severity counts, remediation order |
| [01-security.md](01-security.md) | Security · payments integrity · compliance (GDPR + RO consumer law) |
| [02-performance-db.md](02-performance-db.md) | Frontend + API performance · database design & queries |
| [03-seo-a11y-i18n.md](03-seo-a11y-i18n.md) | SEO · accessibility (WCAG 2.1 AA) · Romanian localization |
| [04-ux-ui-mobile-cro.md](04-ux-ui-mobile-cro.md) | UX / user flow · UI / visual design · mobile & responsive · CRO |
| [05-code-quality-api.md](05-code-quality-api.md) | Code quality & maintainability · API design |
| [06-testing-errors.md](06-testing-errors.md) | Testing strategy & coverage · error handling & resilience |
| [07-ops-deps.md](07-ops-deps.md) | Observability · admin / operational tooling · DevOps / CI-CD · dependency hygiene |

## Status of the remediation

Four PRs landed the audit's critical + high items:

- **#9** — Phase 1: deps upgrade, Stripe SDK, timeouts, rate-limit fail-closed, env validator, i18n-errors, error-handler, perf indexes, home SSR, a11y, locale.
- **#10** — Phase 2: `lib/supabase-queries.js` split, route migration to `apiError`/`handleApiError`, design tokens, Romanian FAQ.
- **#13** — Phase 3: refund workflow (14-day OUG 34/2014), GDPR right-to-erasure + DSAR, cookie consent, xlsx guards, Sentry scaffold, legal pages aligned.
- **#14** — Phase 4: admin review moderation + customer lookup, free-shipping banner, search autocomplete, cart "Frecvent cumparate impreuna", 5 Playwright smokes.

Remaining open items (paypal/revolut refund automation, cart-abandon email, PDP social-proof snippets, full CI wiring for Playwright) are tracked in the next follow-up PR that bundles reviewer feedback with residual audit findings.

Reports are a point-in-time artifact — not a spec. If you disagree with a
finding, the detail file cites the relevant file:line so you can push
back with evidence.
