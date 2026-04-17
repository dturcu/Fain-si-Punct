'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * Admin — customer support lookup. Searches by email, name, phone.
 * Click a row to drill into /admin/customers/[id].
 */
export default function AdminCustomersPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams()
      if (search.trim()) qs.set('search', search.trim())
      const res = await fetch(`/api/admin/customers?${qs.toString()}`)
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body.error?.message || 'Eroare la incarcare')
      }
      setRows(body.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Clienti</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="search"
          placeholder="Email, nume, telefon"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          style={{ padding: '0.5rem', flex: 1 }}
          aria-label="Cautare clienti"
        />
        <button className="btn btn-primary" onClick={load}>Cauta</button>
      </div>

      {loading && <p>Se incarca...</p>}
      {error && <p style={{ color: '#c13515' }}>{error}</p>}
      {!loading && rows.length === 0 && <p>Niciun rezultat.</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Client</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Email</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Telefon</th>
            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Comenzi</th>
            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total cheltuit</th>
            <th style={{ padding: '0.5rem' }}>Rol</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem' }}>
                <Link href={`/admin/customers/${u.id}`}>
                  <strong>{[u.firstName, u.lastName].filter(Boolean).join(' ') || '(fara nume)'}</strong>
                </Link>
                {!u.isActive && <span style={{ marginLeft: 8, color: '#c13515', fontSize: '0.8rem' }}>INACTIV</span>}
              </td>
              <td style={{ padding: '0.5rem', fontSize: '0.9rem' }}>{u.email}</td>
              <td style={{ padding: '0.5rem' }}>{u.phone || '—'}</td>
              <td style={{ padding: '0.5rem', textAlign: 'right' }}>{u.ordersCount}</td>
              <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                {u.totalSpent.toLocaleString('ro-RO', { minimumFractionDigits: 2 })} lei
              </td>
              <td style={{ padding: '0.5rem' }}>{u.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
