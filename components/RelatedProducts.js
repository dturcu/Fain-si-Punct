'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './RelatedProducts.module.css'

/**
 * Fetches related products for a set of cart/order product IDs and
 * renders them as a horizontal row. Used in cart ("Frecvent cumparate
 * impreuna"). No-op when there are no input IDs or no results.
 *
 * Props:
 *   - productIds: string[]           — IDs to base recommendations on
 *   - title: string                  — section heading
 *   - limit?: number                 — default 4
 */
export default function RelatedProducts({ productIds, title = 'Frecvent cumparate impreuna', limit = 4 }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!productIds || productIds.length === 0) {
      setItems([])
      return
    }
    const ids = productIds.slice(0, 20).join(',')
    const controller = new AbortController()
    setLoading(true)
    fetch(`/api/products/related?ids=${encodeURIComponent(ids)}&limit=${limit}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((body) => {
        if (body?.success) setItems(body.data || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [productIds, limit])

  if (!loading && items.length === 0) return null

  return (
    <section className={styles.section} aria-label={title}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.grid}>
        {items.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} className={styles.card}>
            <div className={styles.imgWrap}>
              {p.image && (
                <Image src={p.image} alt={p.name} width={200} height={200} className={styles.img} unoptimized />
              )}
            </div>
            <span className={styles.name}>{p.name}</span>
            <span className={styles.price}>
              {p.price.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
