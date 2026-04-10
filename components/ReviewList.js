'use client'

import React, { useState, useEffect } from 'react'
import StarRating from './StarRating'
import styles from './ReviewList.module.css'

export default function ReviewList({ productId, userId, onReviewDeleted }) {
  const [reviews, setReviews] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 0,
    totalCount: 0,
  })
  const [sortBy, setSortBy] = useState('newest')
  const [minRating, setMinRating] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedReviewId, setExpandedReviewId] = useState(null)
  const [userVotes, setUserVotes] = useState({})

  useEffect(() => {
    fetchReviews(1)
  }, [productId, sortBy, minRating])

  const fetchReviews = async (page) => {
    setLoading(true)
    setError('')

    try {
      const params = new URLSearchParams({
        page,
        limit: pagination.limit,
        sortBy,
        minRating,
      })

      const response = await fetch(`/api/products/${productId}/reviews?${params}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load reviews')
        return
      }

      setReviews(data.data || [])
      setPagination(data.pagination)
    } catch (err) {
      setError(err.message || 'An error occurred while loading reviews')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    fetchReviews(newPage)
  }

  const handleDeleteReview = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      })

      if (!response.ok) {
        alert('Failed to delete review')
        return
      }

      setReviews(reviews.filter((r) => r._id !== reviewId))
      if (onReviewDeleted) {
        onReviewDeleted(reviewId)
      }
    } catch (err) {
      alert('Error deleting review: ' + err.message)
    }
  }

  const handleHelpfulVote = async (reviewId, voteType) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          voteType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert('Failed to record vote')
        return
      }

      // Update vote tracking
      setUserVotes((prev) => {
        const updated = { ...prev }
        if (updated[reviewId] === voteType) {
          delete updated[reviewId]
        } else {
          updated[reviewId] = voteType
        }
        return updated
      })

      // Update helpful count in review
      setReviews(
        reviews.map((r) => {
          if (r._id === reviewId) {
            return { ...r, helpful: data.data.helpful }
          }
          return r
        })
      )
    } catch (err) {
      alert('Error recording vote: ' + err.message)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Customer Reviews</h3>

        <div className={styles.controls}>
          <div className={styles.sortControl}>
            <label htmlFor="sort-select" className={styles.label}>
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.select}
            >
              <option value="newest">Newest</option>
              <option value="helpful">Most Helpful</option>
              <option value="rating-high">Highest Rated</option>
              <option value="rating-low">Lowest Rated</option>
            </select>
          </div>

          <div className={styles.filterControl}>
            <label htmlFor="rating-filter" className={styles.label}>
              Minimum Rating:
            </label>
            <select
              id="rating-filter"
              value={minRating}
              onChange={(e) => setMinRating(parseInt(e.target.value))}
              className={styles.select}
            >
              <option value={0}>All Ratings</option>
              <option value={4}>4+ Stars</option>
              <option value={3}>3+ Stars</option>
              <option value={1}>1+ Stars</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading && <div className={styles.loading}>Loading reviews...</div>}

      {!loading && reviews.length === 0 && <div className={styles.noReviews}>No reviews yet</div>}

      <div className={styles.reviewsList}>
        {reviews.map((review) => (
          <div key={review._id} className={styles.reviewItem}>
            <div className={styles.reviewHeader}>
              <div className={styles.ratingAndAuthor}>
                <StarRating rating={review.rating} interactive={false} size="medium" />
                <div className={styles.authorInfo}>
                  <div className={styles.authorName}>
                    {review.userId?.firstName || 'Anonymous'} {review.userId?.lastName || ''}
                  </div>
                  {review.verified && <span className={styles.verifiedBadge}>✓ Verified Purchase</span>}
                </div>
              </div>
              <div className={styles.reviewDate}>{formatDate(review.createdAt)}</div>
            </div>

            <h4 className={styles.reviewTitle}>{review.title}</h4>

            {review.comment && (
              <p
                className={`${styles.reviewComment} ${
                  expandedReviewId === review._id ? styles.expanded : ''
                }`}
              >
                {review.comment}
              </p>
            )}

            {review.comment && review.comment.length > 300 && expandedReviewId !== review._id && (
              <button
                className={styles.expandButton}
                onClick={() => setExpandedReviewId(review._id)}
              >
                Read More
              </button>
            )}

            {expandedReviewId === review._id && review.comment && review.comment.length > 300 && (
              <button
                className={styles.expandButton}
                onClick={() => setExpandedReviewId(null)}
              >
                Show Less
              </button>
            )}

            <div className={styles.reviewFooter}>
              <div className={styles.helpfulSection}>
                <span className={styles.helpfulLabel}>Was this helpful?</span>
                <button
                  className={`${styles.voteButton} ${userVotes[review._id] === 'helpful' ? styles.voted : ''}`}
                  onClick={() => handleHelpfulVote(review._id, 'helpful')}
                >
                  👍 {review.helpful > 0 ? `${review.helpful}` : 'Yes'}
                </button>
                <button
                  className={`${styles.voteButton} ${userVotes[review._id] === 'unhelpful' ? styles.voted : ''}`}
                  onClick={() => handleHelpfulVote(review._id, 'unhelpful')}
                >
                  👎 No
                </button>
              </div>

              {review.userId?._id === userId && (
                <button
                  className={styles.deleteButton}
                  onClick={() => handleDeleteReview(review._id)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!loading && pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageButton}
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrevPage}
          >
            Anterioara
          </button>

          <div className={styles.pageInfo}>
            Pagina {pagination.page} din {pagination.totalPages}
          </div>

          <button
            className={styles.pageButton}
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNextPage}
          >
            Urmatoarea
          </button>
        </div>
      )}
    </div>
  )
}
