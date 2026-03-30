'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from '@/styles/cart.module.css'

export default function CartPage() {
  const router = useRouter()
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const response = await fetch(`/api/cart`)

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      const data = await response.json()

      if (data.success) {
        setCart(data.data)
      } else {
        setError(data.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return

    try {
      const response = await fetch(
        `/api/cart/${itemId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: newQuantity }),
        }
      )

      const data = await response.json()
      if (data.success) {
        setCart(data.data)
      }
    } catch (err) {
      console.error('Error updating quantity:', err)
    }
  }

  const handleRemoveItem = async (itemId) => {
    try {
      const response = await fetch(
        `/api/cart/${itemId}`,
        {
          method: 'DELETE',
        }
      )

      const data = await response.json()
      if (data.success) {
        setCart(data.data)
      }
    } catch (err) {
      console.error('Error removing item:', err)
    }
  }

  const handleCheckout = () => {
    router.push('/checkout')
  }

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (error) return <div className={styles.error}>Error: {error}</div>

  if (!cart || cart.items.length === 0) {
    return (
      <div className={styles.empty}>
        <h1>Your Cart is Empty</h1>
        <p>Continue shopping and add items to your cart.</p>
        <Link href="/products" className={styles.continueLink}>
          Continue Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h1>Shopping Cart</h1>

      <div className={styles.content}>
        <div className={styles.itemsSection}>
          {cart.items.map((item) => (
            <div key={item._id} className={styles.cartItem}>
              <img src={item.image} alt={item.name} />
              <div className={styles.itemDetails}>
                <h3>{item.name}</h3>
                <p className={styles.price}>${item.price}</p>
              </div>

              <div className={styles.quantity}>
                <button
                  onClick={() =>
                    handleQuantityChange(item._id, item.quantity - 1)
                  }
                >
                  −
                </button>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(item._id, parseInt(e.target.value))
                  }
                  min="1"
                />
                <button
                  onClick={() =>
                    handleQuantityChange(item._id, item.quantity + 1)
                  }
                >
                  +
                </button>
              </div>

              <p className={styles.subtotal}>
                ${(item.price * item.quantity).toFixed(2)}
              </p>

              <button
                className={styles.removeBtn}
                onClick={() => handleRemoveItem(item._id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className={styles.summarySection}>
          <h2>Order Summary</h2>
          <div className={styles.summaryLine}>
            <span>Subtotal:</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>
          <div className={styles.summaryLine}>
            <span>Shipping:</span>
            <span>FREE</span>
          </div>
          <div className={styles.summaryLine + ' ' + styles.total}>
            <span>Total:</span>
            <span>${cart.total.toFixed(2)}</span>
          </div>

          <button
            className={styles.checkoutBtn}
            onClick={handleCheckout}
          >
            Proceed to Checkout
          </button>

          <Link href="/products" className={styles.continueLink}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
