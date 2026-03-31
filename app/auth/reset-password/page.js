'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import styles from '@/styles/auth.module.css'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Link invalid</h1>
          <p className={styles.subtitle}>
            Link-ul de resetare a parolei este invalid sau a expirat.
          </p>
          <Link href="/auth/forgot-password" className={styles.linkBtn}>
            Solicita un nou link
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Parola trebuie sa aiba minim 6 caractere')
      return
    }
    if (password !== confirmPassword) {
      setError('Parolele nu coincid')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()
      if (data.success) {
        setSuccess(true)
      } else {
        setError(data.error || 'A aparut o eroare')
      }
    } catch {
      setError('Eroare de retea. Incearca din nou.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h1 className={styles.title}>Parola resetata!</h1>
          <p className={styles.subtitle}>
            Parola ta a fost schimbata cu succes. Te poti autentifica cu noua parola.
          </p>
          <Link href="/auth/login" className={styles.linkBtn}>
            Autentificare
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Reseteaza parola</h1>
        <p className={styles.subtitle}>Introdu noua parola pentru contul tau.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="password">Parola noua</label>
            <input
              id="password"
              type="password"
              placeholder="Minim 6 caractere"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmPassword">Confirma parola</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="Repeta parola"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'Se reseteaza...' : 'Reseteaza parola'}
          </button>
        </form>

        <div className={styles.links}>
          <Link href="/auth/login">Inapoi la autentificare</Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ textAlign: 'center', padding: '2rem' }}>Se incarca...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
