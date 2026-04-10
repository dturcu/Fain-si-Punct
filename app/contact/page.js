'use client'

import { useState } from 'react'
import styles from '@/styles/pages.module.css'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, this would send an email
    console.log('Form submitted:', formData)
    setSubmitted(true)
    setFormData({ name: '', email: '', subject: '', message: '' })

    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <div className={styles.container}>
      <h1>Contact</h1>

      <section className={styles.section}>
        <div className={styles.contactInfo}>
          <div className={styles.infoItem}>
            <h3>Email</h3>
            <p>
              <a href="mailto:contact@fain-si-punct.ro">contact@fain-si-punct.ro</a>
            </p>
          </div>

          <div className={styles.infoItem}>
            <h3>Telefon</h3>
            <p>+40 XXX XXX XXX</p>
          </div>

          <div className={styles.infoItem}>
            <h3>Adresa</h3>
            <p>
              Fain si Punct SRL
              <br />
              Iasi, Romania
            </p>
          </div>

          <div className={styles.infoItem}>
            <h3>Program</h3>
            <p>
              Luni - Vineri: 9:00 - 18:00 EET
              <br />
              Sambata - Duminica: Inchis
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Trimite-ne un mesaj</h2>

        {submitted && (
          <div className={styles.success}>
            Multumim pentru mesaj! Vom reveni cu un raspuns in cel mai scurt timp.
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            name="name"
            placeholder="Numele tau"
            required
            value={formData.name}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Email-ul tau"
            required
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="text"
            name="subject"
            placeholder="Subiect"
            required
            value={formData.subject}
            onChange={handleChange}
          />
          <textarea
            name="message"
            placeholder="Mesajul tau"
            rows="6"
            required
            value={formData.message}
            onChange={handleChange}
          ></textarea>
          <button type="submit">Trimite mesajul</button>
        </form>
      </section>
    </div>
  )
}
