'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import styles from '@/styles/order-detail.module.css'

export default function OrderDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = params.id
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)
  const [paymentDone, setPaymentDone] = useState(false)
  const [revolutToken, setRevolutToken] = useState(null)
  const [revolutLoading, setRevolutLoading] = useState(false)
  const revolutContainerRef = useRef(null)
  const revolutInitialized = useRef(false)

  const isConfirmed = searchParams.get('status') === 'confirmed'
  const payMethod = searchParams.get('pay')

  useEffect(() => {
    if (orderId) fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Comanda nu a fost gasita')
        return
      }

      setOrder(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Initialize Revolut payment for card/revolut
  const initRevolutPayment = useCallback(async () => {
    if (!orderId || revolutLoading || revolutToken) return
    setRevolutLoading(true)
    try {
      const res = await fetch('/api/payments/revolut/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (data.success) {
        setRevolutToken(data.data.token || data.data.publicId)
      } else {
        console.error('Revolut order creation failed:', data.error)
        // Fall back to simulated payment
        setRevolutToken(null)
      }
    } catch (err) {
      console.error('Revolut init error:', err)
    } finally {
      setRevolutLoading(false)
    }
  }, [orderId, revolutLoading, revolutToken])

  // Load Revolut widget when token is ready
  useEffect(() => {
    if (!revolutToken || !revolutContainerRef.current || revolutInitialized.current) return
    if (typeof window === 'undefined' || !window.RevolutCheckout) return

    revolutInitialized.current = true
    window.RevolutCheckout(revolutToken).then((instance) => {
      instance.payWithPopup({
        onSuccess() {
          setPaymentDone(true)
          fetchOrder()
          router.replace(`/orders/${orderId}`)
        },
        onError(error) {
          console.error('Revolut payment error:', error)
          setError('Plata a esuat. Te rugam sa incerci din nou.')
        },
        onCancel() {
          // User closed the popup
        },
      })
    }).catch((err) => {
      console.error('RevolutCheckout init error:', err)
    })
  }, [revolutToken, orderId])

  // Auto-init Revolut payment when payMethod is card or revolut
  useEffect(() => {
    if (payMethod && (payMethod === 'card' || payMethod === 'revolut') && order && !paymentDone) {
      initRevolutPayment()
    }
  }, [payMethod, order, paymentDone, initRevolutPayment])

  const handleSimulatePayment = async () => {
    setPaying(true)
    try {
      // Simulate payment processing delay
      await new Promise((r) => setTimeout(r, 2000))

      // Confirm payment via dedicated endpoint
      const payRes = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const payData = await payRes.json()
      if (!payData.success) {
        throw new Error(payData.error || 'Plata a esuat')
      }

      setPaymentDone(true)
      // Refresh order data
      await fetchOrder()

      // Remove pay param from URL
      router.replace(`/orders/${orderId}`)
    } catch (err) {
      setError('Eroare la procesarea platii: ' + err.message)
    } finally {
      setPaying(false)
    }
  }

  const formatPrice = (val) => parseFloat(val).toFixed(2) + ' lei'

  if (loading) return <div className={styles.loading}>Se incarca...</div>
  if (error || !order) {
    return (
      <div className={styles.errorPage}>
        <h1>Comanda nu a fost gasita</h1>
        <p>{error}</p>
        <Link href="/products" className={styles.btn}>Inapoi la produse</Link>
      </div>
    )
  }

  const paymentMethodLabels = {
    card: 'Card bancar',
    revolut: 'Revolut Pay',
    paypal: 'PayPal',
    ramburs: 'Plata la livrare',
  }

  return (
    <div className={styles.container}>
      {isConfirmed && (
        <div className={styles.successBanner}>
          <h3>Comanda a fost plasata cu succes!</h3>
          <p>Vei plati la livrare. Te vom contacta pentru confirmare.</p>
        </div>
      )}

      {paymentDone && (
        <div className={styles.successBanner}>
          <h3>Plata a fost procesata cu succes!</h3>
          <p>Comanda ta este acum in curs de pregatire.</p>
        </div>
      )}

      {payMethod && !paymentDone && (
        <div className={styles.infoBanner}>
          <h3>Finalizeaza plata</h3>
          <p>
            Metoda selectata: <strong>{paymentMethodLabels[payMethod] || payMethod}</strong>
          </p>
          <p>Total de plata: <strong>{formatPrice(order.total)}</strong></p>

          {/* Revolut Pay widget container for card/revolut */}
          {(payMethod === 'card' || payMethod === 'revolut') && (
            <>
              <Script
                src="https://sandbox-merchant.revolut.com/embed.js"
                strategy="afterInteractive"
                onLoad={() => {
                  if (revolutToken && !revolutInitialized.current) {
                    // Trigger re-render to init widget
                    setRevolutToken((t) => t)
                  }
                }}
              />
              <div ref={revolutContainerRef} id="revolut-payment-container" className={styles.revolutContainer} />
              {revolutLoading && (
                <p className={styles.payNote}>Se incarca formularul de plata Revolut...</p>
              )}
            </>
          )}

          {/* Fallback / manual pay button */}
          <button
            className={styles.payBtn}
            onClick={handleSimulatePayment}
            disabled={paying}
          >
            {paying ? (
              <>
                <span className={styles.paySpinner} />
                Se proceseaza plata...
              </>
            ) : (
              `Plateste ${formatPrice(order.total)} cu ${paymentMethodLabels[payMethod] || payMethod}`
            )}
          </button>
          {(payMethod === 'card' || payMethod === 'revolut') ? (
            <p className={styles.payNote}>
              Platile sunt procesate securizat prin Revolut Business.
              Butonul de mai sus confirma plata manual daca widgetul Revolut nu se incarca.
            </p>
          ) : (
            <p className={styles.payNote}>
              Plata este simulata in scopuri demonstrative.
            </p>
          )}
        </div>
      )}

      <div className={styles.header}>
        <h1>Comanda #{order.orderNumber}</h1>
        <p className={styles.date}>
          {new Date(order.createdAt).toLocaleDateString('ro-RO', {
            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })}
        </p>
      </div>

      <div className={styles.statusGrid}>
        <div className={styles.card}>
          <h3>Status comanda</h3>
          <span className={`${styles.badge} ${styles[order.status]}`}>
            {getStatusLabel(order.status)}
          </span>
          <p className={styles.statusDesc}>{getStatusDescription(order.status)}</p>
        </div>

        <div className={styles.card}>
          <h3>Status plata</h3>
          <span className={`${styles.badge} ${styles[order.paymentStatus]}`}>
            {getPaymentLabel(order.paymentStatus)}
          </span>
          {order.paymentMethod && (
            <p className={styles.meta}>
              Metoda: {paymentMethodLabels[order.paymentMethod] || order.paymentMethod}
            </p>
          )}
        </div>

        <div className={styles.card}>
          <h3>Total comanda</h3>
          <p className={styles.totalAmount}>{formatPrice(order.total)}</p>
        </div>
      </div>

      {/* Customer Info */}
      {order.customer && (
        <div className={styles.section}>
          <h2>Informatii client</h2>
          <div className={styles.infoGrid}>
            <div><strong>Nume:</strong> {order.customer.name}</div>
            <div><strong>Email:</strong> {order.customer.email}</div>
            {order.customer.phone && (
              <div><strong>Telefon:</strong> {order.customer.phone}</div>
            )}
          </div>
        </div>
      )}

      {/* Shipping Address */}
      {order.shippingAddress && order.shippingAddress.street && (
        <div className={styles.section}>
          <h2>Adresa de livrare</h2>
          <address className={styles.address}>
            {order.shippingAddress.street}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}<br />
            {order.shippingAddress.country}
          </address>
        </div>
      )}

      {/* Order Items */}
      {order.items && order.items.length > 0 && (
        <div className={styles.section}>
          <h2>Produse comandate ({order.items.length})</h2>
          <div className={styles.itemsTable}>
            <div className={styles.tableHeader}>
              <span>Produs</span>
              <span>Pret</span>
              <span>Cantitate</span>
              <span>Subtotal</span>
            </div>
            {order.items.map((item, i) => (
              <div key={i} className={styles.tableRow}>
                <div className={styles.itemName}>
                  {item.image && <img src={item.image} alt={item.name} className={styles.itemImg} />}
                  <span>{item.name}</span>
                </div>
                <span>{formatPrice(item.price)}</span>
                <span>{item.quantity}</span>
                <span className={styles.subtotal}>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className={styles.totalLine}>
            <span>Livrare:</span>
            <span>GRATIS</span>
          </div>
          <div className={styles.totalLineBold}>
            <span>Total:</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      )}

      {/* Tracking */}
      {order.trackingNumber && (
        <div className={styles.section}>
          <h2>Tracking</h2>
          <p><strong>Numar tracking:</strong> {order.trackingNumber}</p>
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className={styles.trackingLink}>
              Urmareste coletul
            </a>
          )}
        </div>
      )}

      <div className={styles.actions}>
        <Link href="/products" className={styles.btn}>Continua cumparaturile</Link>
        <Link href="/account" className={styles.btnSecondary}>Contul meu</Link>
      </div>
    </div>
  )
}

function getStatusLabel(status) {
  const labels = { pending: 'In asteptare', processing: 'Se proceseaza', shipped: 'Expediata', delivered: 'Livrata', cancelled: 'Anulata' }
  return labels[status] || status
}

function getPaymentLabel(status) {
  const labels = { unpaid: 'Neplatita', processing: 'Se proceseaza', paid: 'Platita', failed: 'Esuata', refunded: 'Rambursata' }
  return labels[status] || status
}

function getStatusDescription(status) {
  const desc = {
    pending: 'Comanda ta este in asteptare.',
    processing: 'Comanda ta este in curs de pregatire.',
    shipped: 'Comanda ta a fost expediata.',
    delivered: 'Comanda ta a fost livrata.',
    cancelled: 'Comanda ta a fost anulata.',
  }
  return desc[status] || ''
}
