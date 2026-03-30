'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
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

  const handleLogout = () => {
    document.cookie = 'token=; path=/; max-age=0'
    setUser(null)
    router.push('/')
  }

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link href="/" className="logo">ShopHub</Link>
        <nav>
          <Link href="/">Acasa</Link>
          <Link href="/products">Produse</Link>
          <Link href="/cart">Cos</Link>
          <Link href="/about">Despre</Link>
          <Link href="/contact">Contact</Link>
          {!loading && (
            <>
              {user ? (
                <>
                  <Link href="/account" className="nav-user">
                    {user.firstName || user.email}
                  </Link>
                  {user.role === 'admin' && (
                    <Link href="/admin" className="nav-admin">Admin</Link>
                  )}
                  <button onClick={handleLogout} className="nav-logout">
                    Deconectare
                  </button>
                </>
              ) : (
                <>
                  <Link href="/auth/login">Autentificare</Link>
                  <Link href="/auth/register">Inregistrare</Link>
                </>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
