import Link from 'next/link'
import styles from '@/styles/static-page.module.css'

export const metadata = {
  title: 'Cariere - ShopHub',
  description: 'Alatura-te echipei ShopHub. Descopera oportunitatile de cariera disponibile.',
}

export default function CareersPage() {
  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumbs}>
        <Link href="/">Acasa</Link>
        <span className={styles.separator}>/</span>
        <span>Cariere</span>
      </nav>

      <div className={styles.card}>
        <h1 className={styles.title}>Cariere</h1>

        <div className={styles.content}>
          <h2>Alatura-te echipei ShopHub</h2>
          <p>
            La ShopHub, credem ca succesul nostru se datoreaza oamenilor care fac parte
            din echipa noastra. Suntem mereu in cautarea unor profesionisti pasionati,
            creativi si dedicati, care doresc sa contribuie la transformarea comertului
            online din Romania.
          </p>

          <h2>Cultura noastra</h2>
          <p>
            Ne mandrim cu o cultura organizationala bazata pe colaborare, inovatie si
            respect reciproc. Oferim un mediu de lucru dinamic, unde fiecare membru al
            echipei are oportunitatea de a creste profesional si de a-si aduce contributia
            la proiecte interesante.
          </p>

          <h2>Beneficii</h2>
          <ul>
            <li>Salariu competitiv si bonusuri de performanta</li>
            <li>Program de lucru flexibil si posibilitate de remote</li>
            <li>Abonament medical privat</li>
            <li>Buget anual pentru dezvoltare profesionala si cursuri</li>
            <li>Zile libere suplimentare</li>
            <li>Reduceri la produsele ShopHub</li>
            <li>Team building-uri si evenimente de echipa</li>
          </ul>

          <h2>Pozitii deschise</h2>

          <div className={styles.jobCard}>
            <div className={styles.jobTitle}>Developer Full Stack</div>
            <div className={styles.jobMeta}>Bucuresti / Remote - Full-time</div>
          </div>

          <div className={styles.jobCard}>
            <div className={styles.jobTitle}>Customer Support Specialist</div>
            <div className={styles.jobMeta}>Bucuresti - Full-time</div>
          </div>

          <div className={styles.jobCard}>
            <div className={styles.jobTitle}>Specialist Marketing Digital</div>
            <div className={styles.jobMeta}>Bucuresti / Remote - Full-time</div>
          </div>

          <h2>Cum aplici?</h2>
          <p>
            Trimite-ne CV-ul tau actualizat si o scrisoare de intentie la adresa de
            email de mai jos. Mentoneaza in subiect pozitia pentru care aplici.
          </p>
          <a href="mailto:cariere@shophub.ro" className={styles.emailLink}>
            cariere@shophub.ro
          </a>
        </div>
      </div>
    </div>
  )
}
