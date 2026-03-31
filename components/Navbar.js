'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    checkAuth()
    fetchCartCount()

    const handleCartUpdated = () => fetchCartCount()
    window.addEventListener('cart-updated', handleCartUpdated)
    return () => window.removeEventListener('cart-updated', handleCartUpdated)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      if (data.success) {
        setUser(data.user)
      }
    } catch {
      // Not logged in
    } finally {
      setLoading(false)
    }
  }

  const fetchCartCount = async () => {
    try {
      const response = await fetch('/api/cart')
      const data = await response.json()
      const cart = data.cart || data.data
      if (data.success && cart && cart.items) {
        const total = cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
        setCartCount(total)
      }
    } catch {
      setCartCount(0)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignore network errors — the redirect still clears state
    }
    setUser(null)
    setCartCount(0)
    setDropdownOpen(false)
    setMobileMenuOpen(false)
    router.push('/')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      router.push(`/products?search=${encodeURIComponent(trimmed)}`)
      setMobileMenuOpen(false)
    }
  }

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link href="/" className="logo">ShopHub</Link>

        <form className="nav-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Cauta produse..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="nav-search-input"
          />
          <button type="submit" className="nav-search-btn" aria-label="Cauta">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </form>

        <div className="nav-actions">
          {!loading && (
            <>
              {user ? (
                <div className="nav-user-wrapper" ref={dropdownRef}>
                  <button
                    className="nav-user-btn"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="menu"
                    aria-label={`Meniu cont pentru ${user.firstName || user.email}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="nav-user-name">{user.firstName || user.email}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div className="nav-dropdown" role="menu">
                      <Link href="/account" onClick={() => setDropdownOpen(false)} role="menuitem">Contul meu</Link>
                      <Link href="/account/orders" onClick={() => setDropdownOpen(false)} role="menuitem">Comenzile mele</Link>
                      <button onClick={handleLogout} className="nav-dropdown-logout" role="menuitem">Deconectare</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="nav-auth-links">
                  <Link href="/auth/login" className="nav-auth-link">Autentificare</Link>
                  <Link href="/auth/register" className="nav-auth-link">Inregistrare</Link>
                </div>
              )}

              {user && user.role === 'admin' && (
                <Link href="/admin" className="nav-admin-badge">Admin</Link>
              )}
            </>
          )}

          <Link
            href="/cart"
            className="nav-cart-link"
            aria-label={`Coș de cumpărături, ${cartCount} ${cartCount === 1 ? 'produs' : 'produse'}`}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span className="nav-cart-badge" aria-hidden="true">{cartCount}</span>
          </Link>

          <button
            className="nav-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Meniu"
            aria-expanded={mobileMenuOpen}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-menu">
          <form className="mobile-search" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Cauta produse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="nav-search-input"
            />
            <button type="submit" className="nav-search-btn" aria-label="Cauta">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>
          <nav className="mobile-nav-links">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>Acasa</Link>
            <Link href="/products" onClick={() => setMobileMenuOpen(false)}>Produse</Link>
            <Link href="/cart" onClick={() => setMobileMenuOpen(false)}>
              Cos ({cartCount})
            </Link>
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/account" onClick={() => setMobileMenuOpen(false)}>Contul meu</Link>
                    <Link href="/account/orders" onClick={() => setMobileMenuOpen(false)}>Comenzile mele</Link>
                    {user.role === 'admin' && (
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>Admin</Link>
                    )}
                    <button onClick={handleLogout} className="mobile-logout-btn">Deconectare</button>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>Autentificare</Link>
                    <Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>Inregistrare</Link>
                  </>
                )}
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
