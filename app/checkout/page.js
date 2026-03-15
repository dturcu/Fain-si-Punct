'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/styles/checkout.module.css'

export default function CheckoutPage() {
  const router = useRouter()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: '',
  })

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cart`)

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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/checkout`, {
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
        }),
      })

      const data = await response.json()

      if (data.success) {
        alert(`Order placed successfully! Order #: ${data.data.orderNumber}`)
        router.push('/')
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (err) {
      alert(`Error: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div>Loading...</div>

  if (!cart || cart.items.length === 0) {
    return (
      <div className={styles.empty}>
        <h1>Your Cart is Empty</h1>
        <button onClick={() => router.push('/products')}>
          Back to Products
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1>Checkout</h1>

      <div className={styles.content}>
        <div className={styles.formSection}>
          <form onSubmit={handleSubmit}>
            <h2>Shipping Information</h2>

            <div className={styles.row}>
              <input
                type="text"
                name="firstName"
                placeholder="First Name"
                required
                value={formData.firstName}
                onChange={handleChange}
              />
              <input
                type="text"
                name="lastName"
                placeholder="Last Name"
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
              placeholder="Phone"
              required
              value={formData.phone}
              onChange={handleChange}
            />

            <input
              type="text"
              name="street"
              placeholder="Street Address"
              required
              value={formData.street}
              onChange={handleChange}
            />

            <div className={styles.row}>
              <input
                type="text"
                name="city"
                placeholder="City"
                required
                value={formData.city}
                onChange={handleChange}
              />
              <input
                type="text"
                name="state"
                placeholder="State/Province"
                required
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className={styles.row}>
              <input
                type="text"
                name="zip"
                placeholder="ZIP Code"
                required
                value={formData.zip}
                onChange={handleChange}
              />
              <input
                type="text"
                name="country"
                placeholder="Country"
                required
                value={formData.country}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting}
            >
              {submitting ? 'Processing...' : 'Place Order'}
            </button>
          </form>
        </div>

        <div className={styles.summarySection}>
          <h2>Order Summary</h2>

          <div className={styles.itemsList}>
            {cart.items.map((item) => (
              <div key={item._id} className={styles.summaryItem}>
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
            <span>Shipping:</span>
            <span>FREE</span>
          </div>
          <div className={`${styles.summaryLine} ${styles.total}`}>
            <span>Total:</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
