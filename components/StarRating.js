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
    <div className={`${styles.starRating} ${styles[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`${styles.star} ${star <= displayRating ? styles.filled : styles.empty} ${
            interactive ? styles.interactive : ''
          }`}
          onClick={() => handleClick(star)}
          onMouseEnter={() => handleMouseEnter(star)}
          onMouseLeave={handleMouseLeave}
        >
          ★
        </span>
      ))}
      {!interactive && rating > 0 && <span className={styles.ratingText}>{rating.toFixed(1)}</span>}
    </div>
  )
}
