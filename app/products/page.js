'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import styles from '@/styles/products.module.css'

const SORT_OPTIONS = [
  { value: '', label: 'Relevanta' },
  { value: 'price', label: 'Pret crescator' },
  { value: '-price', label: 'Pret descrescator' },
  { value: '-created_at', label: 'Cele mai noi' },
  { value: '-avg_rating', label: 'Rating' },
]

const ITEMS_PER_PAGE_OPTIONS = [20, 40, 60]

function StarRating({ rating, reviewCount }) {
  const stars = []
  const rounded = Math.round((rating || 0) * 2) / 2

  for (let i = 1; i <= 5; i++) {
    if (i <= rounded) {
      stars.push(
        <span key={i} className={styles.starFull}>&#9733;</span>
      )
    } else if (i - 0.5 === rounded) {
      stars.push(
        <span key={i} className={styles.starHalf}>&#9733;</span>
      )
    } else {
      stars.push(
        <span key={i} className={styles.starEmpty}>&#9733;</span>
      )
    }
  }

  return (
    <div className={styles.rating}>
      <span className={styles.stars}>{stars}</span>
      {reviewCount > 0 && (
        <span className={styles.reviewCount}>({reviewCount})</span>
      )}
    </div>
  )
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [subcategories, setSubcategories] = useState([])
  const [selectedTags, setSelectedTags] = useState(() => {
    const tagParam = searchParams.get('tag')
    return tagParam ? tagParam.split(',') : []
  })

  // Filters from URL or state
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1)
  const [limit, setLimit] = useState(parseInt(searchParams.get('limit')) || 20)
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || '')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [inStockOnly, setInStockOnly] = useState(searchParams.get('inStock') === '1')

  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 20, pages: 0 })
  const [searchInput, setSearchInput] = useState(search)
  const [addingToCartId, setAddingToCartId] = useState(null)
  const [cartMessage, setCartMessage] = useState('')

  const handleQuickAdd = async (productId) => {
    setAddingToCartId(productId)
    setCartMessage('')
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, quantity: 1 }),
      })
      if (response.status === 401) {
        window.location.href = '/auth/login'
        return
      }
      const data = await response.json()
      if (data.success) {
        setCartMessage('Adaugat in cos!')
        window.dispatchEvent(new Event('cart-updated'))
        setTimeout(() => setCartMessage(''), 2000)
      } else {
        setCartMessage(data.error || 'Eroare')
        setTimeout(() => setCartMessage(''), 3000)
      }
    } catch {
      setCartMessage('Eroare la adaugare')
      setTimeout(() => setCartMessage(''), 3000)
    } finally {
      setAddingToCartId(null)
    }
  }

  // Fetch categories on mount
  useEffect(() => {
    fetch('/api/products/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data)
      })
      .catch(() => {})
  }, [])

  // Fetch subcategories when category changes
  useEffect(() => {
    if (!category) {
      setSubcategories([])
      setSelectedTags([])
      return
    }
    fetch(`/api/products/subcategories?category=${encodeURIComponent(category)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setSubcategories(data.data)
        else setSubcategories([])
      })
      .catch(() => setSubcategories([]))
  }, [category])

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      })
      if (category) params.set('category', category)
      if (search) params.set('search', search)
      if (sort) params.set('sort', sort)
      if (minPrice) params.set('minPrice', minPrice)
      if (maxPrice) params.set('maxPrice', maxPrice)
      if (inStockOnly) params.set('inStock', '1')
      if (selectedTags.length > 0) params.set('tag', selectedTags.join(','))

      const response = await fetch(`/api/products?${params}`)
      const data = await response.json()

      if (data.success) {
        let filtered = data.data
        // Client-side filtering for price range and stock if API doesn't support it
        if (minPrice) {
          filtered = filtered.filter((p) => p.price >= parseFloat(minPrice))
        }
        if (maxPrice) {
          filtered = filtered.filter((p) => p.price <= parseFloat(maxPrice))
        }
        if (inStockOnly) {
          filtered = filtered.filter((p) => p.stock > 0)
        }
        setProducts(filtered)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Eroare la incarcarea produselor:', error)
    } finally {
      setLoading(false)
    }
  }, [page, limit, category, search, sort, minPrice, maxPrice, inStockOnly, selectedTags])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', String(page))
    if (limit !== 20) params.set('limit', String(limit))
    if (category) params.set('category', category)
    if (search) params.set('search', search)
    if (sort) params.set('sort', sort)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (inStockOnly) params.set('inStock', '1')
    if (selectedTags.length > 0) params.set('tag', selectedTags.join(','))

    const qs = params.toString()
    router.replace(`/products${qs ? '?' + qs : ''}`, { scroll: false })
  }, [page, limit, category, search, sort, minPrice, maxPrice, inStockOnly, selectedTags, router])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleCategorySelect = (cat) => {
    setCategory(cat === category ? '' : cat)
    setSelectedTags([])
    setPage(1)
  }

  const handleTagToggle = (tagName) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    )
    setPage(1)
  }

  const handleApplyPrice = () => {
    setPage(1)
    fetchProducts()
  }

  const handleSortChange = (e) => {
    setSort(e.target.value)
    setPage(1)
  }

  const handleLimitChange = (e) => {
    setLimit(parseInt(e.target.value))
    setPage(1)
  }

  const handleInStockToggle = () => {
    setInStockOnly(!inStockOnly)
    setPage(1)
  }

  // Pagination page numbers: first, last, current +/- 2
  const getPageNumbers = () => {
    const { pages: totalPages } = pagination
    if (totalPages <= 1) return []

    const pageSet = new Set()
    pageSet.add(1)
    pageSet.add(totalPages)
    for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
      pageSet.add(i)
    }
    const sorted = Array.from(pageSet).sort((a, b) => a - b)

    // Insert ellipsis markers
    const result = []
    for (let i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
        result.push('...')
      }
      result.push(sorted[i])
    }
    return result
  }

  const activeCategoryName = categories.find((c) => c.name === category)?.name

  return (
    <div className={styles.pageWrapper}>
      {cartMessage && (
        <div className={styles.cartToast}>{cartMessage}</div>
      )}
      {/* Breadcrumbs */}
      <nav className={styles.breadcrumbs} aria-label="Navigare pagina">
        <Link href="/">Acasa</Link>
        <span className={styles.breadcrumbSep}>&rsaquo;</span>
        {category ? (
          <>
            <Link href="/products">Produse</Link>
            <span className={styles.breadcrumbSep}>&rsaquo;</span>
            <span className={styles.breadcrumbCurrent}>{activeCategoryName || category}</span>
          </>
        ) : (
          <span className={styles.breadcrumbCurrent}>Produse</span>
        )}
      </nav>

      <h1 className="visually-hidden">
        {activeCategoryName || (category ? category : 'Produse')}
      </h1>

      {/* Mobile filter toggle */}
      <button
        className={styles.mobileFilterBtn}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-expanded={sidebarOpen}
        aria-controls="products-filter-sidebar"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" focusable="false">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="16" y2="12" />
          <line x1="4" y1="18" x2="12" y2="18" />
        </svg>
        Filtre
      </button>

      <div className={styles.layout}>
        {/* Sidebar */}
        <aside
          id="products-filter-sidebar"
          className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
          aria-label="Filtre produse"
        >
          <div className={styles.sidebarHeader}>
            <h3>Filtre</h3>
            <button
              className={styles.sidebarClose}
              onClick={() => setSidebarOpen(false)}
              aria-label="Inchide filtrele"
              type="button"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          {/* Search inside sidebar */}
          <form onSubmit={handleSearch} className={styles.sidebarSearch} role="search" aria-label="Cauta in catalog">
            <label htmlFor="products-sidebar-search" className="visually-hidden">
              Cauta produse
            </label>
            <input
              id="products-sidebar-search"
              type="search"
              placeholder="Cauta produse..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button type="submit">Cauta</button>
          </form>

          {/* Categories */}
          <div className={styles.filterGroup}>
            <h4 id="filter-category-heading">Categorie</h4>
            <ul className={styles.categoryList} aria-labelledby="filter-category-heading">
              {categories.map((cat) => (
                <li key={cat.name}>
                  <button
                    type="button"
                    className={`${styles.categoryItem} ${category === cat.name ? styles.categoryActive : ''}`}
                    onClick={() => handleCategorySelect(cat.name)}
                    aria-pressed={category === cat.name}
                  >
                    <span className={styles.categoryName}>{cat.name}</span>
                    <span className={styles.categoryCount}>({cat.count})</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Subcategories */}
          {category && subcategories.length > 0 && (
            <div className={styles.filterGroup}>
              <h4 id="filter-subcategory-heading">Subcategorii</h4>
              <ul className={styles.categoryList} aria-labelledby="filter-subcategory-heading">
                {subcategories.map((sub) => (
                  <li
                    key={sub.name}
                    className={`${styles.subcategoryItem} ${selectedTags.includes(sub.name) ? styles.subcategoryActive : ''}`}
                  >
                    <label className={styles.subcategoryLabel}>
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(sub.name)}
                        onChange={() => handleTagToggle(sub.name)}
                        className={styles.subcategoryCheckbox}
                      />
                      <span className={styles.categoryName}>{sub.name}</span>
                    </label>
                    <span className={styles.categoryCount}>({sub.count})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Price Range */}
          <div className={styles.filterGroup}>
            <h4>Pret (RON)</h4>
            <div className={styles.priceInputs}>
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
              />
              <span className={styles.priceSep}>-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
              />
            </div>
            <button className={styles.applyPriceBtn} onClick={handleApplyPrice}>
              Aplica
            </button>
          </div>

          {/* In Stock Toggle */}
          <div className={styles.filterGroup}>
            <label className={styles.stockToggle}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={handleInStockToggle}
              />
              <span className={styles.toggleSlider}></span>
              <span className={styles.toggleLabel}>Doar produse in stoc</span>
            </label>
          </div>
        </aside>

        {/* Sidebar overlay on mobile */}
        {sidebarOpen && (
          <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main content */}
        <main className={styles.mainContent}>
          {/* Top bar: results count + sort */}
          <div className={styles.topBar}>
            <span className={styles.resultsCount}>
              <strong>{pagination.total}</strong> produse gasite
              {search && (
                <> pentru &quot;<em>{search}</em>&quot;</>
              )}
            </span>
            <div className={styles.topBarRight}>
              <div className={styles.sortWrapper}>
                <label htmlFor="sort-select">Sorteaza:</label>
                <select id="sort-select" value={sort} onChange={handleSortChange}>
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.perPageWrapper}>
                <label htmlFor="limit-select">Afiseaza:</label>
                <select id="limit-select" value={limit} onChange={handleLimitChange}>
                  {ITEMS_PER_PAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner}></div>
              <p>Se incarca produsele...</p>
            </div>
          )}

          {/* Products grid */}
          {!loading && products.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <h2>Niciun produs gasit</h2>
              <p>Incearca sa modifici filtrele sau termenul de cautare.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {products.map((product) => (
                <div key={product._id} className={styles.card}>
                  <Link href={`/products/${product.id}`} className={styles.cardLink}>
                    <div className={styles.cardImageWrap}>
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="(max-width: 600px) 50vw, (max-width: 1100px) 33vw, 25vw"
                        />
                      ) : (
                        <div className={styles.placeholder}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className={styles.cardBody}>
                      <h3 className={styles.cardTitle}>{product.name}</h3>
                      <StarRating rating={product.avgRating} reviewCount={product.reviewCount} />
                      <div className={styles.cardPrice}>
                        {product.price?.toFixed(2)} <span className={styles.currency}>lei</span>
                      </div>
                      <div className={product.stock > 0 ? styles.inStock : styles.outOfStock}>
                        {product.stock > 0 ? 'In stoc' : 'Stoc epuizat'}
                      </div>
                    </div>
                  </Link>
                  <button
                    className={styles.quickAddBtn}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleQuickAdd(product.id)
                    }}
                    disabled={product.stock <= 0 || addingToCartId === product.id}
                  >
                    {addingToCartId === product.id
                      ? 'Se adauga...'
                      : product.stock > 0
                      ? 'Adauga in cos'
                      : 'Indisponibil'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                &laquo; Inapoi
              </button>

              {getPageNumbers().map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className={styles.pageEllipsis}>
                    ...
                  </span>
                ) : (
                  <button
                    key={p}
                    className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                className={styles.pageBtn}
                disabled={page === pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Inainte &raquo;
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Se incarca...</div>}>
      <ProductsContent />
    </Suspense>
  )
}
