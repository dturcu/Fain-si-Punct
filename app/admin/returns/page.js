'use client'

import { useEffect, useState } from 'react'

/**
 * Admin — return requests queue.
 * Lists pending/approved returns and lets the operator approve, reject,
 * or mark as refunded via PUT /api/admin/returns/[id].
 *
 * Minimal UI on purpose — consistent with the existing admin pages which
 * rely on the site's global button tokens rather than bespoke styling.
 */
export default function AdminReturnsPage() {
  const [returns, setReturns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('requested')
  const [error, setError] = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const qs = filter ? `?status=${encodeURIComponent(filter)}` : ''
      const res = await fetch(`/api/admin/returns${qs}`)
      const body = await res.json()
      if (!res.ok || !body.success) {
        throw new Error(body.error?.message || 'Eroare la incarcare')
      }
      setReturns(body.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  async function act(id, action, note) {
    try {
      const res = await fetch(`/api/admin/returns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note }),
      })
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
      <h1 style={{ marginBottom: '1rem' }}>Retururi</h1>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        {['requested', 'approved', 'refunded', 'rejected', 'cancelled', ''].map((s) => (
          <button
            key={s || 'all'}
            className={`btn ${filter === s ? 'btn-primary' : 'btn-tertiary'}`}
            onClick={() => setFilter(s)}
          >
            {s || 'toate'}
          </button>
        ))}
      </div>

      {loading && <p>Se incarca...</p>}
      {error && <p style={{ color: '#c13515' }}>{error}</p>}

      {!loading && returns.length === 0 && <p>Nicio cerere.</p>}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Creat</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Comanda</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Motiv</th>
            <th style={{ padding: '0.5rem', textAlign: 'left' }}>Stare</th>
            <th style={{ padding: '0.5rem', textAlign: 'right' }}>Actiuni</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((r) => (
            <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.5rem' }}>
                {new Date(r.createdAt).toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' })}
              </td>
              <td style={{ padding: '0.5rem', fontFamily: 'monospace' }}>
                {r.orderId.slice(0, 8)}…
              </td>
              <td style={{ padding: '0.5rem' }}>{r.reasonCode}</td>
              <td style={{ padding: '0.5rem' }}>
                <span
                  style={{
                    padding: '0.2rem 0.5rem',
                    borderRadius: 4,
                    background:
                      r.status === 'refunded'
                        ? '#d4edda'
                        : r.status === 'rejected' || r.status === 'cancelled'
                        ? '#f8d7da'
                        : r.status === 'approved'
                        ? '#fff3cd'
                        : '#e2e3e5',
                    fontSize: '0.85rem',
                  }}
                >
                  {r.status}
                </span>
              </td>
              <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                {r.status === 'requested' && (
                  <>
                    <button
                      className="btn btn-tertiary"
                      onClick={() => act(r.id, 'reject', prompt('Motiv respingere:') || undefined)}
                      style={{ marginRight: '0.5rem' }}
                    >
                      Respinge
                    </button>
                    <button className="btn btn-primary" onClick={() => act(r.id, 'approve')}>
                      Aproba
                    </button>
                  </>
                )}
                {r.status === 'approved' && (
                  <>
                    <button
                      className="btn btn-tertiary"
                      onClick={() => act(r.id, 'cancel')}
                      style={{ marginRight: '0.5rem' }}
                    >
                      Anuleaza
                    </button>
                    <button className="btn btn-primary" onClick={() => act(r.id, 'refund')}>
                      Ramburseaza
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
