import styles from '@/styles/testimonials.module.css'

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Ana M.',
    city: 'Iași',
    rating: 5,
    text: 'Am comandat de 3 ori si de fiecare data produsele au ajuns repede si in stare perfecta. Recomand cu incredere!',
  },
  {
    id: 2,
    name: 'Mihai D.',
    city: 'Cluj',
    rating: 5,
    text: 'Raport calitate-pret excelent. Am gasit produse pe care nu le gasesti usor in alte parti.',
  },
  {
    id: 3,
    name: 'Elena P.',
    city: 'Bucuresti',
    rating: 4,
    text: 'Livrare rapida, produse conforme cu descrierea. Serviciu clienti prompt.',
  },
  {
    id: 4,
    name: 'Andrei V.',
    city: 'Timisoara',
    rating: 5,
    text: 'Am economisit mult comparativ cu magazinele clasice. Calitate foarte buna.',
  },
]

function Stars({ rating }) {
  return (
    <span className={styles.stars} aria-label={`${rating} din 5 stele`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rating ? styles.starFilled : styles.starEmpty}>
          &#9733;
        </span>
      ))}
    </span>
  )
}

export default function Testimonials() {
  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>Ce spun clientii nostri</h2>
        <p className={styles.subtitle}>Recenzii reale de la cumparatori verificati</p>
      </div>
      <div className={styles.grid}>
        {TESTIMONIALS.map((t) => (
          <div key={t.id} className={styles.card}>
            <Stars rating={t.rating} />
            <blockquote className={styles.quote}>&ldquo;{t.text}&rdquo;</blockquote>
            <footer className={styles.author}>
              <span className={styles.name}>{t.name}</span>
              <span className={styles.city}>{t.city}</span>
            </footer>
          </div>
        ))}
      </div>
    </section>
  )
}
