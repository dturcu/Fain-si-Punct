'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '@/styles/home.module.css'

/**
 * Client-only hero search form. Extracted from app/page.js so the page
 * itself can render on the server and be statically revalidated.
 */
export default function HomeSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const onSubmit = (e) => {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/products?search=${encodeURIComponent(q)}`)
  }

  return (
    <form className={styles.heroSearch} onSubmit={onSubmit} role="search">
      <label htmlFor="hero-search-input" className="sr-only">
        Cauta produse
      </label>
      <input
        id="hero-search-input"
        type="search"
        className={styles.heroSearchInput}
        placeholder="Cauta produse, categorii, marci..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Cauta produse, categorii, marci"
      />
      <button type="submit" className={styles.heroSearchBtn} aria-label="Cauta">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        Cauta
      </button>
    </form>
  )
}
