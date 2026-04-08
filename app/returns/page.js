import Link from 'next/link'
import styles from '@/styles/static-page.module.css'

export const metadata = {
  title: 'Politica de retur - Fain si Punct',
  description: 'Informatii despre politica de retur Fain si Punct - 30 de zile pentru returnarea produselor.',
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
          <h2>1. Dreptul de retur</h2>
          <p>
            La Fain si Punct, satisfactia dumneavoastra este prioritatea noastra. Aveti
            dreptul de a returna produsele achizitionate in termen de
            <strong> 30 de zile calendaristice</strong> de la data primirii coletului,
            fara a fi necesara invocarea unui motiv. Acest termen depaseste cerinta
            legala minima de 14 zile, oferindu-va mai mult timp pentru a decide.
          </p>

          <h2>2. Conditii de retur</h2>
          <p>Pentru a fi acceptat, returul trebuie sa indeplineasca urmatoarele conditii:</p>
          <ul>
            <li>Produsul sa fie in starea originala, nefolosit si nedeteriorat</li>
            <li>Ambalajul original sa fie intact si complet</li>
            <li>Toate accesoriile, etichetele si documentele sa fie incluse</li>
            <li>Produsul sa fie insotit de factura sau dovada achizitiei</li>
          </ul>

          <h2>3. Cum initiezi un retur?</h2>
          <p>Procesul de retur este simplu si poate fi initiat in cativa pasi:</p>
          <ol>
            <li>
              Accesati contul dumneavoastra Fain si Punct si selectati comanda care contine
              produsul pe care doriti sa il returnati
            </li>
            <li>
              Apasati butonul &quot;Solicita retur&quot; si completati formularul cu
              motivul returului
            </li>
            <li>
              Veti primi prin email o eticheta de retur si instructiunile de expediere
            </li>
            <li>
              Ambalati produsul in siguranta si predati coletul curierului sau la
              punctul de colectare indicat
            </li>
          </ol>
          <p>
            Alternativ, puteti solicita un retur contactandu-ne prin email la
            <strong> contact@fain-si-punct.ro</strong> sau prin formularul de contact.
          </p>

          <h2>4. Costurile returului</h2>
          <p>
            In cazul in care produsul prezinta defecte sau a fost livrat gresit,
            costurile de transport pentru retur sunt suportate integral de Fain si Punct.
            In cazul retururilor din motive personale, costul transportului de retur
            este in sarcina cumparatorului.
          </p>

          <h2>5. Procesarea rambursarii</h2>
          <p>
            Dupa primirea si verificarea produsului returnat, rambursarea se
            proceseaza astfel:
          </p>
          <ul>
            <li>
              <strong>Verificare:</strong> Produsul este inspectat in termen de 2
              zile lucratoare de la primire
            </li>
            <li>
              <strong>Aprobare:</strong> Veti fi notificat prin email despre
              aprobarea returului
            </li>
            <li>
              <strong>Rambursare:</strong> Suma va fi returnata in termen de 14 zile
              calendaristice de la aprobarea returului, folosind aceeasi metoda de
              plata utilizata la achizitie
            </li>
          </ul>

          <h2>6. Exceptii</h2>
          <p>Urmatoarele categorii de produse nu pot fi returnate:</p>
          <ul>
            <li>Produse personalizate sau realizate la comanda</li>
            <li>Produse de igiena personala desigilate</li>
            <li>Software si continut digital descarcat sau activat</li>
            <li>Produse perisabile sau cu termen de valabilitate scurt</li>
            <li>Produse care au fost modificate sau deteriorate de cumparator</li>
          </ul>

          <h2>7. Produse defecte sau gresite</h2>
          <p>
            Daca ati primit un produs defect, deteriorat sau diferit de cel comandat,
            va rugam sa ne contactati in termen de 48 de ore de la primirea coletului.
            In aceste cazuri, vom asigura inlocuirea produsului sau rambursarea
            integrala, inclusiv costurile de transport.
          </p>

          <h2>8. Contact</h2>
          <p>
            Pentru orice intrebari legate de retururi, echipa noastra de suport
            va sta la dispozitie la <strong>contact@fain-si-punct.ro</strong> sau prin
            pagina de <Link href="/contact">Contact</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}
