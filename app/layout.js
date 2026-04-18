import '@/styles/globals.css'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import JsonLd from '@/components/JsonLd'
import CookieConsent from '@/components/CookieConsent'
import FreeShippingBanner from '@/components/FreeShippingBanner'
import { getSiteUrl } from '@/lib/site-url'

// Self-hosted via next/font — eliminates render-blocking Google Fonts
// CSS request, FOUT, and CLS.
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
})

// See lib/site-url.js for the resolution contract (NEXT_PUBLIC_SITE_URL
// → VERCEL_URL → localhost). Keeping the logic in one helper so
// app/layout.js, app/sitemap.js, app/robots.js, and per-route layouts
// stay in sync.
const siteUrl = getSiteUrl()

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Fain si Punct - Magazin Online',
    template: '%s | Fain si Punct',
  },
  description: 'Descopera peste 14.000 produse la cele mai bune preturi. Livrare rapida, retur in 14 zile, plata la livrare.',
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    siteName: 'Fain si Punct',
    title: 'Fain si Punct - Magazin Online',
    description: 'Descopera peste 14.000 produse la cele mai bune preturi.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fain si Punct - Magazin Online',
    description: 'Descopera peste 14.000 produse la cele mai bune preturi.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: '/',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1a1a2e',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ro" className={inter.variable}>
      <body>
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Fain si Punct',
          url: siteUrl,
          description: 'Magazin online cu peste 14.000 produse la cele mai bune preturi.',
          contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: 'Romanian' },
        }} />
        <FreeShippingBanner />
        <Navbar />

        <main>{children}</main>

        <footer>
          <div className="footer-brand">
            <Link href="/" className="footer-logo">Fain si <span>Punct</span></Link>
            <p className="footer-tagline">Produse alese cu grija, livrate cu drag.</p>
          </div>
          <div className="footer-columns">
            <div className="footer-col">
              <h4>Companie</h4>
              <ul>
                <li><a href="/about">Despre noi</a></li>
                <li><a href="/careers">Cariere</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/blog">Blog</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Contul meu</h4>
              <ul>
                <li><a href="/account">Profilul meu</a></li>
                <li><a href="/account/orders">Comenzile mele</a></li>
                <li><a href="/cart">Cosul meu</a></li>
                <li><a href="/auth/login">Autentificare</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <ul>
                <li><a href="/terms">Termeni si conditii</a></li>
                <li><a href="/privacy">Politica de confidentialitate</a></li>
                <li><a href="/cookies">Politica cookies</a></li>
                <li><a href="/returns">Politica de retur</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h4>Informatii</h4>
              <ul>
                <li><a href="/plata-la-livrare">Plata la livrare</a></li>
                <li><a href="/livrare-gratuita">Livrare gratuita</a></li>
                <li><a href="/faq">Intrebari frecvente</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <span>&copy; 2026 Fain si Punct. Toate drepturile rezervate.</span>
            <span className="footer-anpc">
              <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer">ANPC-SAL</a>
              {' · '}
              <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">SOL UE</a>
            </span>
          </div>
        </footer>
        <CookieConsent />
      </body>
    </html>
  )
}
