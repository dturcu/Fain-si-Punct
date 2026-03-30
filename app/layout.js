import '@/styles/globals.css'
import Navbar from '@/components/Navbar'

export const metadata = {
  title: 'ShopHub - Magazin Online',
  description: 'Descopera peste 14.000 produse la cele mai bune preturi',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body>
        <Navbar />

        <main>{children}</main>

        <footer>
          <p>&copy; 2024 ShopHub. Toate drepturile rezervate.</p>
        </footer>
      </body>
    </html>
  )
}
