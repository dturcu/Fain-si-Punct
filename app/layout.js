import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import JsonLd from '@/components/JsonLd'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awesome-wilbur.vercel.app'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'ShopHub - Magazin Online',
    template: '%s | ShopHub',
  },
  description: 'Descopera peste 14.000 produse la cele mai bune preturi. Livrare gratuita, retur in 30 zile, plata la livrare.',
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    siteName: 'ShopHub',
    title: 'ShopHub - Magazin Online',
    description: 'Descopera peste 14.000 produse la cele mai bune preturi.',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShopHub - Magazin Online',
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
    <html lang="ro">
      <body>
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'ShopHub',
          url: siteUrl,
          description: 'Magazin online cu peste 14.000 produse la cele mai bune preturi.',
          contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: 'Romanian' },
        }} />
        <Navbar />

        <main>{children}</main>

        <footer>
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
            &copy; 2024 ShopHub. Toate drepturile rezervate.
          </div>
        </footer>
      </body>
    </html>
  )
}
