'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from '@/styles/product-detail.module.css'

export default function ProductDetail({ params }) {
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${params.id}`
      )
      const data = await response.json()

      if (!data.success) {
        setError('Product not found')
        return
      }

      setProduct(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    console.log(`Added ${quantity} of ${product.name} to cart`)
    // TODO: Implement cart functionality
  }

  if (loading) return <div className={styles.loading}>Loading...</div>
  if (error) return <div className={styles.error}>Error: {error}</div>
  if (!product) return <div className={styles.error}>Product not found</div>

  return (
    <div className={styles.container}>
      <Link href="/products" className={styles.back}>← Back to Products</Link>

      <div className={styles.content}>
        <div className={styles.imageSection}>
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <div className={styles.placeholder}>No Image Available</div>
          )}
        </div>

        <div className={styles.details}>
          <h1>{product.name}</h1>

          <div className={styles.meta}>
            <span className={styles.category}>{product.category}</span>
            <span className={styles.sku}>SKU: {product.sku}</span>
          </div>

          <p className={styles.description}>{product.description}</p>

          <div className={styles.rating}>
            <span className={styles.stars}>★ {product.rating}</span>
            <span className={styles.reviews}>({product.reviews} reviews)</span>
          </div>

          <div className={styles.pricing}>
            <p className={styles.price}>${product.price}</p>
            <p className={styles.stock}>
              {product.stock > 0 ? (
                <span className={styles.inStock}>{product.stock} in stock</span>
              ) : (
                <span className={styles.outOfStock}>Out of stock</span>
              )}
            </p>
          </div>

          <div className={styles.actions}>
            <div className={styles.quantity}>
              <label htmlFor="quantity">Quantity:</label>
              <input
                id="quantity"
                type="number"
                min="1"
                max={product.stock}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={product.stock === 0}
              />
            </div>

            <button
              className={styles.addToCart}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              Add to Cart
            </button>
          </div>

          {product.tags && product.tags.length > 0 && (
            <div className={styles.tags}>
              <h3>Tags:</h3>
              {product.tags.map((tag) => (
                <span key={tag} className={styles.tag}>{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
