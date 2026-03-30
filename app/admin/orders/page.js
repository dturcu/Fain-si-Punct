'use client'

import { useEffect, useState } from 'react'
import styles from '@/styles/admin-orders.module.css'
import axios from 'axios'

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [trackingData, setTrackingData] = useState({})
  const [emailLogs, setEmailLogs] = useState({})
  const [resending, setResending] = useState({})

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter) params.append('status', filter)

      const response = await fetch(
        `/api/orders?${params}`
      )
      const data = await response.json()
      setOrders(data.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmailLogs = async (orderId) => {
    try {
      const response = await axios.get('/api/emails/logs', {
        params: { orderId, limit: 100 },
      })

      if (response.data.success) {
        setEmailLogs((prev) => ({
          ...prev,
          [orderId]: response.data.data.logs,
        }))
      }
    } catch (error) {
      console.error('Error fetching email logs:', error)
    }
  }

  const updateStatus = async (orderId, newStatus) => {
    try {
      const trackingInfo = trackingData[orderId] || {}
      const response = await fetch(
        `/api/orders/${orderId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            trackingNumber: trackingInfo.trackingNumber,
            trackingUrl: trackingInfo.trackingUrl,
          }),
        }
      )

      if (response.ok) {
        fetchOrders()
        setExpandedOrder(null)
      }
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  const resendEmail = async (emailLogId) => {
    try {
      setResending((prev) => ({
        ...prev,
        [emailLogId]: true,
      }))

      const response = await axios.post('/api/emails/resend', { emailLogId })

      if (response.data.success) {
        // Refresh email logs
        const orderIdWithThisEmail = Object.keys(emailLogs).find((orderId) =>
          emailLogs[orderId].some((log) => log._id === emailLogId)
        )

        if (orderIdWithThisEmail) {
          await fetchEmailLogs(orderIdWithThisEmail)
        }
      }
    } catch (error) {
      console.error('Error resending email:', error)
      alert(error.response?.data?.error || 'Failed to resend email')
    } finally {
      setResending((prev) => ({
        ...prev,
        [emailLogId]: false,
      }))
    }
  }

  const toggleOrderExpand = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null)
    } else {
      setExpandedOrder(orderId)
      fetchEmailLogs(orderId)
    }
  }

  const handleTrackingChange = (orderId, field, value) => {
    setTrackingData((prev) => ({
      ...prev,
      [orderId]: {
        ...prev[orderId],
        [field]: value,
      },
    }))
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
            <tbody key={order._id}>
              <tr>
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
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => toggleOrderExpand(order._id)}
                  >
                    {expandedOrder === order._id ? 'Hide' : 'Details'}
                  </button>
                </td>
              </tr>

              {expandedOrder === order._id && (
                <tr>
                  <td colSpan="7" style={{ padding: '20px', backgroundColor: '#f9f9f9' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ marginBottom: '10px' }}>Update Status & Tracking</h4>
                      <div style={{ display: 'grid', gap: '10px', marginBottom: '15px' }}>
                        <div>
                          <label>New Status:</label>
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order._id, e.target.value)}
                            style={{ marginTop: '5px', padding: '5px' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>

                        {order.status !== 'delivered' && order.status !== 'cancelled' && (
                          <>
                            <div>
                              <label>Tracking Number:</label>
                              <input
                                type="text"
                                placeholder="Enter tracking number"
                                value={trackingData[order._id]?.trackingNumber || ''}
                                onChange={(e) =>
                                  handleTrackingChange(order._id, 'trackingNumber', e.target.value)
                                }
                                style={{
                                  marginTop: '5px',
                                  padding: '5px',
                                  width: '100%',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>
                            <div>
                              <label>Tracking URL:</label>
                              <input
                                type="url"
                                placeholder="Enter tracking URL"
                                value={trackingData[order._id]?.trackingUrl || ''}
                                onChange={(e) =>
                                  handleTrackingChange(order._id, 'trackingUrl', e.target.value)
                                }
                                style={{
                                  marginTop: '5px',
                                  padding: '5px',
                                  width: '100%',
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {emailLogs[order._id] && (
                      <div>
                        <h4 style={{ marginBottom: '10px' }}>Email History</h4>
                        <div style={{ marginBottom: '15px' }}>
                          {emailLogs[order._id].length === 0 ? (
                            <p style={{ color: '#666' }}>No emails sent for this order</p>
                          ) : (
                            emailLogs[order._id].map((log) => (
                              <div
                                key={log._id}
                                style={{
                                  padding: '10px',
                                  marginBottom: '8px',
                                  backgroundColor: '#fff',
                                  border: '1px solid #ddd',
                                  borderRadius: '4px',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <div>
                                    <strong>{log.type.replace('_', ' ')}</strong>
                                    <div style={{ fontSize: '12px', color: '#666', marginTop: '3px' }}>
                                      {log.subject}
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#666' }}>
                                      {log.recipient}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: '12px',
                                        marginTop: '3px',
                                        color:
                                          log.status === 'sent'
                                            ? '#28a745'
                                            : log.status === 'failed'
                                            ? '#dc3545'
                                            : '#666',
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      Status: {log.status}
                                    </div>
                                    {log.error && (
                                      <div style={{ fontSize: '12px', color: '#dc3545', marginTop: '3px' }}>
                                        Error: {log.error}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => resendEmail(log._id)}
                                    disabled={resending[log._id]}
                                    style={{
                                      padding: '5px 10px',
                                      fontSize: '12px',
                                      backgroundColor: '#007bff',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      opacity: resending[log._id] ? 0.6 : 1,
                                    }}
                                  >
                                    {resending[log._id] ? 'Resending...' : 'Resend'}
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          ))}
        </tbody>
      </table>
    </div>
  )
}
