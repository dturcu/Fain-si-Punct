'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '@/styles/account.module.css'

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const authRes = await fetch('/api/auth/me')
      const authData = await authRes.json()

      if (!authData.success) {
        router.push('/auth/login')
        return
      }

      setUser(authData.user)

      const ordersRes = await fetch('/api/orders/my')
      const ordersData = await ordersRes.json()
      if (ordersData.success) {
        setOrders(ordersData.data || [])
      }
    } catch {
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className={styles.loading}>Se incarca...</div>
  if (!user) return null

  return (
    <div className={styles.container}>
      <h1>Contul meu</h1>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>Informatii personale</h2>
          <div className={styles.info}>
            <p><strong>Nume:</strong> {user.firstName} {user.lastName}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Telefon:</strong> {user.phone || 'Nesetat'}</p>
          </div>
          {user.address?.street && (
            <div className={styles.info}>
              <h3>Adresa</h3>
              <p>{user.address.street}</p>
              <p>{user.address.city}, {user.address.state} {user.address.zip}</p>
              <p>{user.address.country}</p>
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h2>Comenzile mele</h2>
          {orders.length === 0 ? (
            <p className={styles.empty}>Nu ai nicio comanda inca.</p>
          ) : (
            <div className={styles.ordersList}>
              {orders.map((order) => (
                <Link key={order.id} href={`/orders/${order.id}`} className={styles.orderItem}>
                  <div className={styles.orderHeader}>
                    <span className={styles.orderNumber}>{order.orderNumber}</span>
                    <span className={`${styles.status} ${styles[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className={styles.orderMeta}>
                    <span>${order.total.toFixed(2)}</span>
                    <span>{new Date(order.createdAt).toLocaleDateString('ro-RO')}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <Link href="/account/preferences" className={styles.link}>
          Preferinte email
        </Link>
        <Link href="/products" className={styles.link}>
          Continua cumparaturile
        </Link>
      </div>
    </div>
  )
}
