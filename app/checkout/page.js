'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/styles/checkout.module.css'

const PAYMENT_METHODS = [
  {
    id: 'card',
    label: 'Card bancar',
    subtitle: 'Visa, Mastercard, Maestro',
    icon: '💳',
  },
  {
    id: 'revolut',
    label: 'Revolut Pay',
    subtitle: 'Plateste cu Revolut',
    icon: '🔄',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    subtitle: 'Plateste cu contul PayPal',
    icon: '🅿️',
  },
  {
    id: 'ramburs',
    label: 'Ramburs (Plata la livrare)',
    subtitle: 'Platesti cand primesti coletul',
    icon: '📦',
  },
]

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'Romania',
  })

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart')

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      const data = await response.json()
      if (data.success) {
        setCart(data.data)
      }
    } catch (err) {
      console.error('Error fetching cart:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
          },
          shippingAddress: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
            country: formData.country,
          },
          paymentMethod,
        }),
      })

      const data = await response.json()

      if (data.success) {
        const order = data.data

        if (paymentMethod === 'ramburs') {
          router.push(`/orders/${order.id}?status=confirmed`)
        } else if (paymentMethod === 'card' || paymentMethod === 'revolut') {
          // For card/Revolut, redirect to payment page
          router.push(`/orders/${order.id}?pay=${paymentMethod}`)
        } else if (paymentMethod === 'paypal') {
          router.push(`/orders/${order.id}?pay=paypal`)
        }
      } else {
        alert(`Eroare: ${data.error}`)
      }
    } catch (err) {
      alert(`Eroare: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className={styles.loading}>Se incarca...</div>

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className={styles.empty}>
        <h1>Cosul tau este gol</h1>
        <p>Adauga produse in cos pentru a continua.</p>
        <button onClick={() => router.push('/products')}>
          Inapoi la produse
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1>Finalizare comanda</h1>

      <div className={styles.content}>
        <div className={styles.formSection}>
          <form onSubmit={handleSubmit}>
            <h2>Informatii livrare</h2>

            <div className={styles.row}>
              <input
                type="text"
                name="firstName"
                placeholder="Prenume"
                required
                value={formData.firstName}
                onChange={handleChange}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Nume"
                required
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>

            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={handleChange}
            />
            <input
              type="tel"
              name="phone"
              placeholder="Telefon"
              required
              value={formData.phone}
              onChange={handleChange}
            />

            <input
              type="text"
              name="street"
              placeholder="Adresa (strada, numar, bloc, apartament)"
              required
              value={formData.street}
              onChange={handleChange}
            />

            <div className={styles.row}>
              <input
                type="text"
                name="city"
                placeholder="Oras"
                required
                value={formData.city}
                onChange={handleChange}
              />
              <input
                type="text"
                name="state"
                placeholder="Judet"
                required
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className={styles.row}>
              <input
                type="text"
                name="zip"
                placeholder="Cod postal"
                required
                value={formData.zip}
                onChange={handleChange}
              />
              <input
                type="text"
                name="country"
                placeholder="Tara"
                required
                value={formData.country}
                onChange={handleChange}
              />
            </div>

            <h2 className={styles.paymentTitle}>Metoda de plata</h2>

            <div className={styles.paymentMethods}>
              {PAYMENT_METHODS.map((method) => (
                <label
                  key={method.id}
                  className={`${styles.paymentOption} ${
                    paymentMethod === method.id ? styles.paymentSelected : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span className={styles.paymentIcon}>{method.icon}</span>
                  <div className={styles.paymentInfo}>
                    <span className={styles.paymentLabel}>{method.label}</span>
                    <span className={styles.paymentSubtitle}>{method.subtitle}</span>
                  </div>
                </label>
              ))}
            </div>

            {paymentMethod === 'ramburs' && (
              <div className={styles.rambursNote}>
                Vei plati suma de <strong>${cart.total.toFixed(2)}</strong> curierului la livrare.
                Se accepta numerar sau card la curier.
              </div>
            )}

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting
                ? 'Se proceseaza...'
                : paymentMethod === 'ramburs'
                ? 'Plaseaza comanda (Plata la livrare)'
                : 'Continua catre plata'}
            </button>
          </form>
        </div>

        <div className={styles.summarySection}>
          <h2>Sumar comanda</h2>

          <div className={styles.itemsList}>
            {cart.items.map((item, i) => (
              <div key={item._id || i} className={styles.summaryItem}>
                <span>{item.name} x {item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className={styles.summaryLine}>
            <span>Subtotal:</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>
          <div className={styles.summaryLine}>
            <span>Livrare:</span>
            <span>GRATIS</span>
          </div>
          {paymentMethod === 'ramburs' && (
            <div className={styles.summaryLine}>
              <span>Taxa ramburs:</span>
              <span>$0.00</span>
            </div>
          )}
          <div className={`${styles.summaryLine} ${styles.total}`}>
            <span>Total:</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
