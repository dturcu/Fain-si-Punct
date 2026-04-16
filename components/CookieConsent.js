'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from './CookieConsent.module.css'
import { readConsent, acceptAll, rejectAll, writeConsent } from '@/lib/consent'

/**
 * First-visit cookie consent banner, Romanian-compliant (GDPR + Romanian
 * ePrivacy). Shows until the user makes an explicit choice. Essential
 * cookies are always on (cannot be rejected); analytics and marketing
 * require opt-in.
 *
 * Wording is generic and minimally compliant — tailor when real
 * analytics/marketing pixels are introduced in Phase 4.
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showCustom, setShowCustom] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [marketing, setMarketing] = useState(false)

  useEffect(() => {
    if (!readConsent()) setVisible(true)
  }, [])

  if (!visible) return null

  const onAcceptAll = () => {
    acceptAll()
    setVisible(false)
  }
  const onRejectAll = () => {
    rejectAll()
    setVisible(false)
  }
  const onSaveCustom = () => {
    writeConsent({ essential: true, analytics, marketing })
    setVisible(false)
  }

  return (
    <div className={styles.banner} role="dialog" aria-live="polite" aria-label="Consimtamant cookies">
      <div className={styles.content}>
        <h2 className={styles.title}>Folosim cookie-uri</h2>
        <p className={styles.text}>
          Folosim cookie-uri esentiale pentru functionarea site-ului (cos, autentificare).
          Cu acordul tau mai folosim si cookie-uri de analiza si marketing pentru a ne imbunatati
          serviciile. Poti schimba oricand preferintele din{' '}
          <Link href="/cookies">Politica de cookies</Link>.
        </p>

        {showCustom && (
          <div className={styles.categories}>
            <label className={styles.row}>
              <input type="checkbox" checked disabled aria-label="Esentiale" />
              <span>
                <strong>Esentiale</strong> — intotdeauna active. Necesare pentru cos, autentificare si securitate.
              </span>
            </label>
            <label className={styles.row}>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(e) => setAnalytics(e.target.checked)}
              />
              <span>
                <strong>Analiza</strong> — ne ajuta sa intelegem cum este folosit site-ul.
              </span>
            </label>
            <label className={styles.row}>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(e) => setMarketing(e.target.checked)}
              />
              <span>
                <strong>Marketing</strong> — personalizeaza recomandari si anunturi.
              </span>
            </label>
          </div>
        )}

        <div className={styles.actions}>
          {showCustom ? (
            <>
              <button className="btn btn-secondary" onClick={() => setShowCustom(false)}>
                Inapoi
              </button>
              <button className="btn btn-primary" onClick={onSaveCustom}>
                Salveaza preferintele
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-tertiary" onClick={() => setShowCustom(true)}>
                Personalizeaza
              </button>
              <button className="btn btn-secondary" onClick={onRejectAll}>
                Refuza toate
              </button>
              <button className="btn btn-primary" onClick={onAcceptAll}>
                Accepta toate
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
