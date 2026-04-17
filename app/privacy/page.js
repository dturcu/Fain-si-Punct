import Link from 'next/link'
import styles from '@/styles/static-page.module.css'

export const metadata = {
  title: 'Politica de confidentialitate - Fain si Punct',
  description: 'Politica de confidentialitate Fain si Punct - cum protejam datele tale personale.',
}

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <nav className={styles.breadcrumbs}>
        <Link href="/">Acasa</Link>
        <span className={styles.separator}>/</span>
        <span>Politica de confidentialitate</span>
      </nav>

      <div className={styles.card}>
        <h1 className={styles.title}>Politica de confidentialitate</h1>

        <div className={styles.content}>
          <h2>1. Introducere</h2>
          <p>
            Fain si Punct SRL respecta confidentialitatea datelor dumneavoastra personale.
            Aceasta politica descrie modul in care colectam, utilizam, stocam si
            protejam datele personale, in conformitate cu Regulamentul General privind
            Protectia Datelor (GDPR - Regulamentul UE 2016/679) si cu legislatia
            romana in domeniul protectiei datelor (Legea nr. 190/2018).
          </p>

          <h2>2. Operatorul de date</h2>
          <p>
            Operatorul de date cu caracter personal este Fain si Punct SRL, cu sediul in
            Bucuresti, Romania. Pentru orice intrebari legate de protectia datelor,
            ne puteti contacta la adresa: <strong>dpo@fain-si-punct.ro</strong>.
          </p>

          <h2>3. Date personale colectate</h2>
          <p>Colectam urmatoarele categorii de date personale:</p>
          <ul>
            <li>
              <strong>Date de identificare:</strong> nume, prenume, adresa de email,
              numar de telefon
            </li>
            <li>
              <strong>Date de livrare:</strong> adresa postala completa
            </li>
            <li>
              <strong>Date de facturare:</strong> adresa de facturare, CUI (pentru
              persoane juridice)
            </li>
            <li>
              <strong>Date tehnice:</strong> adresa IP, tipul de browser, dispozitivul
              utilizat, paginile accesate
            </li>
            <li>
              <strong>Date despre comenzi:</strong> istoricul comenzilor, produsele
              achizitionate, preferintele de cumparare
            </li>
          </ul>

          <h2>4. Scopul prelucrarii</h2>
          <p>Datele personale sunt prelucrate in urmatoarele scopuri:</p>
          <ul>
            <li>Procesarea si livrarea comenzilor</li>
            <li>Gestionarea contului de utilizator</li>
            <li>Comunicari legate de comenzi (confirmare, livrare, facturare)</li>
            <li>Trimiterea de newslettere si oferte promotionale (cu consimtamantul dvs.)</li>
            <li>Imbunatatirea serviciilor si a experientei pe site</li>
            <li>Respectarea obligatiilor legale</li>
          </ul>

          <h2>5. Temeiul juridic</h2>
          <p>Prelucrarea datelor se bazeaza pe urmatoarele temeiuri juridice:</p>
          <ul>
            <li>Executarea contractului de vanzare-cumparare</li>
            <li>Consimtamantul dumneavoastra (pentru marketing si newslettere)</li>
            <li>Interesul nostru legitim (pentru imbunatatirea serviciilor)</li>
            <li>Obligatii legale (fiscal, contabilitate)</li>
          </ul>

          <h2>6. Cookies</h2>
          <p>
            Utilizarea cookie-urilor este detaliata in{' '}
            <Link href="/cookies">Politica de cookies</Link>. Site-ul nostru
            utilizeaza cookie-uri esentiale, analitice si de marketing, cu
            consimtamantul dumneavoastra pentru categoriile non-esentiale.
          </p>

          <h2>7. Partajarea datelor cu terti</h2>
          <p>
            Datele personale pot fi partajate cu urmatoarele categorii de terti,
            doar in masura necesara prestarii serviciilor:
          </p>
          <ul>
            <li>Firme de curierat (pentru livrarea comenzilor)</li>
            <li>Procesatori de plati (pentru tranzactii securizate)</li>
            <li>Furnizori de servicii IT si hosting</li>
            <li>Autoritati publice (atunci cand legislatia impune)</li>
          </ul>

          <h2>8. Durata stocarii</h2>
          <p>
            Datele personale sunt stocate pe perioada necesara indeplinirii scopurilor
            pentru care au fost colectate. Datele legate de comenzi sunt pastrate
            conform obligatiilor fiscale (10 ani). Datele contului sunt pastrate pe
            durata existentei contului si pana la 3 ani dupa inchidere.
          </p>

          <h2>9. Drepturile dumneavoastra</h2>
          <p>
            In conformitate cu GDPR, aveti urmatoarele drepturi cu privire la datele
            dumneavoastra personale. Pentru majoritatea drepturilor va punem la
            dispozitie mecanisme directe:
          </p>
          <ul>
            <li>
              <strong>Dreptul de acces / portabilitate</strong> (art. 15 / 20) —
              autentificati-va si apelati <code>GET /api/account/export</code>.
              Raspunsul este un fisier JSON cu profilul, comenzile, recenziile,
              cosul si evenimentele de audit.
            </li>
            <li>
              <strong>Dreptul la stergere</strong> (art. 17) —{' '}
              <code>DELETE /api/account</code>. Anonimizam imediat datele de
              identificare. Pastram comenzile in forma anonimizata pentru
              conformitate fiscala (art. 25 lit. b Cod fiscal, 10 ani).
            </li>
            <li>
              <strong>Dreptul la rectificare</strong> (art. 16) — modificati datele
              in pagina <Link href="/account">Contul meu</Link>.
            </li>
            <li>
              <strong>Dreptul de opozitie la marketing</strong> (art. 21) —
              dezabonare cu un clic din orice email sau din preferintele contului.
            </li>
            <li>
              <strong>Dreptul de a depune plangere</strong> — la{' '}
              <a href="https://www.dataprotection.ro/" target="_blank" rel="noopener noreferrer">
                ANSPDCP
              </a>
              .
            </li>
          </ul>

          <h2>10. Securitatea datelor</h2>
          <p>
            Implementam masuri tehnice si organizatorice adecvate pentru protectia
            datelor personale, incluzand criptarea datelor, protocoale SSL/TLS,
            acces restrictionat si audituri periodice de securitate.
          </p>

          <h2>11. Contact DPO</h2>
          <p>
            Pentru exercitarea drepturilor sau orice intrebari legate de protectia
            datelor personale, va rugam sa contactati responsabilul nostru cu protectia
            datelor (DPO) la: <strong>dpo@fain-si-punct.ro</strong>.
          </p>
        </div>
      </div>
    </div>
  )
}
