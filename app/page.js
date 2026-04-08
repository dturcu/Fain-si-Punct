'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from '@/styles/home.module.css'

function StarRating({ rating, count }) {
  const stars = []
  const rounded = Math.round(rating * 2) / 2
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rounded)) {
      stars.push(<span key={i} className={styles.starFilled}>&#9733;</span>)
    } else if (i - 0.5 === rounded) {
      stars.push(<span key={i} className={styles.starHalf}>&#9733;</span>)
    } else {
      stars.push(<span key={i} className={styles.starEmpty}>&#9733;</span>)
    }
  }
  return (
    <span className={styles.starRating}>
      {stars}
      {count !== undefined && <span className={styles.reviewCount}>({count})</span>}
    </span>
  )
}

function getCategoryIcon(name) {
  const icons = {
    'Electronics': '🖥️',
    'Clothing': '👕',
    'Home & Garden': '🏡',
    'Sports': '⚽',
    'Sports & Outdoors': '🏕️',
    'Books': '📚',
    'Toys': '🧸',
    'Toys & Games': '🎮',
    'Beauty': '💄',
    'Health': '💊',
    'Health & Beauty': '💆',
    'Automotive': '🚗',
    'Tools': '🔧',
    'Baby': '👶',
    'Office': '📎',
    'Pets': '🐾',
    'Pet Supplies': '🐾',
    'Kitchen': '🍳',
    'Garden': '🌱',
    'Furniture': '🪑',
    'Food & Beverages': '🍔',
    'Music': '🎵',
    'Movies': '🎬',
    'Jewelry': '💍',
    'Shoes': '👟',
    'Uncategorized': '📦',
  }
  return icons[name] || '🛍️'
}

export default function Home() {
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalProducts, setTotalProducts] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [catRes, prodRes] = await Promise.all([
          fetch('/api/products/categories'),
          fetch('/api/products?limit=8&sort=-avgRating'),
        ])
        const catData = await catRes.json()
        const prodData = await prodRes.json()

        if (catData.success) {
          setCategories(catData.data)
          setTotalProducts(catData.total || catData.data.reduce((sum, c) => sum + c.count, 0))
        }
        if (prodData.success) {
          setProducts(prodData.data || [])
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner} />
        <p>Se incarca...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Eroare la incarcarea datelor. Incearca din nou.</p>
        <button onClick={() => router.refresh()} className={styles.retryBtn}>
          Reincearca
        </button>
      </div>
    )
  }

  const displayCategories = categories.slice(0, 12)
  const hasMoreCategories = categories.length > 12

  return (
    <div className={styles.page}>
      {/* Hero Banner — Full Bleed */}
      <div className={styles.heroFullBleed}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Descopera mii de produse la cele mai bune preturi
            </h1>
            <p className={styles.heroSubtitle}>
              Peste {totalProducts.toLocaleString('ro-RO')} produse din {categories.length} categorii te asteapta
            </p>
            <form className={styles.heroSearch} onSubmit={handleSearch}>
              <input
                type="text"
                className={styles.heroSearchInput}
                placeholder="Cauta produse, categorii, marci..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className={styles.heroSearchBtn}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                Cauta
              </button>
            </form>
            <Link href="/products" className={styles.heroCta}>
              Exploreaza produsele &rarr;
            </Link>
          </div>
        </section>
      </div>

      {/* Benefits Bar — Floating Card */}
      <section className={styles.benefits}>
        <div className={styles.benefitsGrid}>
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" rx="2" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </div>
            <div>
              <strong>Livrare rapida</strong>
              <span>In toata tara</span>
            </div>
          </div>
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div>
              <strong>Plata securizata</strong>
              <span>Card sau ramburs</span>
            </div>
          </div>
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </div>
            <div>
              <strong>Retur gratuit 30 zile</strong>
              <span>Fara griji</span>
            </div>
          </div>
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div>
              <strong>Suport 24/7</strong>
              <span>Suntem aici pentru tine</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={`${styles.sectionTitle} ${styles.sectionHeading}`}>Categorii populare</h2>
          {hasMoreCategories && (
            <Link href="/products" className={styles.seeAllBtn}>
              Vezi toate categoriile &rarr;
            </Link>
          )}
        </div>
        <div className={styles.categoryGrid}>
          {displayCategories.map((cat) => (
            <Link
              key={cat.name}
              href={`/products?category=${encodeURIComponent(cat.name)}`}
              className={styles.categoryCard}
            >
              <span className={styles.categoryIcon}>{getCategoryIcon(cat.name)}</span>
              <span className={styles.categoryName}>{cat.name}</span>
              <span className={styles.categoryCount}>{cat.count} produse</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      {products.length > 0 && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={`${styles.sectionTitle} ${styles.sectionHeading}`}>Produse populare</h2>
            <Link href="/products" className={styles.seeAllBtn}>
              Vezi toate produsele &rarr;
            </Link>
          </div>
          <div className={styles.productGrid}>
            {products.map((product) => {
              const hasDiscount = product.totalRrp > product.price
              const discountPercent = hasDiscount
                ? Math.round((1 - product.price / product.totalRrp) * 100)
                : 0
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.id}`}
                  className={styles.productCard}
                >
                  <div className={styles.cardImageWrap}>
                    {hasDiscount && (
                      <span className={styles.discountBadge}>-{discountPercent}%</span>
                    )}
                    <img
                      src={product.image || (product.images && product.images[0]) || '/placeholder.png'}
                      alt={product.name}
                      className={styles.productImage}
                    />
                  </div>
                  <div className={styles.productInfo}>
                    <h3 className={`${styles.productName} ${styles.cardName}`}>{product.name}</h3>
                    <StarRating
                      rating={product.avgRating || 0}
                      count={product.reviewCount}
                    />
                    <span className={styles.productPrice}>
                      {product.price?.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} lei
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Bottom CTA — Full Bleed */}
      <div className={styles.bottomCtaFullBleed}>
        <section className={styles.bottomCta}>
          <h2>Nu ai gasit ce cautai?</h2>
          <p>Exploreaza intregul nostru catalog de produse</p>
          <Link href="/products" className={styles.heroCta}>
            Vezi toate produsele &rarr;
          </Link>
        </section>
      </div>
    </div>
  )
}
