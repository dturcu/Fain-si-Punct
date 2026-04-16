'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from '@/styles/checkout.module.css'

const ALL_PAYMENT_METHODS = [
  {
    id: 'card',
    label: 'Card bancar',
    subtitle: 'Visa, Mastercard, Maestro',
    icon: '\u{1F4B3}',
  },
  {
    id: 'revolut',
    label: 'Revolut Pay',
    subtitle: 'Plateste cu Revolut',
    icon: '\u{1F504}',
  },
  {
    id: 'paypal',
    label: 'PayPal',
    subtitle: 'Plateste cu contul PayPal',
    icon: '\u{1F17F}\uFE0F',
  },
  {
    id: 'ramburs',
    label: 'Ramburs (Plata la livrare)',
    subtitle: 'Platesti cand primesti coletul',
    icon: '\u{1F4E6}',
  },
]

// Guests can only use these payment methods
const GUEST_ALLOWED_PAYMENT_IDS = ['card', 'ramburs']

const SHIPPING_THRESHOLD = 200
const SHIPPING_COST = 15.99

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [errors, setErrors] = useState({})
  const [attempted, setAttempted] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [isGuest, setIsGuest] = useState(true)
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
        // Not authenticated — guest mode: try localStorage cart
        setIsGuest(true)
        const raw = typeof window !== 'undefined' ? localStorage.getItem('guestCart') : null
        const guestItems = raw ? JSON.parse(raw) : []
        if (!guestItems || guestItems.length === 0) {
          router.push('/products')
          return
        }
        const total = guestItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
        setCart({ items: guestItems, total })
        setLoading(false)
        return
      }

      const data = await response.json()
      if (data.success) {
        if (!data.data || !data.data.items || data.data.items.length === 0) {
          router.push('/cart')
          return
        }
        setIsGuest(false)
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
    if (attempted) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.firstName.trim()) newErrors.firstName = true
    if (!formData.lastName.trim()) newErrors.lastName = true
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = true
    if (!formData.phone.trim()) newErrors.phone = true
    if (!formData.street.trim()) newErrors.street = true
    if (!formData.city.trim()) newErrors.city = true
    if (!formData.state.trim()) newErrors.state = true
    if (!formData.zip.trim()) newErrors.zip = true
    if (!formData.country.trim()) newErrors.country = true
    return newErrors
  }

  // Filter payment methods based on auth state
  const availablePaymentMethods = isGuest
    ? ALL_PAYMENT_METHODS.filter((m) => GUEST_ALLOWED_PAYMENT_IDS.includes(m.id))
    : ALL_PAYMENT_METHODS

  const shippingCost =
    cart && cart.total >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
  const orderTotal = cart ? cart.total + shippingCost : 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setAttempted(true)

    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSubmitting(true)

    try {
      const body = {
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
      }

      if (isGuest) {
        body.guestItems = cart.items
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (data.success) {
        const order = data.data

        // Clear guest cart after successful order
        if (isGuest && typeof window !== 'undefined') {
          localStorage.removeItem('guestCart')
          window.dispatchEvent(new Event('cart-updated'))
        }

        if (paymentMethod === 'ramburs') {
          router.push(`/orders/${order.id}?status=confirmed`)
        } else {
          router.push(`/orders/${order.id}?pay=${paymentMethod}`)
        }
      } else {
        setCheckoutError(data.error || 'A aparut o eroare. Te rugam sa incerci din nou.')
      }
    } catch (err) {
      setCheckoutError('Eroare de retea. Verifica conexiunea si incearca din nou.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = (field) =>
    `${styles.input} ${attempted && errors[field] ? styles.inputError : ''}`

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

  const isRamburs = paymentMethod === 'ramburs'

  return (
    <div className={styles.container}>
      {/* Breadcrumbs */}
      <nav className={styles.breadcrumbs}>
        <a href="/">Acasa</a>
        <span className={styles.breadcrumbSep}>&gt;</span>
        <a href="/cart">Cos</a>
        <span className={styles.breadcrumbSep}>&gt;</span>
        <span className={styles.breadcrumbActive}>Finalizare comanda</span>
      </nav>

      {/* Step Indicator */}
      <div className={styles.steps}>
        <div className={styles.step}>
          <span className={styles.stepNumber}>1</span>
          <span className={styles.stepLabel}>Cos</span>
        </div>
        <div className={styles.stepDivider} />
        <div className={`${styles.step} ${styles.stepActive}`}>
          <span className={`${styles.stepNumber} ${styles.stepNumberActive}`}>2</span>
          <span className={styles.stepLabel}>Livrare</span>
        </div>
        <div className={styles.stepDivider} />
        <div className={styles.step}>
          <span className={styles.stepNumber}>3</span>
          <span className={styles.stepLabel}>Plata</span>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.formSection}>
          <form onSubmit={handleSubmit} noValidate>
            <h2>Informatii livrare</h2>

            {/* Guest / auth banner */}
            {isGuest && (
              <div className={styles.guestBanner}>
                Continui ca oaspete. Ai cont?
                <a href="/auth/login?redirect=/checkout" className={styles.guestBannerLink}>
                  Autentifica-te
                </a>
              </div>
            )}

            {checkoutError && (
              <div className={styles.checkoutError} role="alert">
                {checkoutError}
              </div>
            )}

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="firstName">Prenume</label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  placeholder="Prenume"
                  autoComplete="given-name"
                  className={inputClass('firstName')}
                  value={formData.firstName}
                  onChange={handleChange}
                />
                {attempted && errors.firstName && (
                  <span className={styles.fieldError}>Prenumele este obligatoriu</span>
                )}
              </div>
              <div className={styles.field}>
                <label htmlFor="lastName">Nume</label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  placeholder="Nume"
                  autoComplete="family-name"
                  className={inputClass('lastName')}
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {attempted && errors.lastName && (
                  <span className={styles.fieldError}>Numele este obligatoriu</span>
                )}
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="exemplu@email.com"
                autoComplete="email"
                className={inputClass('email')}
                value={formData.email}
                onChange={handleChange}
              />
              {attempted && errors.email && (
                <span className={styles.fieldError}>Introdu o adresa de email valida</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="phone">Telefon</label>
              <input
                id="phone"
                type="tel"
                name="phone"
                placeholder="07XX XXX XXX"
                autoComplete="tel"
                className={inputClass('phone')}
                value={formData.phone}
                onChange={handleChange}
              />
              {attempted && errors.phone && (
                <span className={styles.fieldError}>Numarul de telefon este obligatoriu</span>
              )}
            </div>

            <div className={styles.field}>
              <label htmlFor="street">Adresa</label>
              <input
                id="street"
                type="text"
                name="street"
                placeholder="Strada, numar, bloc, apartament"
                autoComplete="address-line1"
                className={inputClass('street')}
                value={formData.street}
                onChange={handleChange}
              />
              {attempted && errors.street && (
                <span className={styles.fieldError}>Adresa este obligatorie</span>
              )}
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="city">Oras</label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  placeholder="Oras"
                  autoComplete="address-level2"
                  className={inputClass('city')}
                  value={formData.city}
                  onChange={handleChange}
                />
                {attempted && errors.city && (
                  <span className={styles.fieldError}>Orasul este obligatoriu</span>
                )}
              </div>
              <div className={styles.field}>
                <label htmlFor="state">Judet</label>
                <input
                  id="state"
                  type="text"
                  name="state"
                  placeholder="Judet"
                  autoComplete="address-level1"
                  className={inputClass('state')}
                  value={formData.state}
                  onChange={handleChange}
                />
                {attempted && errors.state && (
                  <span className={styles.fieldError}>Judetul este obligatoriu</span>
                )}
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label htmlFor="zip">Cod postal</label>
                <input
                  id="zip"
                  type="text"
                  name="zip"
                  placeholder="XXXXXX"
                  autoComplete="postal-code"
                  className={inputClass('zip')}
                  value={formData.zip}
                  onChange={handleChange}
                />
                {attempted && errors.zip && (
                  <span className={styles.fieldError}>Codul postal este obligatoriu</span>
                )}
              </div>
              <div className={styles.field}>
                <label htmlFor="country">Tara</label>
                <input
                  id="country"
                  type="text"
                  name="country"
                  placeholder="Tara"
                  autoComplete="country-name"
                  className={inputClass('country')}
                  value={formData.country}
                  onChange={handleChange}
                />
                {attempted && errors.country && (
                  <span className={styles.fieldError}>Tara este obligatorie</span>
                )}
              </div>
            </div>

            <h2 className={styles.paymentTitle}>Metoda de plata</h2>

            <div className={styles.paymentMethods}>
              {availablePaymentMethods.map((method) => (
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
                    <span className={styles.paymentSubtitle}>
                      {method.subtitle}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            {isRamburs && (
              <div className={styles.rambursNote}>
                Vei plati suma de{' '}
                <strong>{orderTotal.toFixed(2)} lei</strong> curierului la
                livrare. Se accepta numerar sau card la curier.
              </div>
            )}

            {/* Securitate trust section */}
            <div className={styles.trustSection}>
              <span className={styles.trustIcon}>&#128274;</span>
              <span className={styles.trustText}>
                Datele tale sunt protejate
              </span>
            </div>

            <button
              type="submit"
              className={`${styles.submitBtn} ${
                isRamburs ? styles.submitBtnGreen : styles.submitBtnGold
              }`}
              disabled={submitting}
            >
              {submitting
                ? 'Se proceseaza...'
                : isRamburs
                ? 'Plaseaza comanda (Plata la livrare)'
                : 'Continua catre plata'}
            </button>
          </form>
        </div>

        <div className={styles.summarySection}>
          <h2>Sumar comanda</h2>

          <div className={styles.itemsList}>
            {cart.items.map((item, i) => (
              <div key={item._id || item.productId || i} className={styles.summaryItem}>
                <div className={styles.summaryItemLeft}>
                  <Image
                    src={item.image}
                    alt={item.name}
                    width={40}
                    height={40}
                    className={styles.summaryItemImage}
                  />
                  <span className={styles.summaryItemName}>
                    {item.name} x {item.quantity}
                  </span>
                </div>
                <span className={styles.summaryItemPrice}>
                  {(item.price * item.quantity).toFixed(2)} lei
                </span>
              </div>
            ))}
          </div>

          <div className={styles.summaryLine}>
            <span>Subtotal:</span>
            <span>{cart.total.toFixed(2)} lei</span>
          </div>
          <div className={styles.summaryLine}>
            <span>Livrare:</span>
            <span>
              {shippingCost === 0 ? 'GRATIS' : `${shippingCost.toFixed(2)} lei`}
            </span>
          </div>
          {shippingCost === 0 && (
            <div className={styles.freeShippingNote}>
              Transport gratuit pentru comenzi peste {SHIPPING_THRESHOLD} lei
            </div>
          )}
          <div className={`${styles.summaryLine} ${styles.total}`}>
            <span>Total:</span>
            <span>{orderTotal.toFixed(2)} lei</span>
          </div>
        </div>
      </div>
    </div>
  )
}
