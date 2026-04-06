# ShopHub Design System

Premium Warm — Airbnb-inspired warmth, Apple product page feel, Stripe checkout trust.

## Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#1a1a2e` | Navbar, footer, primary buttons |
| `--color-primary-light` | `#2d2d44` | Hover states, gradients |
| `--color-accent` | `#e8913a` | CTAs, active states, links |
| `--color-accent-hover` | `#d47d2a` | CTA hover |
| `--color-accent-light` | `#fdf0e2` | Highlight backgrounds |
| `--color-text-primary` | `#222222` | Headings, body text |
| `--color-text-secondary` | `#484848` | Descriptions |
| `--color-text-tertiary` | `#717171` | Captions, timestamps |
| `--color-success` | `#008a05` | In stock, success |
| `--color-warning` | `#b25000` | Low stock, warnings |
| `--color-error` | `#c13515` | Errors, out of stock |
| `--color-bg-primary` | `#ffffff` | Card backgrounds |
| `--color-bg-secondary` | `#f7f7f7` | Page background |
| `--color-border` | `#dddddd` | Dividers, borders |

## Typography

System font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif.

| Scale | Size | Weight | Usage |
|-------|------|--------|-------|
| Display XL | 2.75rem | 800 | Hero headline |
| Display LG | 2rem | 700 | Page titles |
| Display MD | 1.5rem | 700 | Section titles |
| Display SM | 1.25rem | 600 | Card titles |
| Text LG | 1.125rem | 400 | Lead text |
| Text MD | 1rem | 400 | Body |
| Text SM | 0.875rem | 400 | Labels, captions |
| Text XS | 0.75rem | 500 | Badges, tags |

## Spacing

8px base unit: 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64px.

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 6px | Badges, small elements |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards |
| `--radius-xl` | 20px | Large cards, sections |
| `--radius-pill` | 9999px | Pill buttons, tags, search |

## Shadows (3-layer warm lift)

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | subtle | Cards at rest |
| `--shadow-md` | medium | Card hover, dropdowns |
| `--shadow-lg` | elevated | Modals, popovers |
| `--shadow-xl` | high | Lightbox, overlay panels |

## Interactions

- Transitions: 150ms (fast, hover states) / 250ms (normal, layouts)
- Cards: lift on hover via shadow-sm -> shadow-md + translateY(-2px)
- Buttons: darken on hover, scale(0.98) on active
- Links: color transition to accent on hover
