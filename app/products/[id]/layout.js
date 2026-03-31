import { supabaseAdmin } from '@/lib/supabase'

export async function generateMetadata({ params }) {
  const { id } = await params

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('name, description, image, price, category')
    .eq('id', id)
    .single()

  if (!product) {
    return {
      title: 'Produs negăsit | ShopHub',
    }
  }

  const description = product.description
    ? product.description.slice(0, 155)
    : `Cumpără ${product.name} la cel mai bun preț pe ShopHub.`

  return {
    title: `${product.name} | ShopHub`,
    description,
    openGraph: {
      title: product.name,
      description,
      images: product.image ? [{ url: product.image }] : [],
      type: 'website',
    },
  }
}

export default function ProductLayout({ children }) {
  return children
}
