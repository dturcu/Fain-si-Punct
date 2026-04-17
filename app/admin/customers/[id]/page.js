'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

/**
 * Admin — customer drill-down. Displays profile, recent orders, reviews,
 * and last 20 audit events. Read-only for now; destructive actions
 * (reset password, disable account) deferred until we have signed email
 * + audit policy for them.
 */
export default function AdminCustomerDetailPage() {
  const params = useParams()
  const id = params?.id
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/admin/customers/${id}`)
        const body = await res.json()
        if (!res.ok || !body.success) {
          throw new Error(body.error?.message || 'Eroare la incarcare')
        }
        if (!cancelled) setData(body.data)
      } catch (e) {
        if (!cancelled) setError(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  if (loading) return <div style={{ padding: '1.5rem' }}>Se incarca...</div>
  if (error) return <div style={{ padding: '1.5rem', color: '#c13515' }}>{error}</div>
  if (!data) return null

  const { profile, orders, reviews, auditEvents } = data
  const fmtMoney = (n) => n.toLocaleString('ro-RO', { minimumFractionDigits: 2 })
  const fmtDate = (s) => new Date(s).toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest' })

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1100, margin: '0 auto' }}>
      <p><Link href="/admin/customers">&larr; Inapoi la lista clienti</Link></p>

      <h1>{[profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.email}</h1>
      <p style={{ color: '#555' }}>
        {profile.email} · {profile.phone || 'fara telefon'} · rol <strong>{profile.role}</strong>
        {!profile.isActive && <span style={{ color: '#c13515' }}> · INACTIV</span>}
        {' · cont creat '}{fmtDate(profile.createdAt)}
      </p>

      <h2 style={{ marginTop: '2rem' }}>Comenzi ({orders.length})</h2>
      {orders.length === 0 && <p>Nicio comanda.</p>}
      {orders.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Nr.</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Data</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Stare</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Plata</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>
                  <Link href={`/admin/orders`}>{o.orderNumber}</Link>
                </td>
                <td style={{ padding: '0.5rem' }}>{fmtDate(o.createdAt)}</td>
                <td style={{ padding: '0.5rem' }}>{o.status}</td>
                <td style={{ padding: '0.5rem' }}>{o.paymentMethod} / {o.paymentStatus}</td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>{fmtMoney(o.total)} lei</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: '2rem' }}>Recenzii ({reviews.length})</h2>
      {reviews.length === 0 && <p>Nicio recenzie.</p>}
      {reviews.map((r) => (
        <div key={r.id} style={{ borderBottom: '1px solid #eee', padding: '0.5rem 0' }}>
          <strong>{'★'.repeat(r.rating)}</strong>{' '}
          <span style={{ color: '#bbb' }}>{'★'.repeat(5 - r.rating)}</span>
          <span style={{ marginLeft: '0.5rem' }}>{r.title || '(fara titlu)'}</span>
          <span style={{ marginLeft: '0.5rem', color: '#888', fontSize: '0.85rem' }}>
            produs {String(r.product_id).slice(0, 8)}… · {fmtDate(r.created_at)}
          </span>
        </div>
      ))}

      <h2 style={{ marginTop: '2rem' }}>Ultimele evenimente de audit</h2>
      {auditEvents.length === 0 && <p>Nimic.</p>}
      {auditEvents.map((e, i) => (
        <div key={i} style={{ fontFamily: 'monospace', fontSize: '0.85rem', padding: '0.2rem 0' }}>
          {fmtDate(e.created_at)} · <strong>{e.event_type}</strong> · {e.ip_address || '—'}
          {e.metadata && ` · ${typeof e.metadata === 'string' ? e.metadata : JSON.stringify(e.metadata)}`}
        </div>
      ))}
    </div>
  )
}
