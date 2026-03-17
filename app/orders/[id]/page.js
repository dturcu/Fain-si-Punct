'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

/**
 * Order Confirmation Page - /orders/[id]
 * Display order details and payment status
 */
export default function OrderConfirmationPage() {
  const params = useParams()
  const orderId = params.id
  const [order, setOrder] = useState(null)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch(`/api/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch order')
      }

      const data = await response.json()
      setOrder(data.order)
      if (data.payment) {
        setPayment(data.payment)
      }
    } catch (err) {
      setError(err.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Loading order details...</div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="page">
        <div className="error-container">
          <h1>Order Not Found</h1>
          <p>{error || 'The order could not be loaded.'}</p>
          <Link href="/products" className="button">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const paymentStatusColor = {
    paid: '#10b981',
    processing: '#f59e0b',
    failed: '#ef4444',
    unpaid: '#6b7280',
  }

  const orderStatusColor = {
    pending: '#6b7280',
    processing: '#f59e0b',
    shipped: '#3b82f6',
    delivered: '#10b981',
    cancelled: '#ef4444',
  }

  return (
    <div className="page">
      <div className="container">
        <div className="header">
          <h1>Order Confirmation</h1>
          <p className="order-number">Order #{order.orderNumber}</p>
        </div>

        {order.paymentStatus === 'paid' && (
          <div className="success-message">
            <h3>Payment Successful!</h3>
            <p>Your order has been received and is being processed.</p>
          </div>
        )}

        {order.paymentStatus === 'processing' && (
          <div className="info-message">
            <h3>Payment Processing</h3>
            <p>Your payment is being processed. Please wait...</p>
          </div>
        )}

        {order.paymentStatus === 'failed' && (
          <div className="error-message">
            <h3>Payment Failed</h3>
            <p>Your payment could not be processed. Please try again.</p>
            <Link href={`/checkout?orderId=${order._id}`} className="button">
              Retry Payment
            </Link>
          </div>
        )}

        <div className="order-details-grid">
          {/* Order Status */}
          <div className="card">
            <h3>Order Status</h3>
            <div className="status-badge" style={{ color: orderStatusColor[order.status] }}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
            <p className="status-description">
              {getStatusDescription(order.status)}
            </p>
          </div>

          {/* Payment Status */}
          <div className="card">
            <h3>Payment Status</h3>
            <div
              className="status-badge"
              style={{ color: paymentStatusColor[order.paymentStatus] }}
            >
              {order.paymentStatus.charAt(0).toUpperCase() +
                order.paymentStatus.slice(1)}
            </div>
            {order.paymentMethod && (
              <p className="payment-method">
                Via {order.paymentMethod.charAt(0).toUpperCase() +
                  order.paymentMethod.slice(1)}
              </p>
            )}
          </div>

          {/* Order Total */}
          <div className="card">
            <h3>Order Total</h3>
            <div className="total-amount">
              ${(order.total / 100).toFixed(2)}
            </div>
            {order.paidAt && (
              <p className="paid-date">
                Paid on {new Date(order.paidAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="card full-width">
          <h3>Order Items</h3>
          <div className="items-table">
            <div className="table-header">
              <div className="col-name">Product</div>
              <div className="col-price">Price</div>
              <div className="col-qty">Qty</div>
              <div className="col-total">Total</div>
            </div>
            {order.items.map((item) => (
              <div key={item.productId} className="table-row">
                <div className="col-name">{item.name}</div>
                <div className="col-price">
                  ${(item.price / 100).toFixed(2)}
                </div>
                <div className="col-qty">{item.quantity}</div>
                <div className="col-total">
                  ${((item.price * item.quantity) / 100).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="card full-width">
            <h3>Shipping Address</h3>
            <address>
              {order.shippingAddress.street}
              <br />
              {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
              {order.shippingAddress.zip}
              <br />
              {order.shippingAddress.country}
            </address>
          </div>
        )}

        {/* Actions */}
        <div className="actions">
          <Link href="/products" className="button button-secondary">
            Continue Shopping
          </Link>
          <Link href="/" className="button">
            Return to Home
          </Link>
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background-color: #f3f4f6;
          padding: 32px 16px;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 32px;
        }

        .header h1 {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #1f2937;
        }

        .order-number {
          color: #6b7280;
          font-size: 18px;
        }

        .success-message,
        .info-message,
        .error-message {
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .success-message {
          background-color: #d1fae5;
          border: 1px solid #6ee7b7;
          color: #065f46;
        }

        .info-message {
          background-color: #fef3c7;
          border: 1px solid #fcd34d;
          color: #78350f;
        }

        .error-message {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
        }

        .success-message h3,
        .info-message h3,
        .error-message h3 {
          margin-top: 0;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .order-details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .card.full-width {
          grid-column: 1 / -1;
        }

        .card h3 {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .status-badge {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .status-description,
        .payment-method,
        .paid-date {
          color: #6b7280;
          font-size: 14px;
          margin: 0;
        }

        .total-amount {
          font-size: 32px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .items-table {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          background-color: #f3f4f6;
          padding: 12px;
          font-weight: 600;
          color: #1f2937;
          border-bottom: 2px solid #e5e7eb;
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          align-items: center;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .col-name {
          color: #1f2937;
          font-weight: 500;
        }

        .col-price,
        .col-qty,
        .col-total {
          text-align: right;
          color: #6b7280;
        }

        address {
          font-style: normal;
          line-height: 1.6;
          color: #1f2937;
        }

        .actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          margin-top: 32px;
        }

        .button {
          padding: 12px 24px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          text-align: center;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .button {
          background-color: #3b82f6;
          color: white;
        }

        .button:hover {
          background-color: #2563eb;
        }

        .button-secondary {
          background-color: white;
          color: #3b82f6;
          border: 2px solid #3b82f6;
        }

        .button-secondary:hover {
          background-color: #eff6ff;
        }

        .loading {
          text-align: center;
          color: #6b7280;
          padding: 32px;
          font-size: 16px;
        }

        @media (max-width: 640px) {
          .page {
            padding: 16px;
          }

          .header h1 {
            font-size: 24px;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr 1fr;
            font-size: 14px;
          }

          .col-price,
          .col-qty {
            display: none;
          }

          .actions {
            flex-direction: column;
          }

          .button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

/**
 * Get status description
 */
function getStatusDescription(status) {
  const descriptions = {
    pending: 'Your order is pending payment',
    processing: 'Your order is being prepared for shipment',
    shipped: 'Your order has been shipped',
    delivered: 'Your order has been delivered',
    cancelled: 'Your order has been cancelled',
  }
  return descriptions[status] || ''
}

/**
 * Get auth token from storage
 */
function getAuthToken() {
  if (typeof window === 'undefined') return ''

  const token = localStorage.getItem('token')
  if (token) return token

  const cookies = document.cookie.split('; ')
  const tokenCookie = cookies.find((c) => c.startsWith('token='))
  return tokenCookie ? tokenCookie.split('=')[1] : ''
}
