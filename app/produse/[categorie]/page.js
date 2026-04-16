import { redirect } from 'next/navigation'

export default function CategoriePage({ params }) {
  const { categorie } = params
  redirect(`/products?category=${encodeURIComponent(decodeURIComponent(categorie))}`)
}

export function generateMetadata({ params }) {
  const { categorie } = params
  const categoryName = decodeURIComponent(categorie)

  return {
    title: `${categoryName} - Fain si Punct`,
    description: `Descopera produse din categoria ${categoryName} la cele mai bune preturi.`,
    robots: { index: true, follow: true },
  }
}
