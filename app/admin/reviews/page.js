'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Admin — review moderation queue.
 * Lists recent reviews with a rating filter and deletes via
 * DELETE /api/reviews/[id] (which already logs an admin_action audit event).
 */
export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [maxRating, setMaxRating] = useState(5)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      params.set('max_rating', String(maxRating))
      const res = await fetch(`/api/admin/reviews?${params.toString()}`)
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body.error?.message || 'Eroare la incarcare')
      }
      setReviews(body.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [search, maxRating])

  useEffect(() => {
    load()
  }, [load])

  async function remove(id) {
    if (!confirm('Stergi aceasta recenzie? Actiunea este ireversibila.')) return
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' })
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body.error?.message || 'Eroare')
      }
      await load()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Moderare recenzii</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          type="search"
          placeholder="Cauta in titlu/comentariu"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          style={{ padding: '0.5rem', flex: 1, minWidth: 200 }}
          aria-label="Cautare recenzii"
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          Max stele:
          <select value={maxRating} onChange={(e) => setMaxRating(parseInt(e.target.value, 10))}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" onClick={load}>Filtreaza</button>
      </div>

      {loading && <p>Se incarca...</p>}
      {error && <p style={{ color: '#c13515' }}>{error}</p>}
      {!loading && reviews.length === 0 && <p>Nicio recenzie.</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Creat</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Produs</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Stele</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Titlu / comentariu</th>
            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Actiuni</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #eee', verticalAlign: 'top' }}>
              <td style={{ padding: '0.5rem', whiteSpace: 'nowrap' }}>
                {new Date(r.created_at).toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' })}
              </td>
              <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <a href={`/products/${r.product_id}`} target="_blank" rel="noopener noreferrer">
                  {String(r.product_id).slice(0, 8)}…
                </a>
              </td>
              <td style={{ padding: '0.5rem' }}>
                {'★'.repeat(r.rating)}
                <span style={{ color: '#bbb' }}>{'★'.repeat(5 - r.rating)}</span>
              </td>
              <td style={{ padding: '0.5rem' }}>
                <strong>{r.title || '(fara titlu)'}</strong>
                <div style={{ fontSize: '0.9rem', color: '#555' }}>{r.comment}</div>
              </td>
              <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                <button className="btn btn-tertiary" onClick={() => remove(r.id)}>
                  Sterge
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
