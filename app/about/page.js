import styles from '@/styles/pages.module.css'

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <h1>Despre Fain si Punct</h1>

      <section className={styles.section}>
        <h2>Cine suntem</h2>
        <p>
          Fain si Punct SRL este un magazin online romanesc cu sediul in Iasi,
          dedicat oferirii celor mai bune preturi pentru o gama diversificata de
          produse. Cu aproximativ 14.000 de produse in catalog, acoperim nevoile
          clientilor nostri din intreaga tara.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Misiunea noastra</h2>
        <p>
          Promisiunea noastra este simpla: cel mai bun pret. Importam produse
          en-gros si le oferim clientilor nostri la preturi competitive, fara
          compromisuri la calitate. Fiecare produs trece printr-un proces de
          selectie atent inainte de a ajunge in catalogul nostru.
        </p>
      </section>

      <section className={styles.section}>
        <h2>De ce Fain si Punct?</h2>
        <ul>
          <li>Peste 14.000 de produse disponibile</li>
          <li>Preturi competitive - importuri en-gros revandute la cele mai bune preturi</li>
          <li>Livrare in toata Romania prin curierat rapid</li>
          <li>Plata securizata - card bancar sau ramburs la livrare</li>
          <li>Drept de retur conform legislatiei in vigoare</li>
          <li>Suport dedicat prin email</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Valorile noastre</h2>
        <p>
          Construim relatii de incredere cu clientii nostri prin transparenta,
          preturi corecte si servicii de calitate. Suntem o echipa mica dar
          dedicata, cu focus pe satisfactia fiecarui client. Fiecare comanda
          conteaza pentru noi.
        </p>
      </section>
    </div>
  )
}
