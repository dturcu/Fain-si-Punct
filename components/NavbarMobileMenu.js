'use client'

import Link from 'next/link'

export default function NavbarMobileMenu({
  user,
  loading,
  cartCount,
  searchQuery,
  setSearchQuery,
  onSearch,
  onLogout,
  onClose,
}) {
  return (
    <div className="mobile-menu">
      <form className="mobile-search" onSubmit={onSearch}>
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
        <Link href="/" onClick={onClose}>Acasa</Link>
        <Link href="/products" onClick={onClose}>Produse</Link>
        <Link href="/cart" onClick={onClose}>
          Cos ({cartCount})
        </Link>
        {!loading && (
          <>
            {user ? (
              <>
                <Link href="/account" onClick={onClose}>Contul meu</Link>
                <Link href="/account/orders" onClick={onClose}>Comenzile mele</Link>
                {user.role === 'admin' && (
                  <Link href="/admin" onClick={onClose}>Admin</Link>
                )}
                <button onClick={onLogout} className="mobile-logout-btn">Deconectare</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={onClose}>Autentificare</Link>
                <Link href="/auth/register" onClick={onClose}>Inregistrare</Link>
              </>
            )}
          </>
        )}
      </nav>
    </div>
  )
}
