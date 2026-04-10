'use client'

import React, { useState } from 'react'
import StarRating from './StarRating'
import styles from './ReviewForm.module.css'

export default function ReviewForm({ productId, userId, onReviewSubmitted }) {
  const [rating, setRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validate form
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    if (title.trim().length === 0) {
      setError('Please enter a review title')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to submit review')
        return
      }

      setSuccess('Review submitted successfully!')
      setRating(0)
      setTitle('')
      setComment('')

      if (onReviewSubmitted) {
        onReviewSubmitted(data.data)
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.message || 'An error occurred while submitting your review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Write a Review</h3>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Rating</label>
          <StarRating rating={rating} onRatingChange={setRating} interactive={true} size="large" />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Review Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summarize your experience"
            maxLength="200"
            className={styles.input}
            disabled={loading}
          />
          <span className={styles.charCount}>{title.length}/200</span>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="comment" className={styles.label}>
            Review Comment
          </label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share more details about your experience (optional)"
            maxLength="5000"
            rows="6"
            className={styles.textarea}
            disabled={loading}
          />
          <span className={styles.charCount}>{comment.length}/5000</span>
        </div>

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  )
}
