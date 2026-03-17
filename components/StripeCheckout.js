'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

let stripePromise

/**
 * Initialize Stripe promise (lazy load)
 */
function getStripePromise() {
  if (!stripePromise) {
    const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY
    if (!publicKey) {
      console.error('NEXT_PUBLIC_STRIPE_PUBLIC_KEY is not set')
      return null
    }
    stripePromise = loadStripe(publicKey)
  }
  return stripePromise
}

/**
 * StripeCheckout - Main Stripe payment component
 */
export default function StripeCheckout({
  orderId,
  amount,
  onSuccess,
  onError,
  onLoadingChange,
}) {
  const [clientSecret, setClientSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    // Create payment intent
    createPaymentIntent()
  }, [orderId, amount])

  const createPaymentIntent = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          orderId,
          method: 'stripe',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create payment intent')
      }

      const data = await response.json()
      setClientSecret(data.clientSecret)
    } catch (err) {
      const errorMsg = err.message || 'Failed to initialize payment'
      setError(errorMsg)
      onError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const stripePromise = getStripePromise()

  if (!stripePromise) {
    return (
      <div className="error-message">
        Stripe is not configured. Please contact support.
      </div>
    )
  }

  if (loading) {
    return <div className="loading">Initializing payment...</div>
  }

  if (!clientSecret) {
    return (
      <div className="error-message">
        {error || 'Failed to initialize payment'}
      </div>
    )
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripePaymentForm
        clientSecret={clientSecret}
        orderId={orderId}
        onSuccess={onSuccess}
        onError={onError}
        onLoadingChange={onLoadingChange}
      />
    </Elements>
  )
}

/**
 * StripePaymentForm - Stripe Elements form
 */
function StripePaymentForm({
  clientSecret,
  orderId,
  onSuccess,
  onError,
  onLoadingChange,
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    onLoadingChange(true)

    try {
      // Confirm payment with Stripe
      const { error: submitError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/orders/${orderId}`,
        },
      })

      if (submitError) {
        setError(submitError.message)
        onError(submitError.message)
      } else {
        // Confirm payment on our backend
        const response = await fetch('/api/payments/confirm', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify({
            orderId,
            paymentMethod: 'stripe',
            paymentIntentId: clientSecret.split('_secret_')[0],
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to confirm payment')
        }

        const data = await response.json()
        if (data.success) {
          onSuccess(data)
        } else {
          onError(data.error || 'Payment confirmation failed')
        }
      }
    } catch (err) {
      const errorMsg = err.message || 'Payment failed'
      setError(errorMsg)
      onError(errorMsg)
    } finally {
      setProcessing(false)
      onLoadingChange(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="stripe-payment-form">
      <PaymentElement />

      {error && <div className="error-message">{error}</div>}

      <button
        type="submit"
        disabled={!stripe || !elements || processing}
        className="pay-button"
      >
        {processing ? 'Processing...' : `Pay $${(amount / 100).toFixed(2)}`}
      </button>

      <style jsx>{`
        .stripe-payment-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .error-message {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 12px;
          border-radius: 6px;
          font-size: 14px;
        }

        .pay-button {
          background-color: #3b82f6;
          color: white;
          padding: 12px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .pay-button:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .pay-button:disabled {
          background-color: #d1d5db;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  )
}

/**
 * Get authentication token from storage
 */
function getAuthToken() {
  if (typeof window === 'undefined') return ''

  // Try localStorage first
  const token = localStorage.getItem('token')
  if (token) return token

  // Try from cookie
  const cookies = document.cookie.split('; ')
  const tokenCookie = cookies.find((c) => c.startsWith('token='))
  return tokenCookie ? tokenCookie.split('=')[1] : ''
}
