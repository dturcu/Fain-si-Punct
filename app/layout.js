import '@/styles/globals.css'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import Navbar from '@/components/Navbar'
import JsonLd from '@/components/JsonLd'
import CookieConsent from '@/components/CookieConsent'
import FreeShippingBanner from '@/components/FreeShippingBanner'

// Self-hosted via next/font — eliminates render-blocking Google Fonts
// CSS request, FOUT, and CLS.
const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-inter',
})

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('NEXT_PUBLIC_SITE_URL must be set in production') })() : 'http://localhost:3099')

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
