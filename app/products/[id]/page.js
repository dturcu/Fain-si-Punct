'use client'

import { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import StarRating from '@/components/StarRating'
import styles from '@/styles/product-detail.module.css'

export default function ProductDetail({ params: paramsPromise }) {
  const params = use(paramsPromise)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])
  const [relatedLoading, setRelatedLoading] = useState(false)
  const reviewsRef = useRef(null)

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  useEffect(() => {
    if (product) {
      fetchReviews()
      fetchRelatedProducts()
    }
  }, [product?.id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/products/${params.id}`)
      const data = await response.json()

      if (!data.success) {
        setError('Produsul nu a fost gasit')
        return
      }

      setProduct(data.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true)
      const response = await fetch(`/api/products/${params.id}/reviews?limit=5`)
      const data = await response.json()
      if (data.success) {
        setReviews(data.data || [])
      }
    } catch (err) {
      console.error('Error fetching reviews:', err)
    } finally {
      setReviewsLoading(false)
    }
  }

  const fetchRelatedProducts = async () => {
    if (!product?.category) return
    try {
      setRelatedLoading(true)
      const response = await fetch(
        `/api/products?category=${encodeURIComponent(product.category)}&limit=4`
      )
      const data = await response.json()
      if (data.success) {
        // Filter out the current product
        const filtered = (data.data || []).filter((p) => p.id !== product.id)
        setRelatedProducts(filtered.slice(0, 4))
      }
    } catch (err) {
      console.error('Error fetching related products:', err)
    } finally {
      setRelatedLoading(false)
    }
  }

  const handleAddToCart = async () => {
    try {
      setAddingToCart(true)
      setMessage('')
      setMessageType('')

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

      const response = await fetch(`/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: parseInt(quantity),
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        setMessageType('error')
        setMessage('Te rugam sa te autentifici pentru a adauga produse in cos.')
        setTimeout(() => {
          window.location.href = '/auth/login'
        }, 2000)
        return
      }

      if (!response.ok || !data.success) {
        setMessageType('error')
        setMessage(data.error || 'Nu s-a putut adauga produsul in cos.')
        return
      }

      setMessageType('success')
      setMessage(`Produsul a fost adaugat in cos (${quantity} ${quantity === 1 ? 'bucata' : 'bucati'})`)
      window.dispatchEvent(new Event('cart-updated'))
      setQuantity(1)

      // Clear the message after 4 seconds, do NOT redirect
      setTimeout(() => {
        setMessage('')
        setMessageType('')
      }, 4000)
    } catch (err) {
      console.error('Error adding to cart:', err)
      setMessageType('error')
      setMessage(`Eroare: ${err.message}`)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    try {
      setAddingToCart(true)
      setMessage('')
      setMessageType('')

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

      const response = await fetch(`/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: parseInt(quantity),
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        setMessageType('error')
        setMessage('Te rugam sa te autentifici pentru a continua.')
        setTimeout(() => {
          window.location.href = '/auth/login'
        }, 2000)
        return
      }

      if (!response.ok || !data.success) {
        setMessageType('error')
        setMessage(data.error || 'Nu s-a putut adauga produsul in cos.')
        return
      }

      window.dispatchEvent(new Event('cart-updated'))
      window.location.href = '/cart'
    } catch (err) {
      console.error('Error:', err)
      setMessageType('error')
      setMessage(`Eroare: ${err.message}`)
    } finally {
      setAddingToCart(false)
    }
  }

  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const truncate = (str, max) => {
    if (!str) return ''
    return str.length > max ? str.substring(0, max) + '...' : str
  }

  // Filter tags: remove anything containing .xlsx or .csv
  const filterTags = (tags) => {
    if (!tags || !Array.isArray(tags)) return []
    return tags.filter(
      (tag) => !tag.toLowerCase().includes('.xlsx') && !tag.toLowerCase().includes('.csv')
    )
  }

  const getConditionLabel = (condition) => {
    const map = {
      new: 'Nou',
      used: 'Folosit',
      refurbished: 'Reconditional',
      'like-new': 'Ca nou',
      'Grade A': 'Grad A',
      'Grade B': 'Grad B',
      'Grade C': 'Grad C',
    }
    return map[condition] || condition
  }

  const getStockLabel = (stock) => {
    if (stock > 10) return 'In stoc'
    if (stock >= 6) return `Ultimele ${stock} bucati disponibile`
    if (stock >= 2) return `Doar ${stock} mai disponibile!`
    if (stock === 1) return 'Ultimul exemplar!'
    return 'Stoc epuizat'
  }

  const getStockClass = (stock) => {
    if (stock > 10) return styles.inStock
    if (stock >= 2) return styles.stockUrgent
    if (stock === 1) return styles.stockCritical
    return styles.outOfStock
  }

  if (loading) return <div className={styles.loading}>Se incarca...</div>
  if (error) return <div className={styles.error}>Eroare: {error}</div>
  if (!product) return <div className={styles.error}>Produsul nu a fost gasit</div>

  const allImages = product.images && product.images.length > 0
    ? product.images
    : product.image
      ? [product.image]
      : []

  const filteredTags = filterTags(product.tags)

  // Build specifications list (only fields with values)
  const specs = []
  if (product.brand) specs.push({ label: 'Brand', value: product.brand })
  if (product.category) specs.push({ label: 'Categorie', value: product.category })
  if (product.condition) specs.push({ label: 'Conditie', value: getConditionLabel(product.condition) })
  if (product.weight) specs.push({ label: 'Greutate', value: `${product.weight} kg` })
  if (product.sku) specs.push({ label: 'SKU', value: product.sku })

  // JSON-LD Product schema for search engine rich snippets
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: product.images?.length > 0 ? product.images : product.image ? [product.image] : [],
    sku: product.sku || '',
    brand: product.brand
      ? { '@type': 'Brand', name: product.brand }
      : undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'RON',
      price: product.price,
      availability:
        product.stock > 0
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url: typeof window !== 'undefined' ? window.location.href : '',
    },
    ...(product.avgRating && product.reviewCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.avgRating,
            reviewCount: product.reviewCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  }

  return (
    <div className={styles.container}>
      {/* JSON-LD structured data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      {/* Breadcrumbs */}
      <nav className={styles.breadcrumbs}>
        <Link href="/">Acasa</Link>
        <span className={styles.breadcrumbSep}>&gt;</span>
        <Link href="/products">Produse</Link>
        {product.category && (
          <>
            <span className={styles.breadcrumbSep}>&gt;</span>
            <Link href={`/products?category=${encodeURIComponent(product.category)}`}>
              {product.category}
            </Link>
          </>
        )}
        <span className={styles.breadcrumbSep}>&gt;</span>
        <span className={styles.breadcrumbCurrent}>{truncate(product.name, 40)}</span>
      </nav>

      {/* Main two-column layout */}
      <div className={styles.mainContent}>
        {/* Left: Image Gallery */}
        <div className={styles.imageSection}>
          <div className={styles.mainImage}>
            {allImages.length > 0 ? (
              <Image
                src={allImages[selectedImage]}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 55vw"
                priority={true}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <div className={styles.placeholder}>Imagine indisponibila</div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className={styles.thumbnails}>
              {allImages.map((img, i) => (
                <Image
                  key={i}
                  src={img}
                  alt={`${product.name} ${i + 1}`}
                  width={68}
                  height={68}
                  className={`${styles.thumbnail} ${selectedImage === i ? styles.activeThumbnail : ''}`}
                  onClick={() => setSelectedImage(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div className={styles.infoSection}>
          {product.brand && (
            <p className={styles.brand}>{product.brand}</p>
          )}

          <h1 className={styles.title}>{product.name}</h1>

          {/* Star rating + review count */}
          <div className={styles.ratingRow}>
            <StarRating rating={product.avgRating || 0} interactive={false} size="medium" />
            <button
              type="button"
              className={styles.reviewCountLink}
              onClick={scrollToReviews}
            >
              {product.reviewCount || 0} {product.reviewCount === 1 ? 'recenzie' : 'recenzii'}
            </button>
          </div>

          {/* Price */}
          <div className={styles.priceBlock}>
            <span className={styles.price}>
              {product.price?.toFixed(2)} lei
            </span>
            {product.totalRrp > 0 && product.totalRrp > product.price && (
              <span className={styles.oldPrice}>
                {product.totalRrp.toFixed(2)} lei
              </span>
            )}
          </div>

          {/* Badges */}
          <div className={styles.badges}>
            <span className={`${styles.stockBadge} ${getStockClass(product.stock)}`}>
              {getStockLabel(product.stock)}
            </span>
            {product.condition && (
              <span className={styles.conditionBadge}>
                {getConditionLabel(product.condition)}
              </span>
            )}
          </div>

          {/* Quantity + Buttons */}
          <div className={styles.actionsBlock}>
            <div className={styles.quantitySelector}>
              <label htmlFor="quantity">Cantitate:</label>
              <div className={styles.quantityControls}>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || product.stock === 0 || addingToCart}
                >
                  -
                </button>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={Math.min(product.stock, 10)}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(Math.min(product.stock, 10), parseInt(e.target.value) || 1)))}
                  disabled={product.stock === 0 || addingToCart}
                />
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => setQuantity((q) => Math.min(Math.min(product.stock, 10), q + 1))}
                  disabled={quantity >= Math.min(product.stock, 10) || product.stock === 0 || addingToCart}
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.buttonRow}>
              <button
                className={styles.addToCartBtn}
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addingToCart}
              >
                {addingToCart ? 'Se adauga...' : 'Adauga in cos'}
              </button>
              <button
                className={styles.buyNowBtn}
                onClick={handleBuyNow}
                disabled={product.stock === 0 || addingToCart}
              >
                Cumpara acum
              </button>
            </div>
          </div>

          {/* Inline success/error message */}
          {message && (
            <div className={`${styles.message} ${styles[messageType]}`}>
              {message}
            </div>
          )}

          {/* Delivery info box */}
          <div className={styles.deliveryBox}>
            <div className={styles.deliveryItem}>
              <span className={styles.checkmark}>&#10003;</span>
              Livrare gratuita peste 200 lei
            </div>
            <div className={styles.deliveryItem}>
              <span className={styles.checkmark}>&#10003;</span>
              Livrare estimata: 2-5 zile lucratoare
            </div>
            <div className={styles.deliveryItem}>
              <span className={styles.checkmark}>&#10003;</span>
              <Link href="/returns" className={styles.deliveryLink}>Retur gratuit in 30 zile</Link>
            </div>
            <div className={styles.deliveryItem}>
              <span className={styles.checkmark}>&#10003;</span>
              Plata la livrare disponibila
            </div>
          </div>
        </div>
      </div>

      {/* Below columns: Description, Specs, Reviews, Related */}
      <div className={styles.belowFold}>
        {/* Description */}
        {product.description && (
          <section className={styles.descriptionSection}>
            <h2 className={styles.sectionTitle}>Descriere produs</h2>
            <div className={styles.descriptionText}>{product.description}</div>
          </section>
        )}

        {/* Specifications table */}
        {specs.length > 0 && (
          <section className={styles.specsSection}>
            <h2 className={styles.sectionTitle}>Specificatii</h2>
            <table className={styles.specsTable}>
              <tbody>
                {specs.map((spec, i) => (
                  <tr key={spec.label} className={i % 2 === 0 ? styles.evenRow : styles.oddRow}>
                    <td className={styles.specLabel}>{spec.label}</td>
                    <td className={styles.specValue}>{spec.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTags.length > 0 && (
              <div className={styles.tagsRow}>
                <span className={styles.tagsLabel}>Etichete:</span>
                {filteredTags.map((tag) => (
                  <span key={tag} className={styles.tag}>{tag}</span>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Reviews section */}
        <section className={styles.reviewsSection} ref={reviewsRef}>
          <h2 className={styles.sectionTitle}>
            Recenzii ({product.reviewCount || 0})
          </h2>

          {reviewsLoading && <p className={styles.loadingSmall}>Se incarca recenziile...</p>}

          {!reviewsLoading && reviews.length === 0 && (
            <p className={styles.noReviews}>Nu exista recenzii pentru acest produs.</p>
          )}

          {!reviewsLoading && reviews.length > 0 && (
            <div className={styles.reviewsList}>
              {reviews.map((review) => (
                <div key={review.id || review._id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <StarRating rating={review.rating} interactive={false} size="small" />
                    {review.verified && (
                      <span className={styles.verifiedBadge}>Achizitie verificata</span>
                    )}
                  </div>
                  <h4 className={styles.reviewTitle}>{review.title}</h4>
                  {review.comment && (
                    <p className={styles.reviewComment}>{review.comment}</p>
                  )}
                  <span className={styles.reviewDate}>
                    {review.created_at ? formatDate(review.created_at) : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className={styles.relatedSection}>
            <h2 className={styles.sectionTitle}>Produse similare</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/products/${rp.id}`}
                  className={styles.relatedCard}
                >
                  <div className={styles.relatedImageWrap} style={{ position: 'relative' }}>
                    {rp.images && rp.images.length > 0 ? (
                      <Image
                        src={rp.images[0]}
                        alt={rp.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        style={{ objectFit: 'contain' }}
                      />
                    ) : rp.image ? (
                      <Image
                        src={rp.image}
                        alt={rp.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        style={{ objectFit: 'contain' }}
                      />
                    ) : (
                      <div className={styles.relatedPlaceholder}>Fara imagine</div>
                    )}
                  </div>
                  <div className={styles.relatedInfo}>
                    <p className={styles.relatedName}>{truncate(rp.name, 50)}</p>
                    <div className={styles.relatedRating}>
                      <StarRating rating={rp.avgRating || 0} interactive={false} size="small" />
                      <span className={styles.relatedReviewCount}>({rp.reviewCount || 0})</span>
                    </div>
                    <p className={styles.relatedPrice}>
                      {rp.price?.toFixed(2)} lei
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
