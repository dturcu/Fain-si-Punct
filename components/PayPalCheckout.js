'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * PayPalCheckout - PayPal payment component
 *
 * Props:
 * - orderId: string
 * - amount: number (in cents)
 * - onSuccess: function
 * - onError: function
 * - onLoadingChange: function
 */
export default function PayPalCheckout({
  orderId,
  amount,
  onSuccess,
  onError,
  onLoadingChange,
}) {
  const paypalContainerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paypalOrderId, setPaypalOrderId] = useState('')

  useEffect(() => {
    initializePayPal()
  }, [orderId, amount])

  const initializePayPal = async () => {
    try {
      setLoading(true)
      setError('')

      // Load PayPal script
      if (!window.paypal) {
        await loadPayPalScript()
      }

      // Create PayPal order
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          method: 'paypal',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create PayPal order')
      }

      const data = await response.json()
      setPaypalOrderId(data.paypalOrderId)

      // Render PayPal buttons
      if (window.paypal && paypalContainerRef.current) {
        renderPayPalButtons(data.paypalOrderId)
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to initialize PayPal'
      setError(errorMsg)
      onError(errorMsg)
    } finally {
      setLoading(false)
      onLoadingChange(false)
    }
  }

  const loadPayPalScript = () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID

      if (!clientId) {
        reject(new Error('PayPal Client ID not configured'))
        return
      }

      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=RON`
      script.async = true

      script.onload = () => {
        resolve()
      }

      script.onerror = () => {
        reject(new Error('Failed to load PayPal SDK'))
      }

      document.head.appendChild(script)
    })
  }

  const renderPayPalButtons = async (paypalOrderId) => {
    if (!window.paypal || !paypalContainerRef.current) {
      return
    }

    try {
      await window.paypal.Buttons({
        async createOrder(data, actions) {
          return paypalOrderId
        },

        async onApprove(data, actions) {
          onLoadingChange(true)

          try {
            // Capture the payment on the server
            const response = await fetch('/api/payments/confirm', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId,
                paymentMethod: 'paypal',
                paypalOrderId: data.orderID,
              }),
            })

            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.error || 'Failed to confirm payment')
            }

            const result = await response.json()
            if (result.success) {
              onSuccess(result)
            } else {
              onError(result.error || 'Payment confirmation failed')
            }
          } catch (err) {
            const errorMsg = err.message || 'Payment confirmation failed'
            onError(errorMsg)
            setError(errorMsg)
          } finally {
            onLoadingChange(false)
          }
        },

        onError(err) {
          const errorMsg = err.message || 'PayPal payment error'
          setError(errorMsg)
          onError(errorMsg)
        },

        onCancel() {
          const cancelMsg = 'Payment was cancelled'
          setError(cancelMsg)
          onError(cancelMsg)
        },

        style: {
          layout: 'vertical',
          color: 'blue',
          shape: 'rect',
          label: 'pay',
        },
      }).render(paypalContainerRef.current)
    } catch (err) {
      const errorMsg = err.message || 'Failed to render PayPal buttons'
      setError(errorMsg)
      onError(errorMsg)
    }
  }

  if (loading) {
    return <div className="loading">Initializing PayPal...</div>
  }

  if (error && !paypalOrderId) {
    return <div className="error-message">{error}</div>
  }

  return (
    <div className="paypal-checkout">
      {error && <div className="error-message">{error}</div>}
      <div
        ref={paypalContainerRef}
        className="paypal-buttons-container"
      />

      <style jsx>{`
        .paypal-checkout {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .paypal-buttons-container {
          min-height: 60px;
        }

        .error-message {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
        }

        .loading {
          text-align: center;
          color: #6b7280;
          padding: 24px;
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}

