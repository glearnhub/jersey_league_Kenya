# Jersey League Kenya (Next.js + Vercel + M-Pesa)

This is the **Next.js (App Router + TypeScript + Tailwind CSS v4 + Prisma + M-Pesa Daraja)** edition of **Jersey League Kenya**, designed to run natively on **Vercel** with a serverless **PostgreSQL** database (Neon or Supabase).

## Features Included (1:1 with the Laravel Store)

- **Storefront:** Home page with animated hero, Featured jerseys, New arrivals, per-Sport rows, 3-level Category tree (`Sport -> Competition -> Collection`), search, and filters (Team, Version, Size including Kids' sizes `4-5Y`–`12-13Y`, On Sale, and Price sorting).
- **Jersey Customisation & Server-Side Pricing:** Optional custom **Print Name** (ASCII uppercase, max 14 chars) and **Print Number** (`0`–`99`), plus optional **Sleeve Badge**. All prices, printing fees, and delivery fees are computed on the server.
- **Persistent Cart & Stock Validation:** Zustand client store synced with `/api/cart/validate`, enforcing available stock (`stock - reserved`) aggregated across all cart lines sharing the same product variant.
- **M-Pesa STK Push Checkout & Signed Order Links:**
  - Holds stock (`reserved`) for `SHOP_PAYMENT_WINDOW` minutes (`15` mins by default).
  - Sends Daraja STK Push (`/mpesa/stkpush/v1/processrequest`) supporting both **Paybill** (`CustomerPayBillOnline`) and **Buy Goods Till** (`CustomerBuyGoodsOnline` with `MPESA_PARTY_B`).
  - Secured callback endpoint (`POST /api/mpesa/callback/[token]`) with timing-safe token validation, amount verification, and idempotency.
  - Automatic fallback reconciliation via **STK Push Query** (`/mpesa/stkpushquery/v1/query`) on page load/poll and via Vercel Cron (`GET /api/cron/reconcile`).
  - Guest order pages (`/orders/JLK-000001?sig=...`) protected by HMAC-SHA256 signatures, with 3-second live polling and Fake M-Pesa test mode (`MPESA_FAKE=true`).
- **Admin Dashboard (`/admin`):** Manage Orders (with automatic stock release when cancelling an unpaid order), M-Pesa Payments, Products & Size Variants, Categories, and Delivery Zones.

---

## 1. Local Setup

```bash
cd c:/xampp/htdocs/jersey-league-kenya-nextjs
npm install
```

1. Set `DATABASE_URL` in `.env` to your PostgreSQL connection string (e.g. a free **Neon** or **Supabase** database).
   *(Tip: If you want to test locally with SQLite before creating a Postgres database, change `provider = "postgresql"` to `provider = "sqlite"` in `prisma/schema.prisma` and set `DATABASE_URL="file:./dev.db"` in `.env`.)*
2. Push the Prisma schema and seed the categories, delivery zones, admin user, and demo jerseys:
   ```bash
   npm run db:push
   npm run db:seed
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   - **Storefront:** http://localhost:3000
   - **Admin panel:** http://localhost:3000/admin

---

## 2. Deploying to Vercel

1. Push this folder (`jersey-league-kenya-nextjs`) to a GitHub repository.
2. In **Vercel**, click **Add New → Project** and import the repository.
3. In the Vercel project's **Storage** tab, connect a **Neon Postgres** (or **Supabase**) database—Vercel will automatically set `DATABASE_URL`.
4. Add the environment variables from `.env.example` in **Vercel → Settings → Environment Variables**:
   - `APP_SECRET` (a random 32+ character string)
   - `NEXT_PUBLIC_APP_URL` (`https://your-project.vercel.app` or your custom domain)
   - `ADMIN_EMAIL` & `ADMIN_PASSWORD`
   - `MPESA_ENV` (`sandbox` for testing, `live` for production)
   - `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_SHORTCODE`, `MPESA_PASSKEY`
   - `MPESA_TRANSACTION_TYPE` (`CustomerPayBillOnline` in Sandbox, `CustomerBuyGoodsOnline` for your Live Till)
   - `MPESA_PARTY_B` (your Till Number in Live mode)
   - `MPESA_PUBLIC_URL` (`https://your-project.vercel.app` or your custom domain — **no tunnel needed on Vercel!**)
   - `MPESA_FAKE` (`false`)
5. Update the Build Command in Vercel (or run once locally against the production `DATABASE_URL`):
   ```bash
   npx prisma db push && npx tsx prisma/seed.ts
   ```
