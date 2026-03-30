'use client'

import { useEffect, useState } from 'react'
import styles from '@/styles/admin-dashboard.module.css'

export default function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    try {
      const response = await fetch(`/api/admin/dashboard`)
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

  if (loading) return <div>Loading...</div>
  if (!dashboard) return <div>Error loading dashboard</div>

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Products</h3>
          <p className={styles.statValue}>{dashboard.totalProducts}</p>
        </div>

        <div className={styles.statCard}>
          <h3>Total Orders</h3>
          <p className={styles.statValue}>{dashboard.totalOrders}</p>
        </div>

        <div className={styles.statCard}>
          <h3>Total Revenue</h3>
          <p className={styles.statValue}>${dashboard.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className={styles.section}>
        <h2>Products by Category</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Count</th>
              <th>Avg Price</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.categoryStats.map((stat) => (
              <tr key={stat._id}>
                <td>{stat._id}</td>
                <td>{stat.count}</td>
                <td>${stat.avgPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.section}>
        <h2>Recent Orders</h2>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {dashboard.recentOrders.map((order) => (
              <tr key={order._id}>
                <td>{order.orderNumber}</td>
                <td>{order.customer.name}</td>
                <td>${order.total.toFixed(2)}</td>
                <td>
                  <span className={`${styles.status} ${styles[order.status]}`}>
                    {order.status}
                  </span>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
