'use client'

import React, { useState } from 'react'
import styles from './StarRating.module.css'

export default function StarRating({ rating = 0, onRatingChange, interactive = true, size = 'medium' }) {
  const [hoverRating, setHoverRating] = useState(0)

  const displayRating = hoverRating || rating

  const handleClick = (value) => {
    if (interactive && onRatingChange) {
      onRatingChange(value)
    }
  }

  const handleMouseEnter = (value) => {
    if (interactive) {
      setHoverRating(value)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0)
    }
  }

  return (
    <div
      className={`${styles.starRating} ${styles[size]}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? 'Selectează rating' : `Rating: ${rating.toFixed(1)} din 5 stele`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        interactive ? (
          <button
            key={star}
            type="button"
            className={`${styles.star} ${star <= displayRating ? styles.filled : styles.empty} ${styles.interactive}`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            onMouseLeave={handleMouseLeave}
            aria-label={`${star} ${star === 1 ? 'stea' : 'stele'}`}
            aria-checked={star === rating}
            role="radio"
          >
            ★
          </button>
        ) : (
          <span
            key={star}
            className={`${styles.star} ${star <= displayRating ? styles.filled : styles.empty}`}
            aria-hidden="true"
          >
            ★
          </span>
        )
      ))}
      {!interactive && rating > 0 && <span className={styles.ratingText} aria-hidden="true">{rating.toFixed(1)}</span>}
    </div>
  )
}
