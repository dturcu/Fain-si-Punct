# Playwright smoke tests

Five flows that exercise the critical paths without needing
pre-existing fixture data:

1. `home.spec.js` — home page renders (SSR), shipping banner shown,
   testimonials visible, cookie banner appears on first visit.
2. `products.spec.js` — products listing loads, a product detail page
   loads, PDP shows a price and an add-to-cart button.
3. `produse-redirect.spec.js` — `/produse/<categorie>` returns a 308 to
   `/products?category=...`.
4. `search-autocomplete.spec.js` — typing into the nav search surfaces
   suggestions (or gracefully shows nothing if catalog is empty).
5. `auth.spec.js` — login page is keyboard-navigable; a bad-password
   attempt returns a Romanian error message (`Date de autentificare
   incorecte`) via the canonical apiError shape.

## Running locally

```bash
# Terminal 1
npm run dev

# Terminal 2
PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test
```

## In CI

Run against the Vercel preview URL:

```bash
PLAYWRIGHT_BASE_URL=$VERCEL_PREVIEW_URL npx playwright test
```

These smokes intentionally avoid checkout + payments because those
require Stripe/PayPal sandbox creds and real catalog data. Add a
`checkout.spec.js` once CI has fixture seeding.
