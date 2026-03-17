'use client'

import React from 'react'
import StarRating from './StarRating'
import styles from './ReviewStats.module.css'

export default function ReviewStats({ avgRating = 0, reviewCount = 0, ratingDistribution = {} }) {
  const getPercentage = (count) => {
    if (reviewCount === 0) return 0
    return Math.round((count / reviewCount) * 100)
  }

  return (
    <div className={styles.container}>
      <div className={styles.summary}>
        <div className={styles.averageRating}>
          <div className={styles.largeRating}>{avgRating.toFixed(1)}</div>
          <StarRating rating={avgRating} interactive={false} size="medium" />
          <div className={styles.reviewCount}>{reviewCount} reviews</div>
        </div>

        <div className={styles.distribution}>
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className={styles.distributionRow}>
              <span className={styles.ratingLabel}>
                {rating}
                <span className={styles.star}>★</span>
              </span>
              <div className={styles.barContainer}>
                <div
                  className={styles.bar}
                  style={{
                    width: `${getPercentage(ratingDistribution[rating] || 0)}%`,
                  }}
                />
              </div>
              <span className={styles.percentage}>{getPercentage(ratingDistribution[rating] || 0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
