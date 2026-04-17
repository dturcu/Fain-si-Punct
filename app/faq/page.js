'use client'

import { useState } from 'react'
import styles from '@/styles/pages.module.css'

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null)

  // Romanian-first FAQ. Return window aligned with OUG 34/2014 (14 zile).
  // Free shipping above the threshold is enforced in app/api/checkout/route.js.
  const faqs = [
    {
      question: 'Care este politica de retur?',
      answer:
        'Ai la dispozitie 14 zile calendaristice din momentul primirii coletului pentru a returna produsele, conform OUG 34/2014. Produsele trebuie sa fie in starea originala, nefolosite si cu ambalajul intact.',
    },
    {
      question: 'Oferiti livrare gratuita?',
      answer:
        'Da, comenzile peste 200 lei beneficiaza de livrare gratuita. Pentru comenzile sub acest prag, transportul costa 15.99 lei.',
    },
    {
      question: 'Cat dureaza livrarea?',
      answer:
        'Livrarea standard prin Sameday dureaza 1-3 zile lucratoare in functie de localitate. In zilele lucratoare expedierea se face in aceeasi zi pentru comenzile plasate pana la ora 14:00.',
    },
    {
      question: 'Plata este sigura?',
      answer:
        'Da, toate platile sunt procesate prin Stripe, PayPal sau Revolut peste conexiune HTTPS cu criptare SSL. Nu stocam datele cardului pe serverele noastre.',
    },
    {
      question: 'Pot modifica o comanda dupa plasare?',
      answer:
        'Comanda poate fi modificata in primele 60 de minute de la plasare, atat timp cat nu a intrat in procesare. Contacteaza-ne cat mai rapid la adresa din pagina Contact.',
    },
    {
      question: 'Livrati in afara Romaniei?',
      answer:
        'In prezent livram doar pe teritoriul Romaniei. Planuim extinderea catre alte tari din UE in viitor.',
    },
    {
      question: 'Cum imi urmaresc comanda?',
      answer:
        'Dupa expediere primesti un email cu numarul AWB Sameday. Poti urmari coletul in pagina Comenzile mele sau direct pe sameday.ro.',
    },
    {
      question: 'Ce metode de plata acceptati?',
      answer:
        'Acceptam card bancar (Visa, Mastercard) prin Stripe, Revolut Pay, PayPal si plata ramburs (cash la livrare).',
    },
  ]

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className={styles.container}>
      <h1>Intrebari frecvente</h1>

      <div className={styles.faqList}>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index
          const panelId = `faq-panel-${index}`
          const buttonId = `faq-button-${index}`
          return (
            <div
              key={index}
              className={`${styles.faqItem} ${isOpen ? styles.open : ''}`}
            >
              <button
                id={buttonId}
                className={styles.question}
                onClick={() => toggleFAQ(index)}
                aria-expanded={isOpen}
                aria-controls={panelId}
              >
                <span>{faq.question}</span>
                <span className={styles.icon} aria-hidden="true">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={styles.answer}
                >
                  {faq.answer}
                </div>
              )}
            </div>
          )
        })}
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
