/**
 * Client-side cookie consent helpers.
 *
 * Categories:
 *   - essential   — always true, cannot be disabled (auth cookie, cart).
 *   - analytics   — defaults off; enabled only after explicit opt-in.
 *   - marketing   — defaults off; enabled only after explicit opt-in.
 *
 * Consent state lives in localStorage under STORAGE_KEY as JSON:
 *   { essential: true, analytics: bool, marketing: bool, version: number,
 *     decidedAt: ISO timestamp }
 *
 * Bump CONSENT_VERSION when categories change or wording changes — the
 * banner will re-appear to re-collect consent from existing visitors.
 */

export const STORAGE_KEY = 'fp_cookie_consent'
export const CONSENT_VERSION = 1

export const CATEGORIES = ['essential', 'analytics', 'marketing']

export function defaultConsent() {
  return { essential: true, analytics: false, marketing: false, version: CONSENT_VERSION }
}

/**
 * Read stored consent. Returns null if the banner hasn't been dismissed
 * yet OR if the stored version is older than CONSENT_VERSION (forcing
 * re-consent).
 */
export function readConsent() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== CONSENT_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

export function writeConsent(consent) {
  if (typeof window === 'undefined') return
  const payload = {
    ...defaultConsent(),
    ...consent,
    essential: true,
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  window.dispatchEvent(new CustomEvent('consent-updated', { detail: payload }))
}

export function hasConsent(category) {
  if (category === 'essential') return true
  const c = readConsent()
  return !!(c && c[category])
}

export function acceptAll() {
  writeConsent({ essential: true, analytics: true, marketing: true })
}

export function rejectAll() {
  writeConsent({ essential: true, analytics: false, marketing: false })
}
