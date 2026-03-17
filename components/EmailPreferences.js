'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

export default function EmailPreferences({ userId }) {
  const [preferences, setPreferences] = useState({
    orderConfirmation: true,
    shippingUpdates: true,
    promotions: true,
    newsletter: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPreferences()
  }, [userId])

  const fetchPreferences = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/users/${userId}/preferences`)

      if (response.data.success) {
        setPreferences(response.data.data || {})
      }
    } catch (err) {
      console.error('Failed to fetch preferences:', err)
      setError('Failed to load preferences')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (key) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError('')
      setMessage('')

      const response = await axios.put(`/api/users/${userId}/preferences`, preferences)

      if (response.data.success) {
        setMessage('Preferences updated successfully!')
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (err) {
      console.error('Failed to update preferences:', err)
      setError(err.response?.data?.error || 'Failed to update preferences')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="p-4 text-center">Loading preferences...</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Email Preferences</h2>

        {message && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="space-y-4">
            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="orderConfirmation"
                checked={preferences.orderConfirmation || false}
                onChange={() => handleToggle('orderConfirmation')}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="orderConfirmation" className="ml-4 cursor-pointer flex-1">
                <div className="font-semibold text-gray-900">Order Confirmation</div>
                <p className="text-sm text-gray-600 mt-1">
                  Receive confirmation emails when you place an order
                </p>
              </label>
            </div>

            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="shippingUpdates"
                checked={preferences.shippingUpdates || false}
                onChange={() => handleToggle('shippingUpdates')}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="shippingUpdates" className="ml-4 cursor-pointer flex-1">
                <div className="font-semibold text-gray-900">Shipping Updates</div>
                <p className="text-sm text-gray-600 mt-1">
                  Get notified when your order ships and receive tracking information
                </p>
              </label>
            </div>

            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="promotions"
                checked={preferences.promotions || false}
                onChange={() => handleToggle('promotions')}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="promotions" className="ml-4 cursor-pointer flex-1">
                <div className="font-semibold text-gray-900">Promotional Offers</div>
                <p className="text-sm text-gray-600 mt-1">
                  Receive emails about special promotions and exclusive deals
                </p>
              </label>
            </div>

            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="newsletter"
                checked={preferences.newsletter || false}
                onChange={() => handleToggle('newsletter')}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="newsletter" className="ml-4 cursor-pointer flex-1">
                <div className="font-semibold text-gray-900">Newsletter</div>
                <p className="text-sm text-gray-600 mt-1">
                  Subscribe to our newsletter for product updates and tips
                </p>
              </label>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
            <button
              type="button"
              onClick={fetchPreferences}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Reset
            </button>
          </div>
        </form>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded text-sm text-gray-700">
          <p>
            <strong>Note:</strong> Some transactional emails (like order confirmations) are essential for your account
            and cannot be disabled.
          </p>
        </div>
      </div>
    </div>
  )
}
