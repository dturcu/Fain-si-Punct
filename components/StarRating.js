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

  if (!interactive) {
    return (
      <div
        className={`${styles.starRating} ${styles[size]}`}
        role="img"
        aria-label={`${rating.toFixed(1)} din 5 stele`}
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`${styles.star} ${star <= displayRating ? styles.filled : styles.empty}`}
            aria-hidden="true"
          >
            ★
          </span>
        ))}
        {rating > 0 && <span className={styles.ratingText}>{rating.toFixed(1)}</span>}
      </div>
    )
  }

  return (
    <div
      className={`${styles.starRating} ${styles[size]}`}
      role="radiogroup"
      aria-label="Alege numarul de stele"
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={rating === star}
          aria-label={`${star} ${star === 1 ? 'stea' : 'stele'}`}
          className={`${styles.star} ${star <= displayRating ? styles.filled : styles.empty} ${styles.interactive}`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onFocus={() => handleMouseEnter(star)}
          onBlur={handleMouseLeave}
        >
          <span aria-hidden="true">★</span>
        </button>
      ))}
    </div>
  )
}
