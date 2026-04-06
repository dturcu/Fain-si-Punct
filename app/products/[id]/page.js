'use client'

import { useEffect, useState, useRef, use } from 'react'
import Link from 'next/link'
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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [swipeStart, setSwipeStart] = useState(null)
  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedVariant, setSelectedVariant] = useState(null)
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
      // Auto-select first color/size if variants exist
      if (product.variants && product.variants.length > 0) {
        const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))]
        const sizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))]
        if (colors.length > 0) setSelectedColor(colors[0])
        if (sizes.length > 0) setSelectedSize(sizes[0])
      }
    }
  }, [product?.id])

  // Resolve variant when color/size selection changes
  useEffect(() => {
    if (!product?.variants || product.variants.length === 0) {
      setSelectedVariant(null)
      return
    }
    const match = product.variants.find(v =>
      (!v.color || v.color === selectedColor) &&
      (!v.size || v.size === selectedSize)
    )
    setSelectedVariant(match || null)
  }, [selectedColor, selectedSize, product?.variants])

  // Variant helper: get unique colors and sizes
  const hasVariants = product?.variants && product.variants.length > 0
  const variantColors = hasVariants ? [...new Set(product.variants.map(v => v.color).filter(Boolean))] : []
  const variantSizes = hasVariants ? [...new Set(product.variants.map(v => v.size).filter(Boolean))] : []

  // Check if a specific color+size combo is in stock
  const isComboAvailable = (color, size) => {
    if (!hasVariants) return true
    const v = product.variants.find(v =>
      (color ? v.color === color : !v.color) &&
      (size ? v.size === size : !v.size)
    )
    return v ? v.stock > 0 : false
  }

  // Effective price/stock/image considering variant selection
  const effectivePrice = selectedVariant?.priceOverride != null ? selectedVariant.priceOverride : product?.price
  const effectiveStock = selectedVariant ? selectedVariant.stock : product?.stock
  const effectiveImage = selectedVariant?.image || null

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

      // Require variant selection if product has variants
      if (hasVariants && !selectedVariant) {
        setMessageType('error')
        setMessage('Te rugam sa selectezi o varianta (culoare/marime).')
        return
      }

      const response = await fetch(`/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: parseInt(quantity),
          variantId: selectedVariant?.id || undefined,
        }),
      })

      const data = await response.json()

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

      if (hasVariants && !selectedVariant) {
        setMessageType('error')
        setMessage('Te rugam sa selectezi o varianta (culoare/marime).')
        setAddingToCart(false)
        return
      }

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
          variantId: selectedVariant?.id || undefined,
        }),
      })

      const data = await response.json()

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
    if (stock > 0) return `Ultimele ${stock} bucati`
    return 'Stoc epuizat'
  }

  const getStockIcon = (stock) => {
    if (stock > 10) return '\u2713 '
    if (stock > 0) return '! '
    return '\u2717 '
  }

  const getColorHex = (colorName) => {
    const map = {
      'Rosu': '#e74c3c', 'rosu': '#e74c3c', 'Red': '#e74c3c', 'red': '#e74c3c',
      'Albastru': '#3498db', 'albastru': '#3498db', 'Blue': '#3498db', 'blue': '#3498db',
      'Verde': '#27ae60', 'verde': '#27ae60', 'Green': '#27ae60', 'green': '#27ae60',
      'Negru': '#2c3e50', 'negru': '#2c3e50', 'Black': '#2c3e50', 'black': '#2c3e50',
      'Alb': '#ecf0f1', 'alb': '#ecf0f1', 'White': '#ecf0f1', 'white': '#ecf0f1',
      'Galben': '#f1c40f', 'galben': '#f1c40f', 'Yellow': '#f1c40f', 'yellow': '#f1c40f',
      'Portocaliu': '#e67e22', 'portocaliu': '#e67e22', 'Orange': '#e67e22', 'orange': '#e67e22',
      'Mov': '#9b59b6', 'mov': '#9b59b6', 'Purple': '#9b59b6', 'purple': '#9b59b6',
      'Roz': '#e91e63', 'roz': '#e91e63', 'Pink': '#e91e63', 'pink': '#e91e63',
      'Gri': '#95a5a6', 'gri': '#95a5a6', 'Grey': '#95a5a6', 'gray': '#95a5a6', 'Gray': '#95a5a6',
      'Maro': '#8b4513', 'maro': '#8b4513', 'Brown': '#8b4513', 'brown': '#8b4513',
      'Bej': '#f5deb3', 'bej': '#f5deb3', 'Beige': '#f5deb3', 'beige': '#f5deb3',
    }
    return map[colorName] || '#ccc'
  }

  const getStockClass = (stock) => {
    if (stock > 10) return styles.inStock
    if (stock > 0) return styles.lowStock
    return styles.outOfStock
  }

  const openLightbox = (index) => {
    setSelectedImage(index ?? selectedImage)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setLightboxOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    document.body.style.overflow = ''
  }

  const handleLightboxWheel = (e) => {
    e.preventDefault()
    setZoom((z) => {
      const next = z + (e.deltaY > 0 ? -0.2 : 0.2)
      const clamped = Math.min(5, Math.max(1, next))
      if (clamped === 1) setPan({ x: 0, y: 0 })
      return clamped
    })
  }

  const handleMouseDown = (e) => {
    if (zoom <= 1) return
    e.preventDefault()
    setDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!dragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  const handleMouseUp = () => setDragging(false)

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return
    const x = e.touches[0].clientX
    const y = e.touches[0].clientY
    if (zoom > 1) {
      setDragging(true)
      setDragStart({ x: x - pan.x, y: y - pan.y })
    } else {
      setSwipeStart({ x, y })
    }
  }

  const handleTouchMove = (e) => {
    if (e.touches.length !== 1) return
    if (dragging && zoom > 1) {
      e.preventDefault()
      setPan({ x: e.touches[0].clientX - dragStart.x, y: e.touches[0].clientY - dragStart.y })
    }
  }

  const handleTouchEnd = (e) => {
    setDragging(false)
    if (swipeStart && zoom <= 1) {
      const endX = e.changedTouches[0].clientX
      const endY = e.changedTouches[0].clientY
      const dx = endX - swipeStart.x
      const dy = endY - swipeStart.y
      // Only count as swipe if horizontal movement > 50px and greater than vertical
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0) lightboxPrev()
        else lightboxNext()
      }
    }
    setSwipeStart(null)
  }

  const lightboxPrev = () => {
    if (allImages.length <= 1) return
    setSelectedImage((i) => (i === 0 ? allImages.length - 1 : i - 1))
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const lightboxNext = () => {
    if (allImages.length <= 1) return
    setSelectedImage((i) => (i === allImages.length - 1 ? 0 : i + 1))
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const allImages = product?.images && product.images.length > 0
    ? product.images
    : product?.image
      ? [product.image]
      : []

  // When variant with image is selected, update the main image
  useEffect(() => {
    if (effectiveImage && allImages.length > 0) {
      const idx = allImages.indexOf(effectiveImage)
      if (idx >= 0) setSelectedImage(idx)
    }
  }, [effectiveImage])

  if (loading) return <div className={styles.loading}>Se incarca...</div>
  if (error) return <div className={styles.error}>Eroare: {error}</div>
  if (!product) return <div className={styles.error}>Produsul nu a fost gasit</div>

  const filteredTags = filterTags(product.tags)

  // Build specifications list (only fields with values)
  const specs = []
  if (product.brand) specs.push({ label: 'Brand', value: product.brand })
  if (product.category) specs.push({ label: 'Categorie', value: product.category })
  if (product.condition) specs.push({ label: 'Conditie', value: getConditionLabel(product.condition) })
  if (product.weight) specs.push({ label: 'Greutate', value: `${product.weight} kg` })
  if (product.sku) specs.push({ label: 'SKU', value: product.sku })

  // JSON-LD Product structured data
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || '',
    image: allImages.length > 0 ? allImages : undefined,
    sku: product.sku || undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    category: product.category || undefined,
    offers: {
      '@type': 'Offer',
      price: effectivePrice,
      priceCurrency: 'RON',
      availability: (effectiveStock ?? product.stock) > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `${siteUrl}/products/${product.id}`,
    },
    ...(product.avgRating > 0 && product.reviewCount > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.avgRating,
        reviewCount: product.reviewCount,
      },
    } : {}),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Acasa', item: siteUrl || '/' },
      { '@type': 'ListItem', position: 2, name: 'Produse', item: `${siteUrl}/products` },
      ...(product.category ? [{
        '@type': 'ListItem', position: 3,
        name: product.category,
        item: `${siteUrl}/products?category=${encodeURIComponent(product.category)}`,
      }] : []),
      { '@type': 'ListItem', position: product.category ? 4 : 3, name: product.name },
    ],
  }

  return (
    <div className={styles.container}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
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
          <div
            className={styles.mainImage}
            onClick={() => allImages.length > 0 && openLightbox()}
            style={{ cursor: allImages.length > 0 ? 'zoom-in' : 'default' }}
            role={allImages.length > 0 ? 'button' : undefined}
            aria-label={allImages.length > 0 ? 'Mareste imaginea' : undefined}
            tabIndex={allImages.length > 0 ? 0 : undefined}
            onKeyDown={(e) => e.key === 'Enter' && allImages.length > 0 && openLightbox()}
          >
            {allImages.length > 0 ? (
              <img src={allImages[selectedImage]} alt={product.name} />
            ) : (
              <div className={styles.placeholder}>Imagine indisponibila</div>
            )}
            {allImages.length > 0 && (
              <span className={styles.zoomHint}>Apasa pentru a mari</span>
            )}
          </div>
          {allImages.length > 1 && (
            <div className={styles.thumbnails}>
              {allImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${product.name} ${i + 1}`}
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
            <span className={styles.brandBadge}>{product.brand}</span>
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
              {effectivePrice?.toFixed(2)} <span className={styles.priceCurrency}>lei</span>
            </span>
            {!hasVariants && product.totalRrp > 0 && product.totalRrp > product.price && (
              <>
                <span className={styles.oldPrice}>
                  {product.totalRrp.toFixed(2)} lei
                </span>
                <span className={styles.discountTag}>
                  -{Math.round((1 - product.price / product.totalRrp) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Badges */}
          <div className={styles.badges}>
            <span className={`${styles.stockBadge} ${getStockClass(hasVariants ? (effectiveStock ?? 0) : product.stock)}`}>
              {getStockIcon(hasVariants ? (effectiveStock ?? 0) : product.stock)}
              {getStockLabel(hasVariants ? (effectiveStock ?? 0) : product.stock)}
            </span>
            {product.condition && (
              <span className={styles.conditionBadge}>
                {getConditionLabel(product.condition)}
              </span>
            )}
          </div>

          {/* Variant Selectors */}
          {hasVariants && (
            <div className={styles.variantSection}>
              {variantColors.length > 0 && (
                <div className={styles.variantGroup}>
                  <label className={styles.variantLabel}>Culoare:</label>
                  <div className={styles.colorSwatches}>
                    {variantColors.map((color) => {
                      const available = variantSizes.length > 0
                        ? variantSizes.some(s => isComboAvailable(color, s))
                        : isComboAvailable(color, null)
                      return (
                        <button
                          key={color}
                          type="button"
                          className={`${styles.colorSwatch} ${selectedColor === color ? styles.colorSwatchActive : ''} ${!available ? styles.colorSwatchDisabled : ''}`}
                          onClick={() => available && setSelectedColor(color)}
                          disabled={!available}
                          title={color}
                          aria-label={`Culoare: ${color}`}
                        >
                          <span
                            className={styles.colorDot}
                            style={{ background: getColorHex(color) }}
                          />
                          <span className={styles.colorName}>{color}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {variantSizes.length > 0 && (
                <div className={styles.variantGroup}>
                  <label className={styles.variantLabel}>Marime:</label>
                  <div className={styles.sizeButtons}>
                    {variantSizes.map((size) => {
                      const available = variantColors.length > 0
                        ? isComboAvailable(selectedColor, size)
                        : isComboAvailable(null, size)
                      return (
                        <button
                          key={size}
                          type="button"
                          className={`${styles.sizeBtn} ${selectedSize === size ? styles.sizeBtnActive : ''} ${!available ? styles.sizeBtnDisabled : ''}`}
                          onClick={() => available && setSelectedSize(size)}
                          disabled={!available}
                          aria-label={`Marime: ${size}`}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity + Buttons */}
          <div className={styles.actionsBlock}>
            {(() => {
              const stock = hasVariants ? (effectiveStock ?? 0) : product.stock
              const maxQty = Math.min(stock, 10)
              const outOfStock = stock === 0
              const needsVariant = hasVariants && !selectedVariant
              return (
                <>
                  <div className={styles.quantitySelector}>
                    <label htmlFor="quantity">Cantitate:</label>
                    <div className={styles.quantityControls}>
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1 || outOfStock || addingToCart}
                      >
                        -
                      </button>
                      <input
                        id="quantity"
                        type="number"
                        min="1"
                        max={maxQty}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, Math.min(maxQty, parseInt(e.target.value) || 1)))}
                        disabled={outOfStock || addingToCart}
                      />
                      <button
                        type="button"
                        className={styles.qtyBtn}
                        onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                        disabled={quantity >= maxQty || outOfStock || addingToCart}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className={styles.buttonRow}>
                    <button
                      className={styles.addToCartBtn}
                      onClick={handleAddToCart}
                      disabled={outOfStock || addingToCart || needsVariant}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="9" cy="21" r="1" />
                        <circle cx="20" cy="21" r="1" />
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                      </svg>
                      {addingToCart ? 'Se adauga...' : 'Adauga in cos'}
                    </button>
                    <button
                      className={styles.buyNowBtn}
                      onClick={handleBuyNow}
                      disabled={outOfStock || addingToCart || needsVariant}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                      Cumpara acum
                    </button>
                  </div>
                </>
              )
            })()}
          </div>

          {/* Inline success/error message */}
          {message && (
            <div className={`${styles.message} ${styles[messageType]}`}>
              {message}
            </div>
          )}

          {/* Delivery info box */}
          <div className={styles.deliveryBox}>
            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIconWrap}>
                <span className={styles.checkmark}>&#10003;</span>
              </div>
              <span className={styles.deliveryText}>Livrare gratuita</span>
            </div>
            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIconWrap}>
                <span className={styles.checkmark}>&#10003;</span>
              </div>
              <span className={styles.deliveryText}>Retur in 30 zile</span>
            </div>
            <div className={styles.deliveryCard}>
              <div className={styles.deliveryIconWrap}>
                <span className={styles.checkmark}>&#10003;</span>
              </div>
              <span className={styles.deliveryText}>Plata la livrare disponibila</span>
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
                  <div className={styles.relatedImageWrap}>
                    {rp.images && rp.images.length > 0 ? (
                      <img src={rp.images[0]} alt={rp.name} />
                    ) : rp.image ? (
                      <img src={rp.image} alt={rp.name} />
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

      {/* Lightbox overlay */}
      {lightboxOpen && allImages.length > 0 && (
        <div
          className={styles.lightboxOverlay}
          onClick={closeLightbox}
          onKeyDown={(e) => {
            if (e.key === 'Escape') closeLightbox()
            if (e.key === 'ArrowLeft') lightboxPrev()
            if (e.key === 'ArrowRight') lightboxNext()
          }}
          tabIndex={0}
          role="dialog"
          aria-label="Vizualizare imagine"
        >
          <button className={styles.lightboxClose} onClick={closeLightbox} aria-label="Inchide">
            &times;
          </button>

          {allImages.length > 1 && (
            <>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={(e) => { e.stopPropagation(); lightboxPrev() }}
                aria-label="Imaginea anterioara"
              >
                &#8249;
              </button>
              <button
                className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={(e) => { e.stopPropagation(); lightboxNext() }}
                aria-label="Imaginea urmatoare"
              >
                &#8250;
              </button>
            </>
          )}

          <div
            className={styles.lightboxImageWrap}
            onClick={(e) => e.stopPropagation()}
            onWheel={handleLightboxWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'zoom-in' }}
          >
            <img
              src={allImages[selectedImage]}
              alt={product.name}
              className={styles.lightboxImage}
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transition: dragging ? 'none' : 'transform 0.2s ease',
              }}
              draggable={false}
              onClick={() => {
                if (zoom === 1) {
                  setZoom(2)
                } else {
                  setZoom(1)
                  setPan({ x: 0, y: 0 })
                }
              }}
            />
          </div>

          <div className={styles.lightboxControls}>
            <button
              className={styles.lightboxZoomBtn}
              onClick={(e) => { e.stopPropagation(); setZoom((z) => Math.min(5, z + 0.5)) }}
              aria-label="Mareste"
            >
              +
            </button>
            <span className={styles.lightboxZoomLevel}>{Math.round(zoom * 100)}%</span>
            <button
              className={styles.lightboxZoomBtn}
              onClick={(e) => {
                e.stopPropagation()
                setZoom((z) => {
                  const next = Math.max(1, z - 0.5)
                  if (next === 1) setPan({ x: 0, y: 0 })
                  return next
                })
              }}
              aria-label="Micsoreaza"
            >
              -
            </button>
            {allImages.length > 1 && (
              <span className={styles.lightboxCounter}>
                {selectedImage + 1} / {allImages.length}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
