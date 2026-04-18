import Link from 'next/link'
import { getSiteUrl } from '@/lib/site-url'
import styles from '@/styles/static-page.module.css'

const SITE_URL = getSiteUrl()
const PAGE_URL = `${SITE_URL}/plata-la-livrare`

// TODO: confirm real operational values with business ops before launch.
// Prefer moving these into env vars once values are final.
const COD_MAX_ORDER = process.env.NEXT_PUBLIC_COD_MAX_ORDER || '5000' // lei
const COD_FEE_INFO = process.env.NEXT_PUBLIC_COD_FEE_INFO || 'fără taxă suplimentară'
const DELIVERY_DAYS = process.env.NEXT_PUBLIC_DELIVERY_DAYS || '2-4 zile lucrătoare'

export async function generateMetadata() {
  return {
    title: 'Comandă online cu plată la livrare (ramburs) | Fain si Punct',
    description:
      'Comandă online cu plată la livrare în toată România. Achiți coletul cash sau cu cardul la curier, după ce verifici produsul. Fără card, fără risc.',
    alternates: { canonical: PAGE_URL },
    openGraph: {
      title: 'Comandă online cu plată la livrare | Fain si Punct',
      description:
        'Plătești ramburs la primirea coletului. Verifici produsul, apoi achiți curierului. Livrăm în toată România.',
      url: PAGE_URL,
      type: 'website',
      locale: 'ro_RO',
    },
    robots: { index: true, follow: true },
  }
}

const faqs = [
  {
    question: 'Cum funcționează comanda cu plată la livrare?',
    answer:
      'Adaugi produsele în coș, mergi la finalizare comandă și alegi metoda „Plată la livrare (ramburs)”. Primești confirmarea pe email, pregătim coletul și îl trimitem prin curier. Achiți suma curierului la predarea coletului, după ce verifici conținutul.',
  },
  {
    question: 'Există o taxă suplimentară pentru plata ramburs?',
    answer: `Pentru comenzile cu plată la livrare aplicăm ${COD_FEE_INFO}. Costul total este afișat clar la finalizarea comenzii, înainte de plasarea acesteia. Nu există costuri ascunse.`,
  },
  {
    question: 'În ce zone din România livrați cu ramburs?',
    answer:
      'Livrăm cu plată la livrare în toată România, prin rețeaua de curierat Sameday. Sunt acoperite toate județele, inclusiv localitățile rurale deservite de curier. Adresa exactă se verifică automat la finalizarea comenzii.',
  },
  {
    question: 'Pot să refuz coletul dacă produsul nu corespunde?',
    answer:
      'Da. La livrare ai dreptul să verifici coletul și să-l refuzi dacă produsul este vizibil deteriorat sau diferit de cel comandat. În plus, chiar și după ce accepți coletul, ai 30 de zile pentru retur conform politicii noastre.',
  },
  {
    question: 'Primesc factură sau bon fiscal pentru comanda cu ramburs?',
    answer:
      'Da. Pentru fiecare comandă emitem factură fiscală electronică, trimisă pe emailul asociat contului. Factura este disponibilă și în secțiunea „Comenzile mele” din cont. La cerere, introducem în colet și un exemplar tipărit.',
  },
  {
    question: 'Există o valoare maximă pentru comenzile cu plată la livrare?',
    answer: `Plafonul maxim pentru o comandă cu ramburs este de ${COD_MAX_ORDER} lei. Pentru comenzi peste acest prag recomandăm plata online cu cardul, care este la fel de sigură și îți permite să urmărești coletul fără a mai achita la curier.`,
  },
]

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Comandă online cu plată la livrare (ramburs)',
  url: PAGE_URL,
  inLanguage: 'ro-RO',
  description:
    'Ghid complet despre comenzile online cu plată la livrare pe Fain si Punct: cum funcționează, taxe, zone acoperite, retur și facturare.',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Fain si Punct',
    url: SITE_URL,
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: f.answer,
    },
  })),
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Acasă', item: SITE_URL },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Plată la livrare',
      item: PAGE_URL,
    },
  ],
}

export default function PlataLaLivrarePage() {
  return (
    <div className={styles.container}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Acasă</Link>
        <span className={styles.separator}>/</span>
        <span>Plată la livrare</span>
      </nav>

      <div className={styles.card}>
        <h1 className={styles.title}>
          Comandă online cu plată la livrare în toată România
        </h1>

        <div className={styles.content}>
          <p>
            Pe Fain si Punct poți comanda online și achita coletul abia la
            primire, direct curierului. Plata la livrare (ramburs) este opțiunea
            preferată de cumpărătorii din România care vor să vadă produsul
            înainte de a scoate banii din buzunar. Nu ai nevoie de card bancar,
            nu completezi date sensibile pe site și plătești doar după ce
            verifici coletul.
          </p>

          <h2>Siguranță: plătești după ce vezi produsul</h2>
          <p>
            Cu plata ramburs, banii ajung la noi doar după ce coletul ajunge
            la tine. Ai timp să verifici ambalajul și conținutul la livrare și,
            dacă ceva nu corespunde, poți refuza coletul fără costuri. Este
            forma cea mai simplă de cumpărare online pentru cineva care nu a
            mai comandat de la noi și vrea să fie liniștit înainte să achite.
          </p>

          <h2>Simplitate: fără card, fără cont bancar</h2>
          <p>
            Finalizezi comanda în câțiva pași, alegi „Plată la livrare” și
            gata. Nu introduci date de card, nu aștepți aprobări bancare și nu
            depinzi de aplicații externe. Funcționează la fel pentru toată
            lumea: studenți fără card, persoane în vârstă, oricine preferă
            cash sau plata cu cardul direct la curier.
          </p>

          <h2>Acoperire: curier Sameday în toată țara</h2>
          <p>
            Coletele pleacă prin Sameday, un curier național cu rețea densă
            în toate județele, inclusiv în localitățile mai mici. Primești
            număr de AWB pe email imediat ce coletul intră în tranzit, ca să
            poți urmări livrarea pas cu pas. Livrările standard ajung, de
            obicei, în {DELIVERY_DAYS} de la confirmarea comenzii.
          </p>

          <h2>Întrebări frecvente despre plata la livrare</h2>
          <div>
            {faqs.map((f, i) => (
              <div key={i}>
                <h3>{f.question}</h3>
                <p>{f.answer}</p>
              </div>
            ))}
          </div>

          <h2>Gata să comanzi?</h2>
          <p>
            Intră în catalog, alege produsele și bifează la checkout „Plată la
            livrare”. Coletul ajunge la ușa ta, îl verifici și abia apoi
            achiți.
          </p>
          <p>
            <Link href="/products">Vezi toate produsele disponibile</Link>
          </p>

          <h2>Categorii populare cu plată ramburs</h2>
          <ul>
            <li>
              <Link href="/produse/Electronics">Electronice și gadgeturi</Link>
            </li>
            <li>
              <Link href="/produse/Home%20%26%20Garden">
                Produse pentru casă și grădină
              </Link>
            </li>
            <li>
              <Link href="/produse/Sports">Sport și timp liber</Link>
            </li>
          </ul>

          <p>
            Ai o întrebare care nu se regăsește mai sus? Scrie-ne prin{' '}
            <Link href="/contact">pagina de contact</Link> sau consultă{' '}
            <Link href="/returns">politica de retur</Link> pentru detalii
            despre returnarea produselor.
          </p>
        </div>
      </div>
    </div>
  )
}
