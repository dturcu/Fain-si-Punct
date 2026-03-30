'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from '@/styles/auth.module.css'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error)
        return
      }

      router.push('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>
          Shop<span>Hub</span>
        </div>
        <h1 className={styles.title}>Creeaza un cont</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.formBody}>
          <div className={styles.fieldGroup}>
            <label htmlFor="firstName" className={styles.label}>Prenume</label>
            <input
              id="firstName"
              type="text"
              name="firstName"
              className={styles.input}
              required
              value={formData.firstName}
              onChange={handleChange}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="lastName" className={styles.label}>Nume</label>
            <input
              id="lastName"
              type="text"
              name="lastName"
              className={styles.input}
              required
              value={formData.lastName}
              onChange={handleChange}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              name="email"
              className={styles.input}
              required
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="password" className={styles.label}>Parola</label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                className={styles.input}
                required
                minLength="6"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className={styles.eyeButton}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Ascunde parola' : 'Arata parola'}
              >
                {showPassword ? '\u25C9' : '\u25CE'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Se creeaza...' : 'Creeaza contul'}
          </button>
        </form>

        <hr className={styles.divider} />

        <p className={styles.switchText}>
          Ai deja un cont? <Link href="/auth/login">Autentifica-te</Link>
        </p>
      </div>
    </div>
  )
}
