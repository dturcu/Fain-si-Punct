# ShopHub SEO Audit Checklist

## Technical SEO
- [x] robots.txt — `app/robots.js`
- [x] sitemap.xml — `app/sitemap.js` (dynamic, products + categories + static pages)
- [x] Canonical URLs — via `alternates.canonical` in metadata
- [x] Title template — `%s | ShopHub` via root layout
- [x] Meta descriptions — all public pages
- [x] Open Graph tags — root + product detail
- [x] Twitter Card tags — root + product detail
- [x] JSON-LD Organization — root layout
- [x] JSON-LD Product — product detail pages
- [x] JSON-LD BreadcrumbList — product detail pages
- [x] Theme color — `#1a1a2e`
- [x] Lang attribute — `<html lang="ro">`
- [x] noindex on private pages (cart, checkout, auth, account)
- [ ] Image alt tags audit (partially done, most images have alt)
- [ ] Google Search Console verification
- [ ] Google Analytics 4 integration
- [ ] Core Web Vitals optimization
- [ ] Next.js Image component for automatic optimization

## Content SEO
- [x] Brand voice guidelines — `seo/brand-voice.md`
- [x] Target keywords — `seo/target-keywords.md`
- [x] Internal links strategy — `seo/internal-links.md`
- [ ] Blog section (planned)
- [ ] Category landing page content
- [ ] Product description optimization (bulk)

## Design / UX (impacts SEO via engagement)
- [x] Design system tokens — DESIGN.md + CSS custom properties
- [x] Mobile-first responsive design
- [x] Accessible focus states
- [x] Semantic HTML (nav, main, footer, section)
- [ ] Lighthouse performance audit
- [ ] Accessibility audit (WCAG 2.1 AA)
