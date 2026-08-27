# LocalMart — Local Business Marketplace

A full-stack Next.js marketplace for local businesses in Ghana.

## Tech Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT (bcryptjs)
- **Images:** Cloudinary
- **Currency:** GHS (Ghana Cedis)

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up your database
Create a PostgreSQL database called `localmart`, then update `.env.local`:
```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/localmart"
```

### 3. Run database migrations
```bash
npx prisma migrate dev --name init
```

### 4. Generate Prisma client
```bash
npx prisma generate
```

### 5. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure
```
app/
  api/              # API routes (auth, businesses, products, cart, orders)
  (auth)/           # Login & Signup pages
  (main)/           # Customer-facing pages (home, products, businesses, cart)
  (seller)/         # Seller dashboard
  (admin)/          # Admin panel
lib/                # Prisma client, auth helpers, utilities
types/              # TypeScript types
components/         # Reusable UI components
prisma/
  schema.prisma     # Full database schema
```

## User Roles
| Role | Access |
|------|--------|
| CUSTOMER | Browse, cart, orders, reviews |
| SELLER | Dashboard, products, orders, reports |
| ADMIN | Full platform control |

## Payment Methods Supported
- Mobile Money (MTN MoMo, Vodafone Cash, AirtelTigo)
- Card
- Cash on Delivery
- Bank Transfer
