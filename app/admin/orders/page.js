'use client'

import { useEffect, useState } from 'react'
import styles from '@/styles/admin-orders.module.css'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter) params.append('status', filter)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders?${params}`
      )
      const data = await response.json()
      setOrders(data.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/orders/${orderId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        }
      )

      if (response.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className={styles.container}>
      <h2>Manage Orders</h2>

      <div className={styles.filter}>
        <label>Filter by Status:</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order #</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Total</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order._id}>
              <td>{order.orderNumber}</td>
              <td>{order.customer.name}</td>
              <td>{order.items.length}</td>
              <td>${order.total.toFixed(2)}</td>
              <td>
                <span className={`${styles.status} ${styles[order.status]}`}>
                  {order.status}
                </span>
              </td>
              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              <td className={styles.actions}>
                <select
                  value={order.status}
                  onChange={(e) => updateStatus(order._id, e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
