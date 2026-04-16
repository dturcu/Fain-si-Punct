import Link from 'next/link'
import Image from 'next/image'
import styles from '@/styles/home.module.css'
import Testimonials from '@/components/Testimonials'
import HomeSearch from '@/components/HomeSearch'
import { getHomeCategories, getFeaturedProducts } from '@/lib/home-data'

// Revalidate home page every 5 minutes — categories and featured products
// change infrequently relative to page views.
export const revalidate = 300

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
    <span className={styles.starRating} aria-label={`${rating.toFixed(1)} din 5 stele`}>
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

export default async function Home() {
  const [{ categories, total: totalProducts }, products] = await Promise.all([
    getHomeCategories(),
    getFeaturedProducts(8),
  ])

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
            <HomeSearch />
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </div>
            <div>
              <strong>Retururi in 14 zile</strong>
              <span>Conform legislatiei</span>
            </div>
          </div>
          <div className={styles.benefitItem}>
            <div className={styles.benefitIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div>
              <strong>Suport prin email</strong>
              <span>Raspundem prompt</span>
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
              <span className={styles.categoryIcon} aria-hidden="true">{getCategoryIcon(cat.name)}</span>
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
            {products.map((product, idx) => {
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
                    <Image
                      src={product.image || (product.images && product.images[0]) || '/placeholder.png'}
                      alt={product.name}
                      width={400}
                      height={400}
                      className={styles.productImage}
                      sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      priority={idx < 4}
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

      {/* Testimonials */}
      <Testimonials />

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
