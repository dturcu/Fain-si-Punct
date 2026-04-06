import Link from 'next/link'
import styles from '@/styles/static-page.module.css'

export const metadata = {
  title: 'Blog - Fain si Punct',
  description: 'Blogul Fain si Punct - ghiduri de cumparare, noutati si sfaturi utile.',
}

export default function BlogPage() {
  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumbs}>
        <Link href="/">Acasa</Link>
        <span className={styles.separator}>/</span>
        <span>Blog</span>
      </nav>

      <div className={styles.card}>
        <h1 className={styles.title}>Blog</h1>

        <div className={styles.comingSoon}>
          <div className={styles.comingSoonIcon}>&#9997;</div>
          <div className={styles.comingSoonTitle}>
            Blogul nostru va fi disponibil in curand!
          </div>
          <div className={styles.comingSoonText}>
            <p>
              Lucram la continut valoros pe care abia asteptam sa-l impartasim cu tine.
              Pe blogul Fain si Punct vei gasi:
            </p>
            <ul style={{ textAlign: 'left', display: 'inline-block', marginTop: '1rem' }}>
              <li>Ghiduri de cumparare pentru a face cele mai bune alegeri</li>
              <li>Noutati despre produse si tendinte din industrie</li>
              <li>Sfaturi si trucuri pentru a profita la maxim de achizitiile tale</li>
              <li>Recenzii detaliate ale produselor populare</li>
            </ul>
            <p style={{ marginTop: '1.5rem' }}>
              Revino in curand pentru articole interesante si informatii utile!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
