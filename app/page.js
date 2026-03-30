'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from '@/styles/home.module.css'

export default function Home() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalProducts, setTotalProducts] = useState(0)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products/categories')
      const data = await response.json()
      if (data.success) {
        setCategories(data.data)
        setTotalProducts(data.total || data.data.reduce((sum, c) => sum + c.count, 0))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className={styles.loading}>Se incarca...</div>
  if (error) return <div className={styles.error}>Eroare: {error}</div>

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1>Bine ai venit la ShopHub</h1>
        <p>Descopera peste {totalProducts.toLocaleString()} produse din {categories.length} categorii</p>
        <Link href="/products" className={styles.heroBtn}>
          Vezi toate produsele
        </Link>
      </div>

      <h2 className={styles.sectionTitle}>Categorii</h2>

      <div className={styles.grid}>
        {categories.map((cat) => (
          <Link key={cat.name} href={`/products?category=${encodeURIComponent(cat.name)}`}>
            <div className={styles.card}>
              <div className={styles.categoryIcon}>
                {getCategoryIcon(cat.name)}
              </div>
              <h3>{cat.name}</h3>
              <p className={styles.count}>{cat.count} produse</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function getCategoryIcon(name) {
  const icons = {
    'Electronics': '🔌',
    'Clothing': '👕',
    'Home & Garden': '🏡',
    'Sports': '⚽',
    'Sports & Outdoors': '🏕️',
    'Books': '📚',
    'Toys': '🧸',
    'Toys & Games': '🎮',
    'Beauty': '💄',
    'Health': '💊',
    'Health & Beauty': '💊',
    'Automotive': '🚗',
    'Tools': '🔧',
    'Baby': '👶',
    'Office': '📎',
    'Pets': '🐾',
    'Pet Supplies': '🐾',
    'Kitchen': '🍳',
    'Garden': '🌱',
    'Furniture': '🪑',
    'Uncategorized': '📦',
  }
  return icons[name] || '🛍️'
}
