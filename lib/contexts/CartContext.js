'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0)
  const [cartTotal, setCartTotal] = useState(0)

  const refreshCart = useCallback(async () => {
    try {
      const res = await fetch('/api/cart')
      if (!res.ok) return
      const data = await res.json()
      if (data.success && data.data) {
        const items = data.data.items || []
        setCartCount(items.reduce((sum, i) => sum + i.quantity, 0))
        setCartTotal(data.data.total || 0)
      }
    } catch {}
  }, [])

  useEffect(() => {
    refreshCart()
  }, [refreshCart])

  return (
    <CartContext.Provider value={{ cartCount, cartTotal, refreshCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
