# Audit: SEO, Accessibility, Romanian Localization

## EXECUTIVE SUMMARY
3 Critical, 5 High, 6 Medium findings across SEO, Accessibility (WCAG 2.1 AA), and Localization.

SEO (C+): Metadata solid on products, weak on categories; missing hreflang; FAQ in English; 5k product limit; LCP unoptimized.

Accessibility (C): Keyboard traps in dropdown; missing aria-live on errors; form labels need audit; lightbox focus broken; color contrast mostly OK.

Localization (D+): 15+ API errors in English; FAQ entirely English; mixed diacritics (a/ă, s/ș); "state" field should be "judet"; legal pages and email templates unverified/untranslated.

---

## SEO CRITICAL FINDINGS

1. Sitemap Missing /produse/[categorie] Route (app/sitemap.js:48-53, app/produse/[categorie]/page.js:5)
Search engines unclear which URL is canonical. Fix: Add slug entries or remove alias.

2. OpenGraph Missing Image Fallbacks (app/products/[id]/layout.js:22-44, app/layout.js:15-26)
Root layout has no OG image; product Twitter cards undefined if product.image null. Fix: Add site logo; ensure all products have images[0].

3. hreflang Not Declared (app/layout.js:32-34)
No alternates.languages defined. Future English mirror at risk of duplicate content penalty. Fix: Add alternates.languages: {'ro': '/', 'ro-RO': '/'}.

---

## SEO HIGH FINDINGS

4. Product Metadata Titles Missing Brand (app/products/[id]/layout.js:26)
Title is bare product.name (e.g., "Sony WH-1000XM4"), not including brand. Lower SERP CTR. Fix: Set title as ${product.name} - ${product.brand || 'Fain si Punct'}.

5. Category Redirects Use 307 (Temporary) Not 301 (Permanent) (app/produse/[categorie]/page.js:5)
Link juice doesn't fully transfer. Fix: Use middleware to inject 301 header.

6. FAQ Page Entirely in English (app/faq/page.js:9-50)
All Q&A English. No generateMetadata. Won't rank for Romanian queries. Fix: Translate FAQs; add Romanian generateMetadata.

7. Sitemap Hardcodes 5000-Product Limit (app/sitemap.js:24)
Products 5001+ silently excluded. No pagination into sitemap-0.xml, sitemap-1.xml. Fix: Paginate max 50k URLs per file; add generateStaticParams.

8. Product Page LCP Unoptimized (app/products/[id]/page.js:503)
Main image uses unoptimized flag, 600x600, not lazy-loaded. Direct LCP impact. Fix: Remove unoptimized, set priority=true, preload, use WebP.

---

## SEO MEDIUM FINDINGS

9. 15+ API Errors Hardcoded in English (app/api/auth/login/route.js:38,51 & 15+ routes)
'Invalid credentials', 'Unauthorized', 'Invalid token', 'Cart is empty' all English. Fix: Create lib/i18n-errors.js mapping to Romanian.

10. URL Structure Inconsistent (app/products/[id] vs app/produse/[categorie])
Products use numeric IDs (/products/12345). Categories use slugs (/produse/electro). Fix: Migrate to slug-based /products/sony-wh-1000xm4-[id].

11. Breadcrumb JSON-LD Only on Product Pages (app/products/[id]/page.js:447-460)
Missing on categories/search. SERP breadcrumb boost lost. Fix: Add BreadcrumbList JSON-LD to /products and search.

---

## ACCESSIBILITY CRITICAL FINDINGS

1. Dropdown Menu Keyboard Trap (components/Navbar.js:112-134)
Button has aria-expanded but no Escape handler. Keyboard users trapped. Fix: Add Escape onKeyDown handler; move focus to first item on open; restore to opener on close.

2. Form Labels Missing or Weak (app/auth/login/page.js:62-96 OK; checkout/register need audit)
Login has explicit labels. Other forms inconsistent. Fix: Audit all forms; ensure explicit <label htmlFor>.

3. Error Messages Not Announced (app/products/[id]/page.js:708-713, Checkout, Cart)
Messages lack role="alert" or aria-live="polite". Screen readers won't auto-announce. Fix: Add role="alert" + aria-live="polite".

---

## ACCESSIBILITY HIGH FINDINGS

4. Star Rating Lacks Hover Announcement (components/StarRating.js:44-48)
Interactive mode has aria-label but no aria-live. Fix: Add aria-live="polite".

5. Image Alt Text Inconsistent (app/products/[id]/page.js:517 vs category cards)
Product page alts good. Category cards likely bare. Fix: Ensure all alts include name + brand.

6. Heading Hierarchy Broken; FAQ No Q&A Structure (app/faq/page.js:58, 72, 78)
H1 English. Questions use <button>, no heading. Answers bare. Fix: Use <details> or <h3> structure.

7. Color Contrast Unverified (styles/globals.css:8-25)
Primary + accent = 7:1 (AAA). Error color = 5.5:1 (AA, not AAA). Fix: Spot-check at webaim.org.

---

## ACCESSIBILITY MEDIUM FINDINGS

8. Lightbox Missing aria-modal & Focus Management (app/products/[id]/page.js:843-945)
Missing aria-modal="true". Focus not moved on open/restored on close. Fix: Add aria-modal="true", manage focus.

9. Mobile Menu Overlay Missing aria-hidden (components/Navbar.js:176-179)
Users can tab into background. Fix: Add aria-hidden={!mobileMenuOpen}.

10. Review Form Missing aria-invalid (components/ReviewForm.js)
Form errors likely inline without aria-invalid. Fix: Add aria-invalid, role="alert".

---

## LOCALIZATION CRITICAL FINDINGS

1. 15+ API Errors in English (app/api/auth/login/route.js:38,51 & 15+ routes)
'Invalid credentials' -> 'Date de autentificare incorecte'
'Unauthorized' -> 'Neautorizat'
'Invalid token' -> 'Token invalid'
'Cart is empty' -> 'Cosul tau este gol'
20-30% of interactions touch errors; each breaks trust. Fix: Create lib/i18n-errors.js; map error codes to Romanian.

2. FAQ Page Entirely in English (app/faq/page.js:9-50)
All Q&A, H1 in English. Won't rank for Romanian queries. Signals incompleteness. Fix: Translate all FAQs; add generateMetadata.

3. Mixed Diacritics (throughout: Navbar, auth, pages)
Inconsistent ă, â, î, ș, ț. "Cos" vs "Coș". Signals careless QA. Fix: Audit all text; create terminology guide; add linter.

---

## LOCALIZATION HIGH FINDINGS

4. Address Field "state" Should Be "judet" (app/checkout/page.js:46-47)
Romania has județ (county), not state. Confuses users. Fix: Rename to judet; provide dropdown of 41 județe + Bucharest.

5. Date Formatting: No Timezone Handling (app/products/[id]/page.js:240-245)
No conversion to Europe/Bucharest. Dates may be off by a day. Fix: Use Intl.DateTimeFormat with timeZone: 'Europe/Bucharest'.

6. Currency Inconsistent: "lei" vs "RON" (app/products/[id]/page.js:552 vs API)
UI shows "lei"; API uses "RON". Both correct but mixed. Fix: Standardize: "lei" for UI, "RON" in JSON-LD.

7. Phone Validation Missing Romanian Format (app/checkout/page.js:~100)
Only checks !phone.trim(). No regex. Fix: Add /^(\+40|0)[1-9]\d{8,9}$/.

---

## LOCALIZATION MEDIUM FINDINGS

8. Legal Pages Not Translated (app/terms, privacy, cookies, returns)
Content likely English. ANPC/GDPR unlocalized. Fix: Translate to Romanian; include ANPC references; legal review.

9. Email Templates Likely in English (app/api/emails/send/route.js)
Order confirmations, password resets probably English. Fix: Create Romanian email templates or use i18n library.

10. No Explicit i18n Config (next.config.js)
No locale configuration. External tools can't infer. Fix: Add i18n config or use next-intl middleware.

---

## GRADES
SEO: C+ | Accessibility: C | Localization: D+

