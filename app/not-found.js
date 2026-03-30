import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      <h1 style={{ fontSize: '5rem', fontWeight: 'bold', color: '#e5e7eb', margin: 0 }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Pagina nu a fost găsită</h2>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Pagina pe care o cauți nu există sau a fost mutată.
      </p>
      <Link
        href="/"
        style={{
          padding: '0.75rem 1.5rem',
          background: '#2563eb',
          color: '#fff',
          borderRadius: '0.5rem',
          textDecoration: 'none',
          fontSize: '1rem',
        }}
      >
        Înapoi acasă
      </Link>
    </div>
  )
}
