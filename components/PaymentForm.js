'use client'

import { useState } from 'react'
import StripeCheckout from './StripeCheckout'
import PayPalCheckout from './PayPalCheckout'

/**
 * PaymentForm - Main payment form component with method selection
 *
 * Props:
 * - orderId: string - The order ID
 * - amount: number - Order total
 * - onSuccess: function - Callback on successful payment
 * - onError: function - Callback on payment error
 */
export default function PaymentForm({
  orderId,
  amount,
  onSuccess,
  onError,
}) {
  const [paymentMethod, setPaymentMethod] = useState('stripe')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method)
    setError('')
  }

  const handlePaymentError = (errorMessage) => {
    setError(errorMessage)
    if (onError) {
      onError(errorMessage)
    }
  }

  const handlePaymentSuccess = (result) => {
    setError('')
    if (onSuccess) {
      onSuccess(result)
    }
  }

  return (
    <div className="payment-form">
      <div className="payment-method-selector">
        <h3>Select Payment Method</h3>
        <div className="method-options">
          <label className="method-option">
            <input
              type="radio"
              name="paymentMethod"
              value="stripe"
              checked={paymentMethod === 'stripe'}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
              disabled={isLoading}
            />
            <span className="method-label">
              <strong>Credit/Debit Card</strong>
              <small>Secure payment with Stripe</small>
            </span>
          </label>

          <label className="method-option">
            <input
              type="radio"
              name="paymentMethod"
              value="paypal"
              checked={paymentMethod === 'paypal'}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
              disabled={isLoading}
            />
            <span className="method-label">
              <strong>PayPal</strong>
              <small>Fast and secure with PayPal</small>
            </span>
          </label>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="payment-content">
        {paymentMethod === 'stripe' && (
          <StripeCheckout
            orderId={orderId}
            amount={amount}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onLoadingChange={setIsLoading}
          />
        )}

        {paymentMethod === 'paypal' && (
          <PayPalCheckout
            orderId={orderId}
            amount={amount}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            onLoadingChange={setIsLoading}
          />
        )}
      </div>

      <style jsx>{`
        .payment-form {
          background: white;
          border-radius: 8px;
          padding: 24px;
          max-width: 500px;
          margin: 0 auto;
        }

        .payment-method-selector h3 {
          margin-bottom: 16px;
          font-size: 18px;
          font-weight: 600;
        }

        .method-options {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .method-option {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .method-option:hover {
          border-color: #d1d5db;
          background-color: #f9fafb;
        }

        .method-option input[type='radio'] {
          margin-top: 4px;
          cursor: pointer;
        }

        .method-option input[type='radio']:checked {
          accent-color: #3b82f6;
        }

        .method-option input[type='radio']:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        .method-label {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .method-label strong {
          font-weight: 600;
          color: #1f2937;
        }

        .method-label small {
          color: #6b7280;
          font-size: 12px;
        }

        .error-message {
          background-color: #fee2e2;
          border: 1px solid #fecaca;
          color: #991b1b;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .payment-content {
          margin-top: 24px;
        }
      `}</style>
    </div>
  )
}
