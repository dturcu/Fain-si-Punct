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
  const [updatingItems, setUpdatingItems] = useState({})

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

    setUpdatingItems((prev) => ({ ...prev, [itemId]: true }))

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      })

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      const data = await response.json()
      if (data.success) {
        setCart(data.data)
        window.dispatchEvent(new Event('cart-updated'))
      }
    } catch (err) {
      console.error('Error updating quantity:', err)
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  const handleRemoveItem = async (itemId) => {
    setUpdatingItems((prev) => ({ ...prev, [itemId]: true }))

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
      })

      if (response.status === 401) {
        router.push('/auth/login')
        return
      }

      const data = await response.json()
      if (data.success) {
        setCart(data.data)
        window.dispatchEvent(new Event('cart-updated'))
      }
    } catch (err) {
      console.error('Error removing item:', err)
    } finally {
      setUpdatingItems((prev) => ({ ...prev, [itemId]: false }))
    }
  }

  const handleCheckout = () => {
    router.push('/checkout')
  }

  const getSubtotal = () => {
    if (!cart || !cart.items) return 0
    return cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  const getShipping = () => {
    const subtotal = getSubtotal()
    return subtotal >= 200 ? 0 : 15.99
  }

  const getTotal = () => {
    return getSubtotal() + getShipping()
  }

  const getItemCount = () => {
    if (!cart || !cart.items) return 0
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Se incarca cosul...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Eroare: {error}</p>
        <button onClick={fetchCart} className={styles.retryBtn}>
          Incearca din nou
        </button>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.breadcrumbs}>
          <Link href="/">Acasa</Link>
          <span className={styles.breadcrumbSep}>&gt;</span>
          <span>Cosul meu</span>
        </div>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M24 68C26.2091 68 28 66.2091 28 64C28 61.7909 26.2091 60 24 60C21.7909 60 20 61.7909 20 64C20 66.2091 21.7909 68 24 68Z"
                stroke="#bdc3c7"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M56 68C58.2091 68 60 66.2091 60 64C60 61.7909 58.2091 60 56 60C53.7909 60 52 61.7909 52 64C52 66.2091 53.7909 68 56 68Z"
                stroke="#bdc3c7"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4 4H16L22.68 47.39C22.9014 48.8504 23.6311 50.1769 24.7377 51.1413C25.8442 52.1057 27.2545 52.6392 28.72 52.64H54.72C56.1855 52.6392 57.5958 52.1057 58.7023 51.1413C59.8089 50.1769 60.5386 48.8504 60.76 47.39L65.2 20H18"
                stroke="#bdc3c7"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="34"
                y1="30"
                x2="50"
                y2="30"
                stroke="#bdc3c7"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>Cosul tau este gol</h2>
          <p className={styles.emptyText}>
            Descopera produsele noastre si adauga articole in cos.
          </p>
          <Link href="/products" className={styles.emptyShopLink}>
            Continua cumparaturile
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = getSubtotal()
  const shipping = getShipping()
  const total = getTotal()
  const itemCount = getItemCount()

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.breadcrumbs}>
        <Link href="/">Acasa</Link>
        <span className={styles.breadcrumbSep}>&gt;</span>
        <span>Cosul meu</span>
      </div>

      <h1 className={styles.pageTitle}>
        Cosul meu{' '}
        <span className={styles.itemCount}>
          ({itemCount} {itemCount === 1 ? 'produs' : 'produse'})
        </span>
      </h1>

      <div className={styles.cartLayout}>
        <div className={styles.itemsColumn}>
          <div className={styles.itemsCard}>
            <div className={styles.itemsHeader}>
              <span className={styles.colProduct}>Produs</span>
              <span className={styles.colPrice}>Pret unitar</span>
              <span className={styles.colQuantity}>Cantitate</span>
              <span className={styles.colSubtotal}>Subtotal</span>
              <span className={styles.colRemove}></span>
            </div>

            {cart.items.map((item) => (
              <div
                key={item._id}
                className={`${styles.cartItem} ${updatingItems[item._id] ? styles.cartItemUpdating : ''}`}
              >
                <div className={styles.productInfo}>
                  <Link
                    href={`/products/${item.productId}`}
                    className={styles.imageLink}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className={styles.productImage}
                    />
                  </Link>
                  <div className={styles.productDetails}>
                    <Link
                      href={`/products/${item.productId}`}
                      className={styles.productName}
                    >
                      {item.name}
                    </Link>
                    <span className={styles.mobilePrice}>
                      {item.price.toFixed(2)} lei
                    </span>
                  </div>
                </div>

                <div className={styles.priceCell}>
                  {item.price.toFixed(2)} lei
                </div>

                <div className={styles.quantityCell}>
                  <div className={styles.quantityControl}>
                    <button
                      className={styles.qtyBtn}
                      onClick={() =>
                        handleQuantityChange(item._id, item.quantity - 1)
                      }
                      disabled={item.quantity <= 1 || updatingItems[item._id]}
                      aria-label="Scade cantitatea"
                    >
                      &minus;
                    </button>
                    <input
                      type="number"
                      className={styles.qtyInput}
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value)
                        if (!isNaN(val) && val >= 1) {
                          handleQuantityChange(item._id, val)
                        }
                      }}
                      min="1"
                      disabled={updatingItems[item._id]}
                    />
                    <button
                      className={styles.qtyBtn}
                      onClick={() =>
                        handleQuantityChange(item._id, item.quantity + 1)
                      }
                      disabled={updatingItems[item._id]}
                      aria-label="Creste cantitatea"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className={styles.subtotalCell}>
                  {(item.price * item.quantity).toFixed(2)} lei
                </div>

                <div className={styles.removeCell}>
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemoveItem(item._id)}
                    disabled={updatingItems[item._id]}
                  >
                    Sterge
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.summaryColumn}>
          <div className={styles.summaryCard}>
            <h2 className={styles.summaryTitle}>Sumar comanda</h2>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)} lei</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Livrare</span>
              {shipping === 0 ? (
                <span className={styles.freeShipping}>GRATUITA</span>
              ) : (
                <span>{shipping.toFixed(2)} lei</span>
              )}
            </div>

            {shipping > 0 && (
              <div className={styles.shippingHint}>
                Mai adauga {(200 - subtotal).toFixed(2)} lei pentru livrare
                gratuita
              </div>
            )}

            <div className={styles.summaryDivider}></div>

            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span className={styles.totalPrice}>
                {total.toFixed(2)} lei
              </span>
            </div>

            <button className={styles.checkoutBtn} onClick={handleCheckout}>
              Finalizeaza comanda
            </button>

            <Link href="/products" className={styles.continueShopping}>
              Continua cumparaturile
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
