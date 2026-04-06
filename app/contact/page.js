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
      <h1>Contact Us</h1>

      <section className={styles.section}>
        <div className={styles.contactInfo}>
          <div className={styles.infoItem}>
            <h3>Email</h3>
            <p>
              <a href="mailto:support@fain-si-punct.com">support@fain-si-punct.com</a>
            </p>
          </div>

          <div className={styles.infoItem}>
            <h3>Phone</h3>
            <p>1-800-FAIN</p>
          </div>

          <div className={styles.infoItem}>
            <h3>Address</h3>
            <p>
              Fain si Punct Inc.
              <br />
              123 Commerce Street
              <br />
              New York, NY 10001
            </p>
          </div>

          <div className={styles.infoItem}>
            <h3>Hours</h3>
            <p>
              Monday - Friday: 9AM - 6PM EST
              <br />
              Saturday - Sunday: 10AM - 4PM EST
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Send us a Message</h2>

        {submitted && (
          <div className={styles.success}>
            Thank you for your message! We'll get back to you soon.
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            required
            value={formData.name}
            onChange={handleChange}
          />
          <input
            type="email"
            name="email"
            placeholder="Your Email"
            required
            value={formData.email}
            onChange={handleChange}
          />
          <input
            type="text"
            name="subject"
            placeholder="Subject"
            required
            value={formData.subject}
            onChange={handleChange}
          />
          <textarea
            name="message"
            placeholder="Your Message"
            rows="6"
            required
            value={formData.message}
            onChange={handleChange}
          ></textarea>
          <button type="submit">Send Message</button>
        </form>
      </section>
    </div>
  )
}
