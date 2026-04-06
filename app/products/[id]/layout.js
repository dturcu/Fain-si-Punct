import { supabaseAdmin } from '@/lib/supabase'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://awesome-wilbur.vercel.app'

export async function generateMetadata({ params }) {
  const { id } = await params

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('name, description, image, images, price, category, brand, stock, avg_rating, review_count, sku')
    .eq('id', id)
    .single()

  if (!product) {
    return { title: 'Produs negasit' }
  }

  const description = product.description
    ? product.description.slice(0, 155)
    : `Cumpara ${product.name} la cel mai bun pret pe ShopHub.`

  const image = product.images?.[0] || product.image
  const images = image ? [{ url: image, width: 800, height: 800, alt: product.name }] : []

  return {
    title: product.name,
    description,
    alternates: {
      canonical: `/products/${id}`,
    },
    openGraph: {
      title: product.name,
      description,
      url: `/products/${id}`,
      images,
      type: 'website',
      locale: 'ro_RO',
      siteName: 'ShopHub',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: image ? [image] : [],
    },
  }
}

export default function ProductLayout({ children }) {
  return children
}
