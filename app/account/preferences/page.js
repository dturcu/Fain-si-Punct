'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import EmailPreferences from '@/components/EmailPreferences'

export default function PreferencesPage() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true)
        const response = await axios.get('/api/auth/me')

        if (response.data.success && response.data.data._id) {
          setUserId(response.data.data._id)
        } else {
          setError('Not authenticated')
          router.push('/auth/login')
        }
      } catch (err) {
        console.error('Auth check failed:', err)
        setError('Not authenticated')
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold mb-4">Loading...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <a href="/auth/login" className="text-blue-600 hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Account Settings</h1>

          <div className="bg-white rounded-lg shadow mb-8">
            <div className="border-b px-6 py-4">
              <h2 className="text-xl font-bold">Preferences</h2>
            </div>
            <div className="p-6">
              {userId && <EmailPreferences userId={userId} />}
            </div>
          </div>

          <div className="text-center">
            <a href="/account" className="text-blue-600 hover:underline">
              Back to Account
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
