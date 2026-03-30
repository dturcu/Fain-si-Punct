'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from '@/styles/admin-dashboard.module.css'

const STATUS_LABELS = {
  pending: 'In asteptare',
  processing: 'In procesare',
  shipped: 'Expediat',
  delivered: 'Livrat',
  cancelled: 'Anulat',
}

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/admin/dashboard')
      const data = await response.json()

      if (data.success) {
        setDashboard(data.data)
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Se incarca...</div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Eroare la incarcarea panoului de administrare</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Panou de administrare</h1>
        <nav className={styles.nav}>
          <Link href="/admin/products" className={styles.navLink}>Produse</Link>
          <Link href="/admin/orders" className={styles.navLink}>Comenzi</Link>
          <Link href="/admin/import" className={styles.navLink}>Import</Link>
        </nav>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📦</div>
          <div className={styles.statInfo}>
            <h3>Total produse</h3>
            <p className={styles.statValue}>{dashboard.totalProducts}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>🛒</div>
          <div className={styles.statInfo}>
            <h3>Total comenzi</h3>
            <p className={styles.statValue}>{dashboard.totalOrders}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>💰</div>
          <div className={styles.statInfo}>
            <h3>Venituri totale</h3>
            <p className={styles.statValue}>{dashboard.totalRevenue.toFixed(2)} lei</p>
          </div>
        </div>

        {dashboard.activeCustomers !== undefined && (
          <div className={styles.statCard}>
            <div className={styles.statIcon}>👥</div>
            <div className={styles.statInfo}>
              <h3>Clienti activi</h3>
              <p className={styles.statValue}>{dashboard.activeCustomers}</p>
            </div>
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2>Statistici pe categorii</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Categorie</th>
                <th>Numar produse</th>
                <th>Pret mediu</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.categoryStats.map((stat) => (
                <tr key={stat._id}>
                  <td>{stat._id}</td>
                  <td>{stat.count}</td>
                  <td>{stat.avgPrice.toFixed(2)} lei</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.section}>
        <h2>Comenzi recente</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Numar comanda</th>
                <th>Client</th>
                <th>Total</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.recentOrders.map((order) => (
                <tr key={order._id}>
                  <td className={styles.orderNumber}>{order.orderNumber}</td>
                  <td>{order.customer?.name || 'N/A'}</td>
                  <td className={styles.price}>{order.total.toFixed(2)} lei</td>
                  <td>
                    <span className={`${styles.status} ${styles[order.status]}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString('ro-RO')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
