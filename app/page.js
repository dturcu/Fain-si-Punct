'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from '@/styles/home.module.css'

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products?limit=12`
      )
      const data = await response.json()
      setProducts(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className={styles.container}>
      <h1>Welcome to Our Store</h1>
      <p>Browse from {products.length}+ products</p>

      <div className={styles.grid}>
        {products.map((product) => (
          <Link key={product._id} href={`/products/${product._id}`}>
            <div className={styles.card}>
              <div className={styles.image}>
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <div className={styles.placeholder}>No Image</div>
                )}
              </div>
              <h2>{product.name}</h2>
              <p className={styles.category}>{product.category}</p>
              <p className={styles.price}>${product.price}</p>
              <div className={styles.rating}>
                ★ {product.rating} ({product.reviews} reviews)
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
