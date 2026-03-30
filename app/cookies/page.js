import Link from 'next/link'
import styles from '@/styles/static-page.module.css'

export const metadata = {
  title: 'Politica cookies - ShopHub',
  description: 'Informatii despre utilizarea cookie-urilor pe platforma ShopHub.',
}

export default function CookiesPage() {
  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumbs}>
        <Link href="/">Acasa</Link>
        <span className={styles.separator}>/</span>
        <span>Politica cookies</span>
      </nav>

      <div className={styles.card}>
        <h1 className={styles.title}>Politica cookies</h1>

        <div className={styles.content}>
          <h2>1. Ce sunt cookie-urile?</h2>
          <p>
            Cookie-urile sunt fisiere text de mici dimensiuni care sunt stocate pe
            dispozitivul dumneavoastra (computer, telefon, tableta) atunci cand
            vizitati un site web. Acestea permit site-ului sa va recunoasca
            dispozitivul si sa retina anumite informatii despre vizita dumneavoastra.
          </p>

          <h2>2. Cookie-uri esentiale</h2>
          <p>
            Aceste cookie-uri sunt necesare pentru functionarea corecta a site-ului
            si nu pot fi dezactivate. Ele permit functionalitati de baza, cum ar fi:
          </p>
          <ul>
            <li>Mentinerea sesiunii de autentificare</li>
            <li>Functionarea cosului de cumparaturi</li>
            <li>Memorarea preferintelor de confidentialitate</li>
            <li>Securitatea site-ului</li>
          </ul>

          <h2>3. Cookie-uri analitice</h2>
          <p>
            Utilizam cookie-uri analitice pentru a intelege modul in care vizitatorii
            interactioneaza cu site-ul nostru. Aceste informatii ne ajuta sa
            imbunatatim experienta de navigare. Datele colectate sunt anonimizate
            si includ:
          </p>
          <ul>
            <li>Numarul de vizitatori si paginile accesate</li>
            <li>Durata vizitelor si rata de respingere</li>
            <li>Sursa traficului (de unde vin vizitatorii)</li>
            <li>Performanta paginilor site-ului</li>
          </ul>

          <h2>4. Cookie-uri de marketing</h2>
          <p>
            Aceste cookie-uri sunt utilizate pentru a va afisa reclame relevante
            pe baza intereselor dumneavoastra. Ele pot fi setate de partenerii
            nostri de publicitate si sunt folosite pentru:
          </p>
          <ul>
            <li>Personalizarea reclamelor afisate</li>
            <li>Masurarea eficientei campaniilor publicitare</li>
            <li>Limitarea numarului de afisari ale unei reclame</li>
          </ul>

          <h2>5. Cookie-uri de functionare</h2>
          <p>
            Aceste cookie-uri permit site-ului sa ofere functionalitati imbunatatite
            si personalizare, cum ar fi:
          </p>
          <ul>
            <li>Memorarea preferintelor de limba</li>
            <li>Memorarea produselor vizualizate recent</li>
            <li>Personalizarea continutului afisat</li>
          </ul>

          <h2>6. Cum puteti controla cookie-urile?</h2>
          <p>
            Aveti mai multe optiuni pentru controlul cookie-urilor:
          </p>
          <ul>
            <li>
              <strong>Setarile browser-ului:</strong> Puteti configura browser-ul sa
              blocheze sau sa stearga cookie-urile. Consultati sectiunea de ajutor a
              browser-ului dumneavoastra pentru instructiuni specifice.
            </li>
            <li>
              <strong>Bannerul de cookie-uri:</strong> La prima vizita pe site, veti
              vedea un banner care va permite sa acceptati sau sa refuzati categoriile
              de cookie-uri non-esentiale.
            </li>
            <li>
              <strong>Setarile de pe site:</strong> Puteti modifica oricand
              preferintele de cookie-uri din setarile contului dumneavoastra.
            </li>
          </ul>
          <p>
            <strong>Atentie:</strong> Dezactivarea cookie-urilor esentiale poate
            afecta functionarea corecta a site-ului si a anumitor servicii.
          </p>

          <h2>7. Actualizarea politicii</h2>
          <p>
            Aceasta politica de cookies poate fi actualizata periodic. Va recomandam
            sa o consultati regulat pentru a fi la curent cu modul in care utilizam
            cookie-urile.
          </p>

          <h2>8. Contact</h2>
          <p>
            Pentru intrebari legate de utilizarea cookie-urilor, va rugam sa ne
            contactati la: <strong>dpo@shophub.ro</strong>. De asemenea, puteti
            consulta{' '}
            <Link href="/privacy">Politica de confidentialitate</Link> pentru
            informatii suplimentare despre protectia datelor personale.
          </p>
        </div>
      </div>
    </div>
  )
}
