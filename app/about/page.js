import styles from '@/styles/pages.module.css'

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <h1>About ShopHub</h1>

      <section className={styles.section}>
        <h2>Who We Are</h2>
        <p>
          ShopHub is a leading ecommerce platform dedicated to bringing you the
          best selection of quality products at competitive prices. Since our
          founding, we've been committed to providing an exceptional shopping
          experience.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Our Mission</h2>
        <p>
          Our mission is to make online shopping easy, enjoyable, and accessible
          to everyone. We believe in connecting customers with products they love,
          with exceptional customer service every step of the way.
        </p>
      </section>

      <section className={styles.section}>
        <h2>Why Choose Us?</h2>
        <ul>
          <li>Largest selection of 15,000+ products</li>
          <li>Competitive pricing and regular discounts</li>
          <li>Fast and free shipping on orders</li>
          <li>Secure payment processing</li>
          <li>Responsive customer support</li>
          <li>Easy returns and exchanges</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>Our Values</h2>
        <p>
          We are committed to quality, integrity, and customer satisfaction. Our
          team works tirelessly to ensure that every customer has the best
          experience possible.
        </p>
      </section>
    </div>
  )
}
