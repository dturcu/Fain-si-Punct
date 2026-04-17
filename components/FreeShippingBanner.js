import { SHIPPING_THRESHOLD } from '@/lib/constants'
import styles from './FreeShippingBanner.module.css'

/**
 * Thin, always-visible ribbon that surfaces the free-shipping threshold.
 * Rendered in app/layout.js above <Navbar /> so it shows on every page.
 * No JavaScript, no hydration cost.
 */
export default function FreeShippingBanner() {
  return (
    <div className={styles.banner} role="complementary" aria-label="Oferta livrare">
      <span className={styles.pill}>
        🚚 Livrare gratuita la comenzi peste <strong>{SHIPPING_THRESHOLD} lei</strong>
        {' · '}
        Retur in 14 zile
      </span>
    </div>
  )
}
