import Link from 'next/link'
import styles from '@/styles/static-page.module.css'

export const metadata = {
  title: 'Politica de retur - Fain si Punct',
  description:
    'Politica de retur Fain si Punct: 14 zile conform OUG 34/2014. Conditii, procedura si rambursare.',
}

export default function ReturnsPage() {
  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumbs}>
        <Link href="/">Acasa</Link>
        <span className={styles.separator}>/</span>
        <span>Politica de retur</span>
      </nav>

      <div className={styles.card}>
        <h1 className={styles.title}>Politica de retur</h1>

        <div className={styles.content}>
          <p>
            <em>
              Ultima actualizare: aprilie 2026. Acest document reflecta obligatiile
              minime impuse de lege. Pentru cazuri particulare ne rezervam dreptul
              de a aplica politica legala fara a extinde termenii.
            </em>
          </p>

          <h2>1. Dreptul de retragere (14 zile)</h2>
          <p>
            Conform <strong>OUG 34/2014</strong>, aveti dreptul sa va retrageti din
            contract in termen de <strong>14 zile calendaristice</strong> de la data
            primirii produsului, fara invocarea unui motiv si fara a suporta alte
            costuri decat cele prevazute de lege.
          </p>

          <h2>2. Cum initiati returul</h2>
          <ol>
            <li>
              Accesati <Link href="/account/orders">Comenzile mele</Link> si selectati
              comanda din care doriti sa returnati unul sau mai multe produse.
            </li>
            <li>
              Apasati <strong>Solicita retur</strong>, alegeti motivul si cantitatea.
              Cererea este inregistrata automat si va primi un raspuns in maxim
              2 zile lucratoare.
            </li>
            <li>
              Puteti de asemenea sa ne notificati in scris la{' '}
              <strong>contact@fain-si-punct.ro</strong> folosind orice declaratie
              neechivoca. Modelul formularului tipizat prevazut de OUG 34/2014 este
              acceptat, dar nu este obligatoriu.
            </li>
          </ol>

          <h2>3. Conditiile produsului returnat</h2>
          <ul>
            <li>Produsul trebuie sa fie in aceeasi stare ca la primire.</li>
            <li>Ambalajul original, etichetele si accesoriile sa fie complete.</li>
            <li>
              Raspunderea pentru diminuarea valorii produsului cauzata de manipulari
              care depasesc verificarea functionarii ii revine consumatorului.
            </li>
          </ul>

          <h2>4. Costul returului</h2>
          <p>
            Costul direct al returnarii produsului este suportat de consumator,
            conform art. 13 alin. (3) din OUG 34/2014. In cazul in care produsul
            primit este defect sau diferit de cel comandat, costurile de retur
            sunt suportate de Fain si Punct.
          </p>

          <h2>5. Rambursarea</h2>
          <p>
            Rambursam suma platita (inclusiv costurile standard de livrare) fara
            intarzieri nejustificate si nu mai tarziu de{' '}
            <strong>14 zile de la data primirii deciziei de retragere</strong>. Ne
            rezervam dreptul de a amana rambursarea pana la primirea produsului
            returnat sau pana la prezentarea dovezii de expediere, oricare dintre
            acestea survine prima (art. 14 alin. (3) OUG 34/2014).
          </p>
          <p>
            Rambursarea se face folosind aceeasi metoda de plata utilizata la
            achizitie, cu exceptia cazului in care consumatorul accepta o alta
            modalitate.
          </p>

          <h2>6. Exceptii de la dreptul de retragere</h2>
          <p>Conform art. 16 din OUG 34/2014, sunt exceptate inclusiv:</p>
          <ul>
            <li>Produsele confectionate dupa specificatiile consumatorului sau personalizate.</li>
            <li>Produsele care se pot deteriora sau expira rapid.</li>
            <li>
              Produsele sigilate care nu pot fi returnate din motive de protectie a
              sanatatii sau din motive de igiena, desigilate dupa livrare.
            </li>
            <li>
              Inregistrarile audio sau video sigilate ori programele informatice
              sigilate, care au fost desigilate dupa livrare.
            </li>
            <li>Continut digital furnizat si activat cu acordul prealabil al consumatorului.</li>
          </ul>

          <h2>7. Solutionare amiabila si ANPC</h2>
          <p>
            In caz de nemultumire privind aplicarea acestei politici, puteti apela
            la procedura de solutionare alternativa a litigiilor prin{' '}
            <a href="https://anpc.ro/ce-este-sal/" target="_blank" rel="noopener noreferrer">
              ANPC-SAL
            </a>{' '}
            sau la platforma europeana{' '}
            <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
              SOL
            </a>
            .
          </p>

          <h2>8. Contact</h2>
          <p>
            Email: <strong>contact@fain-si-punct.ro</strong>
            <br />
            Formular:{' '}
            <Link href="/contact">pagina de Contact</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
