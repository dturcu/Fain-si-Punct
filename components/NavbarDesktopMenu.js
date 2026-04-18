'use client'

import Link from 'next/link'

export default function NavbarDesktopMenu({
  user,
  loading,
  dropdownOpen,
  setDropdownOpen,
  dropdownRef,
  cartCount,
  onLogout,
  onMobileMenuToggle,
  mobileMenuOpen,
}) {
  return (
    <div className="nav-actions">
      {!loading && (
        <>
          {user ? (
            <div className="nav-user-wrapper" ref={dropdownRef}>
              <button
                className="nav-user-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
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
                <div className="nav-dropdown">
                  <Link href="/account" onClick={() => setDropdownOpen(false)}>Contul meu</Link>
                  <Link href="/account/orders" onClick={() => setDropdownOpen(false)}>Comenzile mele</Link>
                  <button onClick={onLogout} className="nav-dropdown-logout">Deconectare</button>
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
        aria-label={`Cos cumparaturi (${cartCount} ${cartCount === 1 ? 'produs' : 'produse'})`}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        <span className="nav-cart-badge" aria-hidden="true">{cartCount}</span>
      </Link>

      <button
        className="nav-hamburger"
        onClick={onMobileMenuToggle}
        aria-label="Meniu"
        aria-expanded={mobileMenuOpen}
      >
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
        <span className="hamburger-line"></span>
      </button>
    </div>
  )
}
