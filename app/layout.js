import '@/styles/globals.css'

export const metadata = {
  title: 'ECommerce Store - 15k+ Products',
  description: 'Shop from thousands of quality products',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="navbar">
          <div className="nav-container">
            <h1 className="logo">ShopHub</h1>
            <nav>
              <a href="/">Home</a>
              <a href="/products">Products</a>
              <a href="/cart">Cart</a>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer>
          <p>&copy; 2024 ShopHub. All rights reserved.</p>
        </footer>
      </body>
    </html>
  )
}
