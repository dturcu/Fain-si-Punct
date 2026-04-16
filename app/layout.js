import '@/styles/globals.css'
import Navbar from '@/components/Navbar'
import Providers from '@/components/Providers'

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://fainsi-punct.ro'),
  title: {
    default: 'Fain si Punct - Magazin Online',
    template: '%s | Fain si Punct',
  },
  description: 'Descopera mii de produse la cele mai bune preturi. Livrare rapida in Romania.',
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    siteName: 'Fain si Punct',
    title: 'Fain si Punct - Magazin Online',
    description: 'Descopera mii de produse la cele mai bune preturi. Livrare rapida in Romania.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Fain si Punct - Magazin Online',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fain si Punct - Magazin Online',
    description: 'Descopera mii de produse la cele mai bune preturi. Livrare rapida in Romania.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body>
        <Providers>
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
        </Providers>
      </body>
    </html>
  )
}
