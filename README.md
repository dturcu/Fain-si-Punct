# ECommerce Platform

A scalable ecommerce platform built with Next.js and MongoDB, designed to handle 15,000+ products efficiently.

## Features

- **Product Management**: Browse, search, and filter 15k+ products
- **Product Categories**: Organized by category for easy navigation
- **Search & Filtering**: Full-text search and category-based filtering
- **Order Management**: Complete order creation and tracking
- **Responsive Design**: Works on desktop and mobile devices
- **Performance Optimized**: Efficient indexing and pagination for large product catalogs

## Tech Stack

- **Frontend**: Next.js 15, React 19
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **State Management**: Zustand
- **Styling**: CSS Modules + Global CSS

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or cloud instance)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Update `.env.local` with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/ecommerce
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Database Setup

1. Make sure MongoDB is running
2. Seed the database with 15k products:
```bash
npm run seed
```

This will:
- Create product indices for optimal query performance
- Generate 15,000 products across 10 categories
- Display statistics by category

### Running the Application

Development:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

Production build:
```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   └── api/
│       ├── products/      # Products API endpoints
│       └── orders/        # Orders API endpoints
├── models/
│   ├── Product.js         # Product schema
│   └── Order.js           # Order schema
├── lib/
│   └── db.js              # MongoDB connection
├── styles/
│   ├── globals.css        # Global styles
│   └── home.module.css    # Home page styles
├── scripts/
│   └── seed.js            # Database seeding script
└── package.json
```

## API Endpoints

### Products
- `GET /api/products` - List all products (paginated)
  - Query params: `page`, `limit`, `category`, `search`, `sort`
- `GET /api/products/[id]` - Get single product
- `POST /api/products` - Create new product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Orders
- `GET /api/orders` - List orders
  - Query params: `email`, `status`
- `POST /api/orders` - Create new order

## Database Indices

For optimal performance with 15k products, the following indices are created:

- Product name (unique)
- Product slug (unique)
- Category + Price (compound)
- Full-text search on name and description
- Order number (unique)
- Customer email
- Order status

## Scalability Considerations

The setup is optimized for 15k products with:
- Lean queries (`.lean()`) to reduce memory usage
- Pagination to limit data transfer
- Compound indices for common filter combinations
- Full-text search for text queries
- Proper connection pooling with MongoDB

## Future Enhancements

- User authentication
- Shopping cart functionality
- Payment integration
- Admin dashboard
- Reviews and ratings system
- Email notifications
- Analytics dashboard

## License

MIT
