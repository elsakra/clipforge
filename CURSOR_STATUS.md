# ClipForge Project Status - For Cursor Agents

**Last Updated**: December 12, 2025

## Overview
ClipForge is an AI-powered video repurposing SaaS that turns one video into 100 pieces of content.

**Live Domain**: https://getclipforge.com
**GitHub Repo**: https://github.com/elsakra/clipforge
**Vercel Project ID**: prj_SKxePaZ0QqjCcMIvRRYM5aU2i5pt

## Current Status: WAITING FOR SUPABASE SCHEMA UPDATE

### Latest Changes (Dec 12)

**Switched from Clerk to Supabase Auth with OTP**:
- Removed `@clerk/nextjs` dependency
- Created new sign-in/sign-up pages with email OTP
- Updated middleware for Supabase auth
- Updated sidebar with custom user dropdown (no Clerk UserButton)
- Updated all API routes to use `getUser()` from `@/lib/supabase/auth`

**Code pushed to GitHub**: `52885ed` - "Switch to Supabase Auth with OTP - Remove Clerk dependency"

### What's Working ✅

1. **GitHub Repo**: Code is up to date at https://github.com/elsakra/clipforge
2. **Domain**: getclipforge.com purchased and configured
3. **Stripe Products**: Created (Starter $29, Pro $79, Agency $199)
4. **Vercel Project**: Connected to GitHub repo

### What Needs To Be Done 🔴

#### 1. Run Updated Schema in Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/wxctqlokkmobpnueuvdr/sql

Run the following SQL to update the schema for Supabase Auth:

```sql
-- Drop existing tables if migrating from Clerk
DROP TABLE IF EXISTS scheduled_posts CASCADE;
DROP TABLE IF EXISTS social_accounts CASCADE;
DROP TABLE IF EXISTS generated_contents CASCADE;
DROP TABLE IF EXISTS clips CASCADE;
DROP TABLE IF EXISTS contents CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Then run the full schema from supabase/schema.sql
```

**Important**: The schema now uses `auth.users(id)` as foreign key instead of `clerk_id`.

#### 2. Enable Email OTP in Supabase

1. Go to: https://supabase.com/dashboard/project/wxctqlokkmobpnueuvdr/auth/providers
2. Enable Email provider
3. Ensure "Enable email confirmations" is OFF for OTP flow
4. Ensure "Enable email OTP" is ON

#### 3. Set Vercel Environment Variables

Since the Vercel API token may have expired, go to Vercel dashboard:
https://vercel.com/elsakras-projects/clipforge/settings/environment-variables

**Remove these** (if they exist):
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

**Verify these are set** (get values from user's original API key list):
```
NEXT_PUBLIC_SUPABASE_URL=(from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_ANON_KEY=(from Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=(from Supabase dashboard)
NEXT_PUBLIC_APP_URL=https://getclipforge.com
OPENAI_API_KEY=(user's OpenAI key)
REPLICATE_API_TOKEN=(user's Replicate key)
STRIPE_SECRET_KEY=(user's Stripe secret)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=(user's Stripe publishable)
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_1SdcWJRe1kowKZlSTpnVgG6J
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_1SdcWaRe1kowKZlSSX62b3lF
NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID=price_1SdcWdRe1kowKZlSqAuxL7tU
CLOUDINARY_CLOUD_NAME=(user's Cloudinary)
CLOUDINARY_API_KEY=(user's Cloudinary)
CLOUDINARY_API_SECRET=(user's Cloudinary)
INNGEST_SIGNING_KEY=(user's Inngest)
RESEND_API_KEY=(user's Resend)
```

#### 4. Trigger Deployment

After setting env vars, click "Redeploy" on the latest deployment, or push a small change.

#### 5. Set Up Stripe Webhook

1. Go to: https://dashboard.stripe.com/webhooks
2. Add endpoint: `https://getclipforge.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy webhook signing secret and add to Vercel as `STRIPE_WEBHOOK_SECRET`

---

## File Structure

```
clipforge/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/page.tsx    # OTP sign-in (Supabase)
│   │   │   └── sign-up/page.tsx    # OTP sign-up (Supabase)
│   │   ├── auth/
│   │   │   └── callback/route.ts   # Auth callback handler
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx        # Main dashboard
│   │   │       ├── upload/         # Upload content
│   │   │       └── ...
│   │   ├── api/
│   │   │   ├── dashboard/stats/    # Dashboard metrics
│   │   │   ├── upload/             # File upload
│   │   │   ├── user/usage/         # Usage stats
│   │   │   ├── stripe/             # Stripe checkout/webhooks
│   │   │   └── inngest/            # Background jobs
│   │   ├── page.tsx                # Landing page
│   │   └── pricing/                # Pricing page
│   ├── components/
│   │   └── layout/
│   │       └── sidebar.tsx         # Updated with Supabase auth
│   └── lib/
│       ├── supabase/
│       │   ├── auth.ts             # getUser(), getUserRecord()
│       │   ├── client.ts           # Browser client
│       │   └── server.ts           # Server client
│       ├── ai/                     # OpenAI integration
│       ├── replicate/              # Video processing
│       └── stripe/                 # Payments
├── supabase/
│   └── schema.sql                  # Updated for Supabase Auth
└── middleware.ts                   # Supabase auth middleware
```

## Auth Flow (Supabase OTP)

1. User enters email on `/sign-in` or `/sign-up`
2. Supabase sends 6-digit OTP code via email
3. User enters code to verify
4. On success, Supabase creates session cookie
5. Middleware checks `supabase.auth.getUser()` for protected routes
6. User record auto-created in `users` table via trigger

## API Keys Reference

All keys should be stored in Vercel (NOT in code). See section 3 above.

## Revenue Model

| Plan | Price | Videos/mo | Target |
|------|-------|-----------|--------|
| Starter | $29 | 10 | Individual creators |
| Pro | $79 | 50 | Serious creators |
| Agency | $199 | Unlimited | Teams |

---

**Next agent**: Start by running the Supabase schema, then triggering a Vercel deployment.

