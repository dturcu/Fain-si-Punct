# UX + UI + Mobile + CRO Audit

## VIEWPOINT 1: UX / USER FLOW — Grade C+

### 1. CRITICAL — Checkout Form Submit-Only Validation
**File:** `app/checkout/page.js:214-335`
9 fields validate only on submit. No inline errors, no real-time feedback.
**Fix:** Blur-event validation with error text below each field.

### 2. HIGH — Guest Checkout Not Visibly Surfaced
**Files:** `app/checkout/page.js:47-57`, `app/api/checkout/route.js:13-22`
Backend supports guests (`getSessionContext`); no "Continue as Guest" CTA on UI.
**Fix:** Prominent CTA above or beside login option.

### 3. HIGH — No Final Order Review Step
**File:** `app/checkout/page.js:149-162`
User routed directly to payment without itemized confirmation (items, address, shipping cost all together).
**Fix:** Insert review page before payment redirect.

### 4. HIGH — Empty Cart Lacks Upsells / Trust Messaging
**File:** `app/cart/page.js:159-217`
Only generic "Continue Shopping" link. No product suggestions, no "Free Shipping >200 lei" hook.
**Fix:** Top-rated products + shipping threshold badge.

### 5. HIGH — Checkout Step Indicator Is Passive
**Files:** `styles/checkout.module.css:37-86`, `app/checkout/page.js:194-209`
Steps 1-2-3 are static labels; no back navigation or Step 3 preview.
**Fix:** Clickable back; show payment preview on Step 2.

### 6. MEDIUM — Add-to-Cart Feedback Is Silent
**File:** `app/products/[id]/page.js`
2-second toast, no "View Cart" link, no loading spinner → users multi-click on slow networks.
**Fix:** Button spinner + persistent toast with "View Cart →".

### 7. MEDIUM — Quantity Controls 34×34px (Below WCAG 44×44)
**File:** `styles/cart.module.css:207-250`
**Fix:** Bump to 44×44px.

### 8. MEDIUM — Order Confirmation Payment Status Ambiguous
**File:** `app/api/checkout/route.js:149-153`
Routes to `/orders/{id}?pay=card` with no status badge or "Complete Payment" prompt.
**Fix:** Status badge + highlight payment form + retry mechanism.

---

## VIEWPOINT 2: UI / VISUAL DESIGN — Grade B−

### 1. CRITICAL — Inconsistent Input Error Styling
**Files:** `styles/checkout.module.css:155-163` vs `styles/cart.module.css`
Checkout has red border + light bg, no inline text. Cart has nothing.
**Fix:** Standard pattern: red border + inline error text below every invalid field.

### 2. HIGH — No Consistent CTA Hierarchy
**Files:** `styles/checkout.module.css:265-303`, `styles/cart.module.css:353-368`
Ramburs button green, card gold, cart checkout dark-primary. No documented hierarchy.
**Fix:** Three variants in `globals.css`: `--button-primary/secondary/tertiary`.

### 3. HIGH — Typography Scale Not Enforced
**File:** `globals.css:28-35`
Tokens defined but modules use hardcoded font-sizes. No h3/h4 tokens.
**Fix:** Add `--font-size-h1/h2/h3/h4`; migrate modules to tokens.

### 4. HIGH — Shadows & Elevation Inconsistent
**File:** `globals.css:65-69` (4 levels) — used variably.
**Fix:** White cards = `--shadow-md`; inputs = `--shadow-sm`.

### 5. MEDIUM — Emoji vs SVG Icon Mix
**Files:** `app/checkout/page.js:14-34` (emoji for payment methods) vs `components/Navbar.js:99-127` (SVG)
Emoji render inconsistently across browsers/OS.
**Fix:** `<PaymentMethodIcon />` component with SVG/brand logos.

### 6. MEDIUM — One-Off Hex Values Bypass Tokens
**File:** `styles/product-detail.module.css:69` (#f8f8f8) and elsewhere.
**Fix:** Replace hardcoded colors with `--color-*` tokens across all modules.

### 7. MEDIUM — Focus States Incomplete
**File:** `globals.css:88-95`
Global `focus-visible` defined but not enforced on payment radios.
**Fix:** `.paymentOption:focus-within { outline: 2px solid var(--color-accent); }`.

### 8. LOW — Ramburs Note Color Conflict
**File:** `styles/checkout.module.css:233-240`
Orange text on gold bg (two warm tones competing).
**Fix:** Single color; add distinguishing icon.

---

## VIEWPOINT 3: MOBILE & RESPONSIVE — Grade B

### 1. CRITICAL — Checkout Form Cramped Below 960px
**File:** `styles/checkout.module.css:97-101`
`1fr 380px` grid doesn't collapse on <768px.
**Fix:** `@media (max-width: 768px)` to stack vertically; reduce field padding.

### 2. CRITICAL — Cart Table Has No Mobile Labels
**Files:** `styles/cart.module.css:513-524`, `app/cart/page.js:251-354`
Below 680px table header hides and items flex-wrap, but no labels on values (price vs subtotal vs qty).
**Fix:** `::before` pseudo-element labels at mobile breakpoint.

### 3. HIGH — Touch Targets Below 44×44
**Files:** `styles/cart.module.css:207-220`, `globals.css:342-346`
Qty +/− 34×34.
**Fix:** 44×44 minimum.

### 4. HIGH — Mobile Menu Hides Search
**Files:** `components/Navbar.js:81-83`, `globals.css:421-440`
Search input hidden; hamburger drawer doesn't include search or category filter.
**Fix:** Add search + category dropdown to mobile drawer.

### 5. HIGH — No Sticky Checkout Summary on Mobile
**File:** `styles/checkout.module.css:97-101`
Summary stacks below form; invisible while filling address fields.
**Fix:** Sticky summary at top, or floating "Total | Continue →" pill.

### 6. MEDIUM — Long Romanian Words Risk Horizontal Scroll
**File:** `styles/cart.module.css:154-164`
Variant labels can overflow narrow screens.
**Fix:** Ellipsis on single line; test with longest SKUs.

### 7. MEDIUM — iOS Safe-Area-Inset Not Handled
**Files:** `app/layout.js:37-41`, `globals.css`
Navbar/footer can overlap iPhone 12+ notch.
**Fix:** `padding-left: max(var(--space-4), env(safe-area-inset-left))` + bottom equivalent.

### 8. MEDIUM — No Sticky Add-to-Cart on Mobile PDP
**File:** `app/products/[id]/page.js`
**Fix:** Sticky footer CTA with safe-area-inset-bottom.

---

## VIEWPOINT 4: CRO — Grade C

### 1. CRITICAL — No Social Proof on Product Detail Pages
**File:** `components/Testimonials.js` (home only); PDP has no reviews aggregate.
**Fix:** PDP header: rating + review count + top 3 reviews + trust badges.

### 2. CRITICAL — Shipping Threshold Hidden Until Cart
**File:** `lib/constants.js` (`SHIPPING_THRESHOLD`, `SHIPPING_COST`)
Cart shows "Add X more for free shipping"; homepage + PDP silent.
**Fix:** Homepage hero, PDP header, empty cart: "LIVRARE GRATUITĂ peste 200 lei".

### 3. HIGH — Zero Upsell / Cross-Sell
**Files:** `app/cart/page.js`, `app/checkout/page.js`
No "Frequently Bought Together", no "Customers Also Bought".
**Fix:** Cart above checkout CTA: 3-4 cards + "Add All".

### 4. HIGH — No Newsletter Capture
**File:** `components/EmailPreferences.js` exists but not exposed; no footer signup.
**Fix:** Footer signup + exit-intent: "10% off first order" + GDPR checkbox.

### 5. HIGH — VAT Clarity Missing
**Files:** `app/checkout/page.js:360-361`, `app/cart/page.js`
No "(TVA inclus)" or "prețuri fără TVA" notation. Romanian law requires clarity.
**Fix:** "Total (TVA inclus)" on cart/checkout; "(TVA inclus)" near PDP price.

### 6. HIGH — No Urgency / Scarcity Cues
**File:** `app/products/[id]/page.js` (has `effectiveStock`)
No "Mai sunt X bucăți!" badge, no RRP strikethrough.
**Fix:** `{effectiveStock > 0 && effectiveStock <= 5 && <LowStockBadge />}`; strikethrough RRP on sales.

### 7. MEDIUM — No Cart Abandonment Email
**File:** `app/api/cron/cleanup-guest-carts/route.js`
Guest carts silently deleted; no pre-deletion reminder email.
**Fix:** 24h-before-cleanup reminder email with resume link.

### 8. MEDIUM — Return Policy Not Linked from Cart / Checkout
`/returns` exists; no link from decision points.
**Fix:** Cart summary: "✓ Retur gratuit 30 zile" with link.

### 9. MEDIUM — No Search Autocomplete / Typo Tolerance
**File:** `components/Navbar.js:77-84`
Form submits directly with no suggestions.
**Fix:** `GET /api/products/search/autocomplete?q=...` with fuzzy matching (pg_trgm).

### 10. MEDIUM — Payment Icons Are Emoji
**File:** `app/checkout/page.js:9-34`
🎰, 🔄, 🅿️, 📦 — inconsistent rendering, unprofessional.
**Fix:** SVG brand logos (Visa/MC, Revolut, PayPal, Sameday).

### 11. LOW — No SSL / Processor Trust Badges
**File:** `app/checkout/page.js` (generic lock + "Datele tale sunt protejate")
**Fix:** "Plată securizată de Stripe | Certificat SSL".

---

## TOP 10 PRIORITY FIXES (impact × effort)

1. Add "Continuă ca invitat" button + real-time checkout validation.
2. Order review step before payment redirect.
3. Social proof (rating + reviews + trust badges) on PDP.
4. "Livrare gratuită peste 200 lei" site-wide messaging.
5. "Frequently Bought Together" on cart.
6. Standardize buttons, error styling, focus states.
7. Stack checkout form/summary on mobile + sticky summary.
8. Mobile cart row labels (pret, cantitate, subtotal).
9. Search autocomplete with fuzzy match.
10. SVG payment icons + SSL/Stripe trust badges.
