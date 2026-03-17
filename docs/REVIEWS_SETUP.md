# Reviews & Ratings System Documentation

## Overview

The Reviews & Ratings system enables customers to submit reviews and ratings for products they have purchased. The system includes:

- **Star-based ratings** (1-5 stars)
- **Verified purchase badges** to ensure authenticity
- **Review aggregation** with rating distribution analysis
- **Helpful vote tracking** to highlight useful reviews
- **Moderation controls** for review management
- **Purchase verification** to prevent unverified reviews

## Database Schema

### Review Model

Located at `/models/Review.js`

```javascript
{
  productId: ObjectId,          // Reference to Product
  userId: ObjectId,             // Reference to User (reviewer)
  orderId: ObjectId,            // Reference to Order (proof of purchase)
  rating: Number (1-5),         // Star rating
  title: String,                // Review title (required, max 200 chars)
  comment: String,              // Review body (optional, max 5000 chars)
  verified: Boolean,            // Purchased product flag
  helpful: Number,              // Count of helpful votes
  helpfulVotes: Array,          // Tracking individual votes
  createdAt: Date,              // Created timestamp
  updatedAt: Date               // Updated timestamp
}
```

**Indexes:**
- Unique compound index: `(productId, userId)` - One review per user per product
- Standard indexes: `productId`, `rating`, `createdAt`, `helpful`

### Product Model Updates

The Product model now includes aggregated review statistics:

```javascript
{
  avgRating: Number,            // Average rating (0-5)
  reviewCount: Number,          // Total review count
  ratingDistribution: {         // Histogram of ratings
    5: Number,
    4: Number,
    3: Number,
    2: Number,
    1: Number
  }
}
```

### Order Model Updates

The Order model now tracks the user who placed the order:

```javascript
{
  userId: ObjectId,             // Reference to User
  ...
}
```

## API Endpoints

### 1. List Product Reviews

**GET** `/api/products/[id]/reviews`

Query Parameters:
- `page` (default: 1) - Page number for pagination
- `limit` (default: 10) - Reviews per page
- `sortBy` (default: 'newest') - Sort option: `newest`, `helpful`, `rating-high`, `rating-low`
- `minRating` (default: 0) - Minimum rating filter (1-5)
- `maxRating` (default: 5) - Maximum rating filter (1-5)
- `verified` (default: false) - Only verified purchases when true

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "rating": 5,
      "title": "Great product!",
      "comment": "...",
      "userId": { "firstName": "John", "lastName": "Doe" },
      "verified": true,
      "helpful": 12,
      "createdAt": "2026-03-17T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalCount": 45,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### 2. Create Review

**POST** `/api/products/[id]/reviews`

**Request Headers:**
- `Authorization: Bearer [token]`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "userId": "...",
  "rating": 4,
  "title": "Good product",
  "comment": "Works as described..."
}
```

**Validation:**
- Rating must be 1-5
- Title is required (max 200 chars)
- Comment is optional (max 5000 chars)
- User must have purchased the product
- User can only review each product once

**Response:** (201 Created)
```json
{
  "success": true,
  "data": { ... },
  "message": "Review created successfully"
}
```

### 3. Get Single Review

**GET** `/api/reviews/[id]`

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

### 4. Update Review

**PUT** `/api/reviews/[id]`

**Request Body:**
```json
{
  "userId": "...",
  "rating": 5,
  "title": "Updated title",
  "comment": "Updated comment..."
}
```

**Authorization:** Review owner only

**Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Review updated successfully"
}
```

### 5. Delete Review

**DELETE** `/api/reviews/[id]`

**Request Body:**
```json
{
  "userId": "...",
  "isAdmin": false
}
```

**Authorization:** Review owner or admin

**Response:**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

### 6. Toggle Helpful Vote

**PATCH** `/api/reviews/[id]/helpful`

**Request Body:**
```json
{
  "userId": "...",
  "voteType": "helpful"
}
```

**Notes:**
- First vote records the vote
- Same vote type toggles it off
- Switching vote types updates the vote

**Response:**
```json
{
  "success": true,
  "data": {
    "reviewId": "...",
    "helpful": 15,
    "voteCount": 20
  },
  "message": "Vote recorded successfully"
}
```

### 7. Get Helpful Votes

**GET** `/api/reviews/[id]/helpful`

**Response:**
```json
{
  "success": true,
  "data": {
    "reviewId": "...",
    "helpful": 15,
    "unhelpful": 5,
    "total": 20
  }
}
```

## Library Functions

### review-stats.js

#### calculateProductRating(productId)
Calculates aggregated rating statistics for a product.

**Returns:**
```javascript
{
  avgRating: 4.5,
  reviewCount: 42,
  ratingDistribution: { 5: 20, 4: 15, 3: 5, 2: 1, 1: 1 }
}
```

#### updateProductRatingStats(productId)
Updates the Product document with aggregated review statistics.

**Called automatically after:**
- Review creation
- Review update
- Review deletion

#### getProductReviews(productId, options)
Fetches reviews with pagination, sorting, and filtering.

**Options:**
```javascript
{
  page: 1,
  limit: 10,
  sortBy: 'newest',
  minRating: 0,
  maxRating: 5,
  verifiedOnly: false
}
```

#### userHasReviewed(productId, userId)
Checks if a user has already reviewed a product.

**Returns:** boolean

#### toggleHelpfulVote(reviewId, userId, voteType)
Records or removes a helpful/unhelpful vote on a review.

**Parameters:**
- `voteType`: 'helpful' or 'unhelpful'

### purchase-verification.js

#### verifyUserPurchase(userId, productId)
Verifies if a user has purchased a specific product.

**Returns:** Order object or null

**Status Check:** Only considers orders with status: `processing`, `shipped`, or `delivered`

#### getPurchasedProducts(userId)
Gets all product IDs purchased by a user.

**Returns:** Array of product ObjectIds

#### getUserOrders(userId, options)
Gets all orders for a user with pagination.

**Options:**
```javascript
{
  limit: 10,
  skip: 0,
  status: 'delivered' // optional filter
}
```

## React Components

### StarRating
Interactive star rating component for review submission and display.

**Props:**
- `rating` (number) - Current rating (0-5)
- `onRatingChange` (function) - Callback when rating changes
- `interactive` (boolean) - Allow user interaction
- `size` (string) - 'small', 'medium', 'large'

**Example:**
```jsx
<StarRating
  rating={3}
  onRatingChange={setRating}
  interactive={true}
  size="large"
/>
```

### ReviewForm
Form component for submitting new reviews.

**Props:**
- `productId` (string) - Product to review
- `userId` (string) - Reviewing user ID
- `onReviewSubmitted` (function) - Callback after successful submission

**Features:**
- Star rating picker
- Title input (max 200 chars)
- Comment textarea (max 5000 chars)
- Form validation
- Character counters
- Loading state
- Error/success messages

### ReviewStats
Displays aggregated review statistics with rating distribution.

**Props:**
- `avgRating` (number) - Average rating
- `reviewCount` (number) - Total reviews
- `ratingDistribution` (object) - Histogram

**Display:**
- Large average rating
- Star rating display
- Review count
- Stacked bar chart showing rating distribution

### ReviewList
Displays paginated list of reviews with filtering and sorting.

**Props:**
- `productId` (string) - Product ID
- `userId` (string) - Current user ID
- `onReviewDeleted` (function) - Callback after deletion

**Features:**
- Pagination controls
- Sort options (newest, helpful, rating)
- Rating filter (4+, 3+, 1+ stars, all)
- Helpful vote buttons
- Delete button (owner only)
- Expandable long comments
- Verified purchase badge
- Author name and date

## Implementation Checklist

### Database
- [x] Review model created with proper indexes
- [x] Product model updated with aggregated fields
- [x] Order model updated with userId tracking

### API Routes
- [x] GET /api/products/[id]/reviews - List reviews
- [x] POST /api/products/[id]/reviews - Create review
- [x] GET /api/reviews/[id] - Get single review
- [x] PUT /api/reviews/[id] - Update review
- [x] DELETE /api/reviews/[id] - Delete review
- [x] PATCH /api/reviews/[id]/helpful - Toggle helpful vote
- [x] GET /api/reviews/[id]/helpful - Get vote stats

### Library Functions
- [x] review-stats.js - Aggregation and calculations
- [x] purchase-verification.js - Purchase verification

### Components
- [x] StarRating.js - Interactive star rating
- [x] ReviewForm.js - Review submission form
- [x] ReviewStats.js - Rating distribution display
- [x] ReviewList.js - Paginated review list

## Security Features

1. **Purchase Verification**
   - Only users who purchased the product can review
   - Verified status set automatically

2. **Ownership Protection**
   - Only review owner can update their review
   - Only owner or admin can delete

3. **One Review Per Product**
   - Unique compound index prevents duplicates
   - Enforced at API level

4. **Vote Prevention**
   - Tracks individual voters
   - Prevents duplicate votes from same user

## Performance Considerations

1. **Review Aggregation**
   - Calculated asynchronously after review changes
   - Results cached in Product document
   - No blocking of review creation

2. **Pagination**
   - Default limit of 10 reviews per page
   - Configurable for performance tuning

3. **Indexing**
   - Multiple indexes on frequently queried fields
   - Compound index prevents duplicate reviews
   - Enables efficient sorting and filtering

4. **Lazy Loading**
   - Product rating stats fetched on demand
   - Comment truncation in list view

## Testing Checklist

- [ ] Create review as verified customer
- [ ] Prevent duplicate reviews (same user, product)
- [ ] Verify purchase before showing form
- [ ] Test rating aggregation accuracy
- [ ] Test helpful vote counting
- [ ] Test review pagination and sorting
- [ ] Test purchase verification
- [ ] Test review deletion by owner
- [ ] Test review deletion by admin
- [ ] Test review update by owner
- [ ] Test edit button hidden for non-owners
- [ ] Test comment truncation and expansion
- [ ] Test character count validation
- [ ] Test form validation (rating required, title required)
- [ ] Test error handling for API failures
- [ ] Test helpful/unhelpful vote toggling
- [ ] Test vote removal by re-clicking

## Error Handling

### Common Errors

| Status | Error | Solution |
|--------|-------|----------|
| 400 | Rating must be between 1 and 5 | Validate rating input |
| 400 | Title is required | Provide title before submit |
| 400 | You have already reviewed this product | Prevent duplicate reviews in UI |
| 401 | Authentication required | User must be logged in |
| 403 | You must purchase this product to review it | Show review form only for verified buyers |
| 403 | Unauthorized: only review owner can update | Check ownership before allowing edit |
| 404 | Product not found | Verify product ID |
| 404 | Review not found | Refresh page after deletion |
| 500 | Database errors | Check database connection |

## Future Enhancements

1. **Review Moderation**
   - Flag inappropriate reviews
   - Admin approval workflow
   - Spam detection

2. **Review Analytics**
   - Review sentiment analysis
   - Trending keywords
   - Helpful review ranking

3. **Review Features**
   - Photo uploads with reviews
   - Review responses from sellers
   - Review verification with email

4. **Customization**
   - Custom rating scales
   - Custom question templates
   - Review attribute scores

---

**Last Updated:** 2026-03-17
**Status:** Complete
