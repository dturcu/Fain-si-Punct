'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import styles from '@/styles/products.module.css'

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports',
  'Books',
  'Toys',
  'Beauty',
  'Health',
  'Automotive',
  'Tools',
]

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [page, category, search])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(category && { category }),
        ...(search && { search }),
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products?${params}`
      )
      const data = await response.json()
      setProducts(data.data)
      setTotal(data.pagination.total)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (e) => {
    setCategory(e.target.value)
    setPage(1)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  if (loading && products.length === 0) {
    return <div className={styles.loading}>Loading products...</div>
  }

  return (
    <div className={styles.container}>
      <h1>All Products ({total})</h1>

      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      <div className={styles.filterSection}>
        <label>Filter by Category:</label>
        <select value={category} onChange={handleCategoryChange}>
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

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
              <p className={styles.stock}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.pagination}>
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          disabled={page * 20 >= total}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
