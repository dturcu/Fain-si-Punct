'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from '@/styles/admin-orders.module.css'

const STATUS_LABELS = {
  pending: 'In asteptare',
  processing: 'In procesare',
  shipped: 'Expediat',
  delivered: 'Livrat',
  cancelled: 'Anulat',
}

const PAYMENT_STATUS_LABELS = {
  unpaid: 'Neplatita',
  paid: 'Platita',
  processing: 'In procesare',
  failed: 'Esuata',
  refunded: 'Rambursata',
}

const STATUS_OPTIONS = [
  { value: '', label: 'Toate' },
  { value: 'pending', label: 'In asteptare' },
  { value: 'processing', label: 'In procesare' },
  { value: 'shipped', label: 'Expediat' },
  { value: 'delivered', label: 'Livrat' },
  { value: 'cancelled', label: 'Anulat' },
]

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [trackingData, setTrackingData] = useState({})
  const [emailLogs, setEmailLogs] = useState({})
  const [resending, setResending] = useState({})
  const [awbLoading, setAwbLoading] = useState({})
  const [awbResults, setAwbResults] = useState({})
  const [invoiceLoading, setInvoiceLoading] = useState({})
  const [invoiceResult, setInvoiceResult] = useState({})

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter) params.append('status', filter)

      const response = await fetch(`/api/orders?${params}`)
      const data = await response.json()
      setOrders(data.data || [])
    } catch (error) {
      console.error('Eroare la incarcarea comenzilor:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEmailLogs = async (orderId) => {
    try {
      const response = await fetch(`/api/emails/logs?orderId=${orderId}&limit=100`)
      const data = await response.json()

      if (data.success) {
        setEmailLogs((prev) => ({
          ...prev,
          [orderId]: data.data.logs,
        }))
      }
    } catch (error) {
      console.error('Eroare la incarcarea jurnalelor de email:', error)
    }
  }

  const updateStatus = async (orderId, newStatus) => {
    try {
      const trackingInfo = trackingData[orderId] || {}
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: trackingInfo.trackingNumber,
          trackingUrl: trackingInfo.trackingUrl,
        }),
      })

      if (response.ok) {
        fetchOrders()
        setExpandedOrder(null)
      }
    } catch (error) {
      console.error('Eroare la actualizarea comenzii:', error)
    }
  }

  const resendEmail = async (emailLogId) => {
    try {
      setResending((prev) => ({ ...prev, [emailLogId]: true }))

      const response = await fetch('/api/emails/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailLogId }),
      })
      const data = await response.json()

      if (data.success) {
        const orderIdWithThisEmail = Object.keys(emailLogs).find((orderId) =>
          emailLogs[orderId].some((log) => log._id === emailLogId)
        )
        if (orderIdWithThisEmail) {
          await fetchEmailLogs(orderIdWithThisEmail)
        }
      } else {
        alert(data.error || 'Eroare la retrimiterea emailului')
      }
    } catch (error) {
      console.error('Eroare la retrimiterea emailului:', error)
      alert('Eroare la retrimiterea emailului')
    } finally {
      setResending((prev) => ({ ...prev, [emailLogId]: false }))
    }
  }

  const generateSamedayAWB = async (orderId) => {
    try {
      setAwbLoading((prev) => ({ ...prev, [orderId]: true }))

      const response = await fetch('/api/shipping/sameday/create-awb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await response.json()

      if (data.success) {
        setAwbResults((prev) => ({
          ...prev,
          [orderId]: {
            awbNumber: data.data.awbNumber,
            trackingUrl: data.data.trackingUrl,
          },
        }))
        // Refresh orders to reflect new status and tracking info
        fetchOrders()
      } else {
        alert(data.error || 'Eroare la generarea AWB Sameday')
      }
    } catch (error) {
      console.error('Eroare la generarea AWB Sameday:', error)
      alert('Eroare la generarea AWB Sameday')
    } finally {
      setAwbLoading((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  const generateInvoice = async (orderId) => {
    try {
      setInvoiceLoading((prev) => ({ ...prev, [orderId]: true }))

      const response = await fetch('/api/billing/invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await response.json()

      if (data.success) {
        setInvoiceResult((prev) => ({
          ...prev,
          [orderId]: {
            invoiceNumber: data.data.invoiceNumber,
            invoiceSeries: data.data.invoiceSeries,
            invoiceLink: data.data.invoiceLink,
          },
        }))
        alert(`Factura generata cu succes: ${data.data.invoiceSeries || ''}${data.data.invoiceNumber || ''}`)
      } else {
        alert(data.error || 'Eroare la generarea facturii')
      }
    } catch (error) {
      console.error('Eroare la generarea facturii:', error)
      alert('Eroare la generarea facturii')
    } finally {
      setInvoiceLoading((prev) => ({ ...prev, [orderId]: false }))
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

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Se incarca...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Gestionare comenzi</h1>
        <Link href="/admin" className={styles.backLink}>Inapoi la panou</Link>
      </div>

      <div className={styles.filterBar}>
        <label className={styles.filterLabel}>Filtreaza dupa status:</label>
        <select
          className={styles.filterSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className={styles.orderCount}>{orders.length} comenzi</span>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nr. comanda</th>
              <th>Client</th>
              <th>Produse</th>
              <th>Total</th>
              <th>Status</th>
              <th>Plata</th>
              <th>Data</th>
              <th>Actiuni</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <>
                <tr key={order._id}>
                  <td className={styles.orderNumber}>{order.orderNumber}</td>
                  <td>{order.customer?.name || 'N/A'}</td>
                  <td>{order.items?.length || 0}</td>
                  <td className={styles.price}>{order.total.toFixed(2)} lei</td>
                  <td>
                    <span className={`${styles.status} ${styles[order.status]}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                  </td>
                  <td>
                    <span className={`${styles.paymentStatus} ${styles['payment_' + (order.paymentStatus || 'unpaid')]}`}>
                      {PAYMENT_STATUS_LABELS[order.paymentStatus] || PAYMENT_STATUS_LABELS.unpaid}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString('ro-RO')}</td>
                  <td>
                    <button
                      className={styles.detailsBtn}
                      onClick={() => toggleOrderExpand(order._id)}
                    >
                      {expandedOrder === order._id ? 'Ascunde' : 'Detalii'}
                    </button>
                  </td>
                </tr>

                {expandedOrder === order._id && (
                  <tr key={`${order._id}-expanded`}>
                    <td colSpan="8" className={styles.expandedCell}>
                      <div className={styles.expandedContent}>
                        {/* Order Items */}
                        {order.items && order.items.length > 0 && (
                          <div className={styles.orderItemsSection}>
                            <h4 className={styles.expandedTitle}>Produse comandate</h4>
                            <div className={styles.orderItemsList}>
                              {order.items.map((item, idx) => (
                                <div key={idx} className={styles.orderItem}>
                                  {item.image && (
                                    <img src={item.image} alt={item.name} className={styles.orderItemImg} />
                                  )}
                                  <div className={styles.orderItemInfo}>
                                    <span className={styles.orderItemName}>{item.name}</span>
                                    <span className={styles.orderItemMeta}>
                                      {item.quantity} x {Number(item.price).toFixed(2)} lei = {(item.quantity * item.price).toFixed(2)} lei
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Shipping & Customer Info */}
                        <div className={styles.shippingSection}>
                          <h4 className={styles.expandedTitle}>Informatii livrare</h4>
                          <div className={styles.shippingGrid}>
                            <div>
                              <strong>Client:</strong> {order.customer?.name || 'N/A'}
                            </div>
                            <div>
                              <strong>Email:</strong> {order.customer?.email || 'N/A'}
                            </div>
                            {order.customer?.phone && (
                              <div>
                                <strong>Telefon:</strong> {order.customer.phone}
                              </div>
                            )}
                            {order.shippingAddress && (
                              <div className={styles.shippingAddress}>
                                <strong>Adresa:</strong>{' '}
                                {[
                                  order.shippingAddress.street,
                                  order.shippingAddress.city,
                                  order.shippingAddress.state,
                                  order.shippingAddress.zip,
                                  order.shippingAddress.country,
                                ].filter(Boolean).join(', ')}
                              </div>
                            )}
                            {order.paymentMethod && (
                              <div>
                                <strong>Metoda plata:</strong> {order.paymentMethod}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Sameday AWB Generation */}
                        {order.status === 'processing' && !order.trackingNumber && !awbResults[order._id] && (
                          <div className={styles.updateSection}>
                            <h4 className={styles.expandedTitle}>Expediere Sameday</h4>
                            <button
                              className={styles.detailsBtn}
                              style={{ backgroundColor: '#e53e3e', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                              onClick={() => generateSamedayAWB(order._id)}
                              disabled={awbLoading[order._id]}
                            >
                              {awbLoading[order._id] ? 'Se genereaza...' : 'Genereaza AWB Sameday'}
                            </button>
                          </div>
                        )}

                        {/* Show AWB result after generation */}
                        {awbResults[order._id] && (
                          <div className={styles.updateSection}>
                            <h4 className={styles.expandedTitle}>AWB Sameday generat</h4>
                            <div className={styles.shippingGrid}>
                              <div>
                                <strong>Numar AWB:</strong> {awbResults[order._id].awbNumber}
                              </div>
                              <div>
                                <strong>Tracking URL:</strong>{' '}
                                <a href={awbResults[order._id].trackingUrl} target="_blank" rel="noopener noreferrer">
                                  {awbResults[order._id].trackingUrl}
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Show existing tracking info if already shipped via Sameday */}
                        {order.trackingNumber && !awbResults[order._id] && (
                          <div className={styles.updateSection}>
                            <h4 className={styles.expandedTitle}>Informatii AWB</h4>
                            <div className={styles.shippingGrid}>
                              <div>
                                <strong>Numar AWB:</strong> {order.trackingNumber}
                              </div>
                              {order.trackingUrl && (
                                <div>
                                  <strong>Tracking URL:</strong>{' '}
                                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                                    {order.trackingUrl}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Oblio Invoice Generation */}
                        {(order.paymentStatus === 'paid' || order.paymentMethod === 'ramburs' || order.paymentMethod === 'cod') && !invoiceResult[order._id] && (
                          <div className={styles.updateSection}>
                            <h4 className={styles.expandedTitle}>Facturare Oblio</h4>
                            <button
                              className={styles.detailsBtn}
                              style={{ backgroundColor: '#2563eb', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                              onClick={() => generateInvoice(order._id)}
                              disabled={invoiceLoading[order._id]}
                            >
                              {invoiceLoading[order._id] ? 'Se genereaza...' : 'Genereaza factura'}
                            </button>
                          </div>
                        )}

                        {/* Show invoice result after generation */}
                        {invoiceResult[order._id] && (
                          <div className={styles.updateSection}>
                            <h4 className={styles.expandedTitle}>Factura generata</h4>
                            <div className={styles.shippingGrid}>
                              <div>
                                <strong>Numar factura:</strong> {invoiceResult[order._id].invoiceSeries}{invoiceResult[order._id].invoiceNumber}
                              </div>
                              {invoiceResult[order._id].invoiceLink && (
                                <div>
                                  <strong>Link factura:</strong>{' '}
                                  <a href={invoiceResult[order._id].invoiceLink} target="_blank" rel="noopener noreferrer">
                                    Descarca PDF
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        <div className={styles.updateSection}>
                          <h4 className={styles.expandedTitle}>Actualizeaza status si tracking</h4>
                          <div className={styles.updateGrid}>
                            <div className={styles.formGroup}>
                              <label>Status nou:</label>
                              <select
                                className={styles.statusSelect}
                                value={order.status}
                                onChange={(e) => updateStatus(order._id, e.target.value)}
                              >
                                <option value="pending">In asteptare</option>
                                <option value="processing">In procesare</option>
                                <option value="shipped">Expediat</option>
                                <option value="delivered">Livrat</option>
                                <option value="cancelled">Anulat</option>
                              </select>
                            </div>

                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <>
                                <div className={styles.formGroup}>
                                  <label>Numar de tracking:</label>
                                  <input
                                    type="text"
                                    className={styles.trackingInput}
                                    placeholder="Introdu numarul de tracking"
                                    value={trackingData[order._id]?.trackingNumber || ''}
                                    onChange={(e) =>
                                      handleTrackingChange(order._id, 'trackingNumber', e.target.value)
                                    }
                                  />
                                </div>
                                <div className={styles.formGroup}>
                                  <label>URL tracking:</label>
                                  <input
                                    type="url"
                                    className={styles.trackingInput}
                                    placeholder="Introdu URL-ul de tracking"
                                    value={trackingData[order._id]?.trackingUrl || ''}
                                    onChange={(e) =>
                                      handleTrackingChange(order._id, 'trackingUrl', e.target.value)
                                    }
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {emailLogs[order._id] && (
                          <div className={styles.emailSection}>
                            <h4 className={styles.expandedTitle}>Istoric emailuri</h4>
                            {emailLogs[order._id].length === 0 ? (
                              <p className={styles.noEmails}>Niciun email trimis pentru aceasta comanda</p>
                            ) : (
                              <div className={styles.emailList}>
                                {emailLogs[order._id].map((log) => (
                                  <div key={log._id} className={styles.emailCard}>
                                    <div className={styles.emailInfo}>
                                      <strong className={styles.emailType}>
                                        {log.type.replace('_', ' ')}
                                      </strong>
                                      <div className={styles.emailMeta}>{log.subject}</div>
                                      <div className={styles.emailMeta}>{log.recipient}</div>
                                      <div
                                        className={`${styles.emailStatus} ${
                                          log.status === 'sent'
                                            ? styles.emailSent
                                            : log.status === 'failed'
                                            ? styles.emailFailed
                                            : ''
                                        }`}
                                      >
                                        Status: {log.status}
                                      </div>
                                      {log.error && (
                                        <div className={styles.emailError}>Eroare: {log.error}</div>
                                      )}
                                    </div>
                                    <button
                                      className={styles.resendBtn}
                                      onClick={() => resendEmail(log._id)}
                                      disabled={resending[log._id]}
                                    >
                                      {resending[log._id] ? 'Se retrimite...' : 'Retrimite'}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {orders.length === 0 && (
        <div className={styles.emptyState}>Nicio comanda gasita.</div>
      )}
    </div>
  )
}
