import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import JsonLd from '@/components/JsonLd'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awesome-wilbur.vercel.app'

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Fain si Punct - Magazin Online',
    template: '%s | Fain si Punct',
  },
  description: 'Descopera peste 14.000 produse la cele mai bune preturi. Livrare gratuita, retur in 30 zile, plata la livrare.',
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
    <html lang="ro">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <JsonLd data={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Fain si Punct',
          url: siteUrl,
          description: 'Magazin online cu peste 14.000 produse la cele mai bune preturi.',
          contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', availableLanguage: 'Romanian' },
        }} />
        <Navbar />

        <main>{children}</main>

        <footer>
          <div className="footer-brand">
            <a href="/" className="footer-logo">Fain si <span>Punct</span></a>
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
          </div>
        </footer>
      </body>
    </html>
  )
}
