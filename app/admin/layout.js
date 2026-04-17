'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from '@/styles/admin-layout.module.css'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch(`/api/auth/me`)
      const data = await response.json()

      if (!data.success || data.user.role !== 'admin') {
        router.push('/')
        return
      }

      setUser(data.user)
    } catch {
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (!user) return null

  return (
    <div className={styles.adminContainer}>
      <aside className={styles.sidebar}>
        <h2 className={styles.logo}>Admin</h2>
        <nav className={styles.nav}>
          <Link href="/admin" className={styles.navItem}>
            Dashboard
          </Link>
          <Link href="/admin/products" className={styles.navItem}>
            Products
          </Link>
          <Link href="/admin/orders" className={styles.navItem}>
            Orders
          </Link>
          <Link href="/admin/customers" className={styles.navItem}>
            Customers
          </Link>
          <Link href="/admin/returns" className={styles.navItem}>
            Returns
          </Link>
          <Link href="/admin/reviews" className={styles.navItem}>
            Reviews
          </Link>
          <Link href="/admin/import" className={styles.navItem}>
            Import Products
          </Link>
        </nav>
        <button
          className={styles.logout}
          onClick={() => {
            document.cookie = 'token=; path=/; max-age=0'
            router.push('/')
          }}
        >
          Logout
        </button>
      </aside>

      <main className={styles.mainContent}>
        <div className={styles.header}>
          <h1>Admin Dashboard</h1>
          <p>Welcome, {user.firstName || user.email}</p>
        </div>
        {children}
      </main>
    </div>
  )
}
