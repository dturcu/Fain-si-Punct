'use client'

import { useState } from 'react'
import styles from '@/styles/pages.module.css'

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null)

  const faqs = [
    {
      question: 'What is your return policy?',
      answer:
        'We offer a 30-day return policy on all items. Products must be in original condition with packaging.',
    },
    {
      question: 'Do you offer free shipping?',
      answer:
        'Yes! We offer free shipping on all orders, regardless of order size.',
    },
    {
      question: 'How long does delivery take?',
      answer:
        'Standard delivery takes 5-7 business days. Express shipping options are available.',
    },
    {
      question: 'Is my payment information secure?',
      answer:
        'Yes, we use industry-standard SSL encryption to protect all payment information.',
    },
    {
      question: 'Can I change my order after placing it?',
      answer:
        'Orders can be modified within 1 hour of placement. Please contact support immediately.',
    },
    {
      question: 'Do you ship internationally?',
      answer:
        'Yes, we ship to most countries worldwide. Shipping costs vary by location.',
    },
    {
      question: 'How can I track my order?',
      answer:
        "You'll receive a tracking number via email once your order ships.",
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept credit cards, debit cards, PayPal, and digital wallets.',
    },
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className={styles.container}>
      <h1>Frequently Asked Questions</h1>

      <div className={styles.faqList}>
        {faqs.map((faq, index) => (
          <div
            key={index}
            className={`${styles.faqItem} ${
              openIndex === index ? styles.open : ''
            }`}
          >
            <button
              className={styles.question}
              onClick={() => toggleFAQ(index)}
            >
              <span>{faq.question}</span>
              <span className={styles.icon}>
                {openIndex === index ? '−' : '+'}
              </span>
            </button>
            {openIndex === index && (
              <div className={styles.answer}>{faq.answer}</div>
            )}
          </div>
        ))}
      </div>

      <section className={styles.section}>
        <h2>Nu ai gasit raspunsul?</h2>
        <p>
          Daca ai intrebari suplimentare, te rugam sa{' '}
          <a href="/contact">contactezi echipa noastra</a>.
        </p>
      </section>
    </div>
  )
}
