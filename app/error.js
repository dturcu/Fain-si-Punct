'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>A apărut o eroare</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Ne pare rău, ceva nu a funcționat corect. Încearcă din nou.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          onClick={reset}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          Încearcă din nou
        </button>
        <Link
          href="/"
          style={{
            padding: '0.75rem 1.5rem',
            background: '#f3f4f6',
            color: '#111',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            fontSize: '1rem',
          }}
        >
          Înapoi acasă
        </Link>
      </div>
    </div>
  )
}
