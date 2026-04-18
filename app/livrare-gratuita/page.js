import Link from 'next/link'
import { getSiteUrl } from '@/lib/site-url'
import styles from '@/styles/static-page.module.css'

const SITE_URL = getSiteUrl()
const PAGE_URL = `${SITE_URL}/livrare-gratuita`

// TODO: confirm real operational values with business ops before launch.
// Prefer moving these into env vars once values are final.
const FREE_SHIPPING_MIN = process.env.NEXT_PUBLIC_FREE_SHIPPING_MIN || '199' // lei
const FREE_SHIPPING_COURIER =
  process.env.NEXT_PUBLIC_FREE_SHIPPING_COURIER || 'Sameday'
const FREE_SHIPPING_DAYS =
  process.env.NEXT_PUBLIC_FREE_SHIPPING_DAYS || '2-4 zile lucrătoare'

export async function generateMetadata() {
  return {
    title: 'Livrare gratuită în România | Fain si Punct',
    description:
      'Livrare gratuită în toată România pentru comenzi peste pragul minim. Curier rapid, urmărire colet și retur în 30 de zile. Vezi condițiile.',
    alternates: { canonical: PAGE_URL },
    openGraph: {
      title: 'Livrare gratuită în România | Fain si Punct',
      description:
        'Livrare gratuită pentru comenzi peste pragul minim, în toată România. Curier rapid, urmărire colet și retur 30 de zile.',
      url: PAGE_URL,
      type: 'website',
      locale: 'ro_RO',
    },
    robots: { index: true, follow: true },
  }
}

const faqs = [
  {
    question: 'Care este pragul minim pentru livrare gratuită?',
    answer: `Livrarea este gratuită pentru comenzile cu valoare de la ${FREE_SHIPPING_MIN} lei în sus. Pragul se calculează pe valoarea produselor din coș, înainte de eventualele vouchere. Pentru comenzile sub acest prag, costul de livrare este afișat clar la finalizarea comenzii.`,
  },
  {
    question: 'Cu ce curier livrați?',
    answer: `Livrările se fac prin ${FREE_SHIPPING_COURIER}, partenerul nostru de curierat național. Rețeaua acoperă întreaga Românie, inclusiv localitățile mai mici, iar coletele pot fi livrate la adresă sau ridicate din easybox-uri, în funcție de preferința ta la checkout.`,
  },
  {
    question: 'Cât durează livrarea?',
    answer: `Timpul standard de livrare este de ${FREE_SHIPPING_DAYS} de la confirmarea comenzii. Pentru comenzile plasate în weekend sau în sărbători legale, procesarea începe în următoarea zi lucrătoare. Primești pe email notificări la fiecare schimbare de status.`,
  },
  {
    question: 'Livrați în toată România sau doar în anumite județe?',
    answer:
      'Livrăm în toate județele României, inclusiv în localitățile rurale acoperite de curier. Dacă adresa ta este într-o zonă cu timp de livrare diferit, sistemul te va anunța automat la plasarea comenzii. Momentan nu livrăm în afara României.',
  },
  {
    question: 'Cum îmi urmăresc coletul?',
    answer:
      'După ce coletul pleacă din depozit, primești pe email un număr AWB și linkul direct către pagina de tracking a curierului. Poți vedea statusul coletului și în secțiunea „Comenzile mele” din contul tău Fain si Punct, fără să cauți în altă parte.',
  },
  {
    question: 'Pot să returnez un produs dacă am beneficiat de livrare gratuită?',
    answer:
      'Da. Livrarea gratuită nu afectează dreptul de retur. Ai la dispoziție 30 de zile să returnezi produsele, iar procedura este identică cu a oricărei alte comenzi. Detaliile complete sunt în politica de retur.',
  },
]

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Livrare gratuită în România',
  url: PAGE_URL,
  inLanguage: 'ro-RO',
  description:
    'Informații complete despre livrarea gratuită pe Fain si Punct: prag minim, curier, timp de livrare, acoperire, tracking și retur.',
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
      name: 'Livrare gratuită',
      item: PAGE_URL,
    },
  ],
}

export default function LivrareGratuitaPage() {
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
        <span>Livrare gratuită</span>
      </nav>

      <div className={styles.card}>
        <h1 className={styles.title}>Livrare gratuită în toată România</h1>

        <div className={styles.content}>
          <p>
            Pe Fain si Punct primești livrare gratuită în toată România pentru
            comenzile care depășesc pragul minim. Nu ai nevoie de cupon, nu
            aplici coduri: reducerea transportului se calculează automat în
            coș, iar la finalizarea comenzii vezi totalul exact înainte să
            plasezi comanda. Fără surprize, fără costuri ascunse.
          </p>

          <h2>Preț corect: transportul e inclus de la pragul minim</h2>
          <p>
            Când valoarea coșului atinge pragul de {FREE_SHIPPING_MIN} lei,
            transportul devine gratuit automat. Nu plătești în plus pentru
            coletare, ambalare sau procesare. Tot ce vezi în coș este tot ce
            achiți, indiferent dacă alegi plata online sau la livrare.
          </p>

          <h2>Rapid: colet livrat în câteva zile lucrătoare</h2>
          <p>
            Pregătim comenzile în aceeași zi lucrătoare, iar curierul{' '}
            {FREE_SHIPPING_COURIER} preia coletele zilnic. Pentru majoritatea
            adreselor, timpul de livrare este de {FREE_SHIPPING_DAYS}, cu
            urmărire în timp real. Pentru zonele mai îndepărtate, sistemul te
            anunță la plasarea comenzii dacă termenul diferă.
          </p>

          <h2>Acoperire națională: toate județele</h2>
          <p>
            Livrăm în toate cele 41 de județe și în municipiul București,
            inclusiv în localitățile rurale deservite de curier. Poți alege
            livrare la adresă sau ridicare din easybox, dacă ai unul în
            apropiere. Indiferent de opțiune, condițiile pentru livrare
            gratuită rămân aceleași.
          </p>

          <h2>Întrebări frecvente despre livrarea gratuită</h2>
          <div>
            {faqs.map((f, i) => (
              <div key={i}>
                <h3>{f.question}</h3>
                <p>{f.answer}</p>
              </div>
            ))}
          </div>

          <h2>Descoperă produsele</h2>
          <p>
            Adaugă produsele preferate în coș, urmărește pragul pentru livrare
            gratuită și finalizează comanda în câțiva pași.
          </p>
          <p>
            <Link href="/products">Vezi toate produsele disponibile</Link>
          </p>

          <h2>Categorii populare</h2>
          <ul>
            <li>
              <Link href="/produse/Electronics">Electronice și gadgeturi</Link>
            </li>
            <li>
              <Link href="/produse/Clothing">Modă și îmbrăcăminte</Link>
            </li>
            <li>
              <Link href="/produse/Home%20%26%20Garden">Casă și grădină</Link>
            </li>
          </ul>

          <p>
            Dacă preferi să achiți coletul la curier, vezi pagina{' '}
            <Link href="/plata-la-livrare">plată la livrare</Link>. Pentru
            returnări, consultă{' '}
            <Link href="/returns">politica de retur</Link> — ai 30 de zile la
            dispoziție pentru orice produs.
          </p>
        </div>
      </div>
    </div>
  )
}
