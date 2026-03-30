import Link from 'next/link'
import styles from '@/styles/static-page.module.css'

export const metadata = {
  title: 'Termeni si conditii - ShopHub',
  description: 'Termenii si conditiile de utilizare a platformei ShopHub.',
}

export default function TermsPage() {
  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumbs}>
        <Link href="/">Acasa</Link>
        <span className={styles.separator}>/</span>
        <span>Termeni si conditii</span>
      </nav>

      <div className={styles.card}>
        <h1 className={styles.title}>Termeni si conditii</h1>

        <div className={styles.content}>
          <h2>1. Informatii generale</h2>
          <p>
            Prezentul document stabileste termenii si conditiile de utilizare a
            platformei ShopHub (www.shophub.ro). Prin accesarea si utilizarea
            site-ului, acceptati in mod expres acesti termeni. Va rugam sa cititi
            cu atentie acest document inainte de a utiliza serviciile noastre.
          </p>

          <h2>2. Definitii</h2>
          <p>
            <strong>Vanzator</strong> - ShopHub SRL, operatorul platformei.<br />
            <strong>Cumparator</strong> - orice persoana fizica sau juridica care
            plaseaza o comanda pe platforma.<br />
            <strong>Produs</strong> - orice bun listat pe platforma ShopHub.<br />
            <strong>Comanda</strong> - documentul electronic prin care cumparatorul
            solicita achizitionarea unuia sau mai multor produse.
          </p>

          <h2>3. Comenzi</h2>
          <p>
            Plasarea unei comenzi pe ShopHub constituie o oferta ferma de cumparare.
            Comanda este confirmata prin email dupa procesarea acesteia. Ne rezervam
            dreptul de a refuza sau anula comenzile in cazuri justificate, cum ar fi
            indisponibilitatea produselor sau suspiciuni de frauda.
          </p>

          <h2>4. Preturi si plata</h2>
          <p>
            Toate preturile afisate pe site includ TVA. Preturile sunt exprimate in
            Lei (RON) si pot fi modificate fara notificare prealabila. Pretul aplicabil
            este cel afisat la momentul plasarii comenzii.
          </p>
          <p>
            Metodele de plata acceptate includ: card bancar (Visa, Mastercard),
            transfer bancar, plata la livrare (ramburs) si plata prin platforma
            de plati online.
          </p>

          <h2>5. Livrare</h2>
          <p>
            Livrarile se efectueaza pe teritoriul Romaniei prin curierat rapid.
            Termenul estimat de livrare este de 1-5 zile lucratoare, in functie de
            disponibilitatea produselor si adresa de livrare. Costurile de livrare
            sunt afisate in cosul de cumparaturi inainte de finalizarea comenzii.
          </p>

          <h2>6. Dreptul de retragere</h2>
          <p>
            Conform legislatiei in vigoare (OUG 34/2014), aveti dreptul de a va
            retrage din contract in termen de 14 zile calendaristice de la primirea
            produsului, fara a fi necesara invocarea unui motiv. ShopHub extinde
            acest termen la 30 de zile calendaristice.
          </p>

          <h2>7. Garantii</h2>
          <p>
            Toate produsele comercializate beneficiaza de garantia legala de
            conformitate de 2 ani, conform legislatiei romanesti. Certificatele
            de garantie sunt furnizate impreuna cu produsele, acolo unde este cazul.
          </p>

          <h2>8. Raspundere</h2>
          <p>
            ShopHub depune eforturi rezonabile pentru a asigura acuratetea
            informatiilor prezentate pe site. Nu ne asumam raspunderea pentru
            eventualele erori tipografice sau inexactitati in descrierile produselor.
            Imaginile produselor au caracter informativ si pot diferi de aspectul real.
          </p>

          <h2>9. Proprietate intelectuala</h2>
          <p>
            Intregul continut al site-ului (texte, imagini, logo-uri, elemente
            grafice) este proprietatea ShopHub sau a furnizorilor sai si este protejat
            de legislatia privind drepturile de autor. Reproducerea fara acordul scris
            al ShopHub este interzisa.
          </p>

          <h2>10. Modificarea termenilor</h2>
          <p>
            ShopHub isi rezerva dreptul de a modifica prezentii termeni si conditii
            in orice moment. Modificarile intra in vigoare la data publicarii pe site.
            Continuarea utilizarii site-ului dupa publicarea modificarilor constituie
            acceptarea noilor termeni.
          </p>

          <h2>11. Legea aplicabila</h2>
          <p>
            Prezentii termeni si conditii sunt guvernati de legislatia romana.
            Orice litigiu va fi solutionat de instantele competente din Romania.
          </p>
        </div>
      </div>
    </div>
  )
}
