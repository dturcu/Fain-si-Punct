'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from '@/styles/auth.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      if (data.success) {
        setSent(true)
      } else {
        setError(data.error || 'A aparut o eroare')
      }
    } catch {
      setError('Eroare de retea. Incearca din nou.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Verifica email-ul</h1>
          <p className={styles.subtitle}>
            Daca exista un cont cu adresa <strong>{email}</strong>, vei primi un email cu un link de resetare a parolei.
          </p>
          <p className={styles.subtitle}>
            Link-ul expira in 1 ora.
          </p>
          <Link href="/auth/login" className={styles.linkBtn}>
            Inapoi la autentificare
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Ai uitat parola?</h1>
        <p className={styles.subtitle}>
          Introdu adresa de email asociata contului tau si iti vom trimite un link de resetare.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="exemplu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Se trimite...' : 'Trimite link de resetare'}
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/auth/login">Inapoi la autentificare</Link>
        </div>
      </div>
    </div>
  )
}
