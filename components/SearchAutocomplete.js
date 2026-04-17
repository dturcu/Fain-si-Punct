'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import styles from './SearchAutocomplete.module.css'

/**
 * Navbar search input with typo-tolerant suggestions.
 *
 * Debounced 180ms. Hits /api/products/search/autocomplete which is
 * edge-cached for 60s (see that route). Keyboard navigation:
 *   - ArrowDown/Up moves selection
 *   - Enter with selection goes to the product
 *   - Enter without selection submits the traditional ?search= query
 *   - Escape closes the panel
 */
export default function SearchAutocomplete({ className = '', inputClassName = '', buttonClassName = '', onNavigate }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef(null)
  const abortRef = useRef(null)

  // Debounced fetch
  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setSuggestions([])
      return
    }
    const handle = setTimeout(async () => {
      try {
        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller
        const res = await fetch(`/api/products/search/autocomplete?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        })
        const body = await res.json()
        if (res.ok && body.success) {
          setSuggestions(body.data)
          setActiveIndex(-1)
        }
      } catch {
        // aborted or network hiccup — ignore
      }
    }, 180)
    return () => clearTimeout(handle)
  }, [query])

  // Click outside
  useEffect(() => {
    function onClick(e) {
      if (!containerRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function submitFullSearch() {
    const trimmed = query.trim()
    if (!trimmed) return
    router.push(`/products?search=${encodeURIComponent(trimmed)}`)
    setOpen(false)
    onNavigate?.()
  }

  function onKeyDown(e) {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault()
        submitFullSearch()
      }
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0) {
        const s = suggestions[activeIndex]
        router.push(`/products/${s.id}`)
        setOpen(false)
        onNavigate?.()
      } else {
        submitFullSearch()
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showPanel = open && query.trim().length >= 2 && suggestions.length > 0

  return (
    <div className={`${styles.wrapper} ${className}`} ref={containerRef}>
      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault()
          submitFullSearch()
        }}
        role="search"
      >
        <label htmlFor="nav-search-input" className="sr-only">
          Cauta produse
        </label>
        <input
          id="nav-search-input"
          type="search"
          className={inputClassName || styles.input}
          placeholder="Cauta produse..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="autocomplete-panel"
          aria-expanded={showPanel}
        />
        <button type="submit" className={buttonClassName || styles.button} aria-label="Cauta">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </form>

      {showPanel && (
        <ul id="autocomplete-panel" className={styles.panel} role="listbox">
          {suggestions.map((s, idx) => (
            <li
              key={s.id}
              className={`${styles.item} ${idx === activeIndex ? styles.itemActive : ''}`}
              role="option"
              aria-selected={idx === activeIndex}
            >
              <Link
                href={`/products/${s.id}`}
                className={styles.link}
                onClick={() => { setOpen(false); onNavigate?.() }}
              >
                {s.image && (
                  <Image src={s.image} alt="" width={40} height={40} className={styles.thumb} unoptimized />
                )}
                <span className={styles.name}>{s.name}</span>
                <span className={styles.price}>{s.price.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
