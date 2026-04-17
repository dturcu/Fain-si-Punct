# Fain si Punct — 20-Viewpoint Codebase Audit

**Date:** 2026-04-16
**Branch audited:** `origin/main` @ `59bd599` (post-merge of PR #8)
**Worktree:** `.claude/worktrees/audit-main`
**Stack:** Next.js 15 App Router · React 19 · Supabase · Upstash Redis · Stripe / PayPal / Revolut · Oblio · Sameday · Vercel

---

## Grade dashboard

| # | Viewpoint | Grade | Detail |
|---|---|---|---|
| 1 | Security | C | [01-security.md](01-security.md) |
| 2 | Payment integrity | C | [01-security.md](01-security.md) |
| 3 | Compliance (GDPR + RO consumer law) | D | [01-security.md](01-security.md) |
| 4 | Frontend + API performance | D+ | [02-performance-db.md](02-performance-db.md) |
| 5 | Database design & queries | C | [02-performance-db.md](02-performance-db.md) |
| 6 | SEO | C+ | [03-seo-a11y-i18n.md](03-seo-a11y-i18n.md) |
| 7 | Accessibility (WCAG 2.1 AA) | C | [03-seo-a11y-i18n.md](03-seo-a11y-i18n.md) |
| 8 | Romanian localization | D+ | [03-seo-a11y-i18n.md](03-seo-a11y-i18n.md) |
| 9 | UX / user flow | C+ | [04-ux-ui-mobile-cro.md](04-ux-ui-mobile-cro.md) |
| 10 | UI / visual design | B− | [04-ux-ui-mobile-cro.md](04-ux-ui-mobile-cro.md) |
| 11 | Mobile & responsive | B | [04-ux-ui-mobile-cro.md](04-ux-ui-mobile-cro.md) |
| 12 | CRO / conversion | C | [04-ux-ui-mobile-cro.md](04-ux-ui-mobile-cro.md) |
| 13 | Code quality / maintainability | C+ | [05-code-quality-api.md](05-code-quality-api.md) |
| 14 | API design | D+ | [05-code-quality-api.md](05-code-quality-api.md) |
| 15 | Testing strategy | D+ | [06-testing-errors.md](06-testing-errors.md) |
| 16 | Error handling & resilience | C | [06-testing-errors.md](06-testing-errors.md) |
| 17 | Observability / monitoring | D | [07-ops-deps.md](07-ops-deps.md) |
| 18 | Admin / operational tooling | D+ | [07-ops-deps.md](07-ops-deps.md) |
| 19 | DevOps / CI-CD | C− | [07-ops-deps.md](07-ops-deps.md) |
| 20 | Dependency hygiene | C | [07-ops-deps.md](07-ops-deps.md) |

**Overall:** The platform is **production-capable but fragile**. Core transactional flows work and main-branch security posture is better than the previous analysis suggested (11 of 12 security items were already fixed before PR #8). The weakest axes are compliance (no refund / right-to-erasure / consent flows), observability (console-only, Sentry stubbed), testing (zero integration tests), and localization (English errors leaking into Romanian UI).

---

## Top 10 critical items (blocking for Romanian launch or safe scale)

> **⚠ Items marked with an arrow need verification before action — the audit agents flagged them based on file names / call sites; confirm by reading the actual handler.**

1. **No refund / returns workflow** despite "retur 30 zile" marketing — violates OUG 34/2014 (14-day statutory right). No `returns` table, no `/api/orders/[id]/return`, no admin UI. `refundPayment()` in `lib/stripe.js` exists but is never called.
2. **No right-to-erasure (GDPR Art. 17)** — no `/api/account/delete`. Privacy policy claims it but it's not implemented.
3. **No cookie consent banner** — `/cookies` page exists but no opt-in UI.
4. **Active CVEs in dependencies**: `nodemailer ≤8.0.4` (SMTP command injection), `xlsx` (Prototype Pollution/ReDoS, no upstream fix), Next 15.x patch window. Run `npm audit`, upgrade nodemailer, replace xlsx with `exceljs`.
5. ⚠ **Webhook signature verification** — agent reports redundant/loose Stripe verification and IPN/Webhooks-API confusion on PayPal. Verify [app/api/webhooks/stripe/route.js](app/api/webhooks/stripe/route.js) (if exists) and the PayPal handler before trusting them with money.
6. ⚠ **Amount tampering surface in checkout** — client passes `p_total` to `process_checkout` RPC. Verify [supabase/checkout.sql](supabase/checkout.sql) recomputes total from `p_items` and ignores/asserts `p_total`.
7. **No idempotency on Stripe payment intent creation** — [app/api/payments/create-intent/route.js:79-86](app/api/payments/create-intent/route.js:79-86). Network retry → duplicate intents.
8. **Pre-existing bug in Stripe handler**: [app/api/payments/create-intent/route.js:84](app/api/payments/create-intent/route.js:84) references `auth` out of scope inside `handleStripePayment(order)` — `ReferenceError` on any Stripe checkout. (Already flagged as side-task.)
9. **Payment amount column is INTEGER** — [supabase/schema.sql:194](supabase/schema.sql:194). ⚠ May be intentional for Stripe's cents convention; verify before migrating to NUMERIC(12,2). If the app stores RON cents, keep INTEGER but document; if it stores RON units, this is a precision bug.
10. **Rate limiter fails open on Redis outage** for `/api/auth/login` — [middleware.js:38-48](middleware.js:38-48). Redis down = brute-force window. Fail-closed for login/payment routes.

---

## Top 10 high-leverage fixes (do within a month)

11. **Remove `'use client'` from home + product listing pages** — [app/page.js:1](app/page.js:1), [app/products/page.js:1](app/products/page.js:1). Enables SSR/ISR → 30-40% faster FCP.
12. **Translate FAQ + centralize API error messages in Romanian** — [app/faq/page.js](app/faq/page.js) is entirely English; 15+ API routes return English error strings. Introduce `lib/i18n-errors.js`.
13. **Split `lib/supabase-queries.js`** (568 LOC, 20+ exports) into `users-queries.js`, `orders-queries.js`, `cart-queries.js`.
14. **Add integration tests** for checkout + payment + review DELETE IDOR. Zero integration coverage today; 65 tests are all unit.
15. **Ship Sentry + structured logging** — `lib/monitoring.js` is stubbed, no alerts fire on payment failures, webhook 500s, cron failures.
16. **Expand audit logging** — `logAuditEvent` only wired to login/register. Add payment events, admin actions, password reset, review moderation, order status transitions.
17. **Add `AbortSignal.timeout()` on all external calls** — Stripe/PayPal/Supabase/Sameday/Oblio currently unbounded.
18. **Product detail page: fix LCP** — remove `unoptimized`, add `priority`, combine the 3 fetch waterfalls into one endpoint.
19. **Add composite indexes** for product filters (`idx_products_category_stock`, `idx_products_category_price_stock`); add filtered index for email_logs retry.
20. **Replace emoji payment icons with SVG brand logos** on checkout — [app/checkout/page.js:9-34](app/checkout/page.js:9-34). Currently 🎰/🔄/🅿️/📦.

---

## Medium-priority cluster (within a quarter)

- **Admin tooling gaps**: review moderation UI, customer support lookup, bulk price/stock edits, low-stock alerts.
- **CRO**: social proof on PDP, "Frequently Bought Together" on cart, shipping threshold banner site-wide, VAT clarity, low-stock badge, cart-abandonment email, search autocomplete.
- **Mobile**: stack checkout form/summary under 768px, add labels to mobile cart rows, 44×44 touch targets on qty controls, sticky add-to-cart on mobile PDP, `env(safe-area-inset-*)` for iPhone notch.
- **UI system**: standardize buttons (3 variants), unify shadow elevations, replace hardcoded hex values with CSS tokens, extend typography tokens to h3/h4.
- **Performance**: `next/font/google` instead of raw `<link>` for Inter; dynamic import Stripe/PayPal SDKs; `Cache-Control: s-maxage` on `/api/products`; move rate-limit off the critical path for hot reads.
- **DevOps**: CI jobs for `npm audit`, gitleaks, bundle-size; separate Supabase project for Vercel previews; Supabase CLI migrations instead of flat SQL files; `lib/env.js` strict env-var validation.
- **a11y**: Escape handler + focus management for Navbar dropdown, mobile menu, and product lightbox; `role="alert"` / `aria-live` on form and checkout error surfaces; `aria-invalid` on invalid inputs.
- **i18n**: rename `state` → `județ` with 41-county dropdown; Romanian phone format validation; diacritic consistency sweep; `Intl.DateTimeFormat({ timeZone: 'Europe/Bucharest' })`.

---

## Explicit deferrals (noted but not recommended to fix now)

- E2E tests (Playwright/Cypress) — high effort, defer until integration-test layer is in.
- Offline / retry queue via service worker — cosmetic for most traffic patterns.
- Migrating from JS to TS — would pay off but is a multi-sprint effort.
- Snapshot tests — low ROI without a stable response contract first.
- Newsletter signup / exit-intent popups — GDPR-sensitive; needs legal review first.

---

## Severity counts across all 20 viewpoints

| Severity | Count |
|---|---|
| Critical | 19 |
| High | 42 |
| Medium | 38 |
| Low | 9 |

(Approximate — some findings appear in multiple reports.)

---

## How to use this audit

- Each detail file is standalone and cites file paths with line numbers.
- Treat items marked ⚠ as hypotheses until the named file is read.
- Recommended order: **compliance (items 1-3) → security items needing verification (5, 6) → active CVEs (4) → payment idempotency + Stripe-handler bug (7, 8) → rate-limit fail-mode (10)**. This sequence turns the biggest existential risks off first; performance and UX improvements can run in parallel after.
- Re-run the audit after 1-2 sprints of remediation.
