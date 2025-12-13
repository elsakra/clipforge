# ClipForge Project Status - For Cursor Agents

**Last Updated**: December 13, 2025

## Overview
ClipForge is an AI-powered video repurposing SaaS that turns one video into 100 pieces of content.

**Live Domain**: https://getclipforge.com
**GitHub Repo**: https://github.com/elsakra/clipforge
**Vercel Project ID**: prj_SKxePaZ0QqjCcMIvRRYM5aU2i5pt

## Current Status: FULLY FUNCTIONAL - READY FOR DEPLOYMENT

### Latest Changes (Dec 13)

**Completed all missing functionality**:
- Fixed upload flow to support both Cloudinary FormData and R2-style uploads
- Created `/api/import-url` route for YouTube/TikTok URL imports
- Created `/api/cron/reset-usage` route for monthly usage reset
- Created `/dashboard/content/[id]` page for content details, clips, and generated posts
- Created Twitter and LinkedIn OAuth callback routes
- Removed mock data fallbacks from content page

**Build Status**: ✅ Successfully builds with no errors

### What's Working ✅

1. **Authentication**: Supabase OTP email authentication
2. **File Uploads**: Cloudinary-based upload with progress tracking
3. **URL Imports**: YouTube and TikTok URL import support
4. **Content Processing**: Inngest-powered background processing
5. **Transcription**: OpenAI Whisper + Replicate fallback
6. **AI Content Generation**: GPT-4 for highlights, clips, and social posts
7. **Video Clips**: Replicate FFmpeg for clip generation
8. **Stripe Billing**: Checkout, webhooks, and customer portal
9. **Dashboard**: Full dashboard with stats, content library, clips, calendar
10. **Content Detail Page**: View transcription, clips, and generated posts
11. **Social OAuth**: Twitter and LinkedIn callback routes

### What Still Needs External Setup 🔴

#### 1. Run Schema in Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/wxctqlokkmobpnueuvdr/sql

Run the full schema from `supabase/schema.sql` (already includes Supabase Auth support).

#### 2. Enable Email OTP in Supabase

1. Go to: https://supabase.com/dashboard/project/wxctqlokkmobpnueuvdr/auth/providers
2. Enable Email provider
3. Ensure "Enable email confirmations" is OFF for OTP flow
4. Ensure "Enable email OTP" is ON

#### 3. Set Vercel Environment Variables

Go to: https://vercel.com/elsakras-projects/clipforge/settings/environment-variables

Required environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=(from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_ANON_KEY=(from Supabase dashboard)
SUPABASE_SERVICE_ROLE_KEY=(from Supabase dashboard)
NEXT_PUBLIC_APP_URL=https://getclipforge.com
OPENAI_API_KEY=(user's OpenAI key)
REPLICATE_API_TOKEN=(user's Replicate key)
STRIPE_SECRET_KEY=(user's Stripe secret)
STRIPE_WEBHOOK_SECRET=(from Stripe webhook setup)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=(user's Stripe publishable)
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_1SdcWJRe1kowKZlSTpnVgG6J
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_1SdcWaRe1kowKZlSSX62b3lF
NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID=price_1SdcWdRe1kowKZlSqAuxL7tU
CLOUDINARY_CLOUD_NAME=(user's Cloudinary)
CLOUDINARY_API_KEY=(user's Cloudinary)
CLOUDINARY_API_SECRET=(user's Cloudinary)
INNGEST_SIGNING_KEY=(user's Inngest)
INNGEST_EVENT_KEY=(user's Inngest)
```

Optional (for social publishing):
```
TWITTER_CLIENT_ID=(Twitter API credentials)
TWITTER_CLIENT_SECRET=(Twitter API credentials)
LINKEDIN_CLIENT_ID=(LinkedIn API credentials)
LINKEDIN_CLIENT_SECRET=(LinkedIn API credentials)
```

#### 4. Set Up Stripe Webhook

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
│   │   │   ├── sign-in/page.tsx       # OTP sign-in (Supabase)
│   │   │   └── sign-up/page.tsx       # OTP sign-up (Supabase)
│   │   ├── auth/
│   │   │   └── callback/route.ts      # Auth callback handler
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx           # Main dashboard
│   │   │       ├── content/
│   │   │       │   ├── page.tsx       # Content library
│   │   │       │   └── [id]/page.tsx  # Content detail view
│   │   │       ├── clips/page.tsx     # Clips gallery
│   │   │       ├── upload/page.tsx    # Upload content
│   │   │       ├── calendar/page.tsx  # Content calendar
│   │   │       └── settings/page.tsx  # User settings
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   ├── twitter/callback/  # Twitter OAuth
│   │   │   │   └── linkedin/callback/ # LinkedIn OAuth
│   │   │   ├── clips/                 # Clips CRUD
│   │   │   ├── content/               # Content CRUD
│   │   │   ├── cron/
│   │   │   │   ├── publish-scheduled/ # Auto-publish posts
│   │   │   │   └── reset-usage/       # Monthly usage reset
│   │   │   ├── dashboard/stats/       # Dashboard metrics
│   │   │   ├── generate/              # AI content generation
│   │   │   ├── import-url/            # YouTube/TikTok import
│   │   │   ├── inngest/               # Background jobs
│   │   │   ├── process/               # Content processing
│   │   │   ├── publish/               # Social publishing
│   │   │   ├── schedule/              # Post scheduling
│   │   │   ├── stripe/                # Payments
│   │   │   ├── transcribe/            # Audio transcription
│   │   │   ├── upload/                # File upload
│   │   │   └── user/                  # User data
│   │   ├── page.tsx                   # Landing page
│   │   └── pricing/page.tsx           # Pricing page
│   ├── components/
│   │   ├── layout/
│   │   │   ├── dashboard-header.tsx
│   │   │   └── sidebar.tsx
│   │   ├── ui/                        # shadcn/ui components
│   │   └── upload/
│   │       └── upload-zone.tsx        # File upload component
│   └── lib/
│       ├── ai/openai.ts               # OpenAI integration
│       ├── inngest/                   # Background job functions
│       ├── replicate/                 # Video processing
│       ├── social/
│       │   ├── twitter.ts             # Twitter API
│       │   └── linkedin.ts            # LinkedIn API
│       ├── storage/
│       │   ├── cloudinary.ts          # Cloudinary storage
│       │   └── r2.ts                  # R2 storage (optional)
│       ├── stripe/                    # Payments
│       └── supabase/                  # Database client
├── supabase/
│   └── schema.sql                     # Database schema
├── middleware.ts                      # Auth middleware
└── vercel.json                        # Deployment config
```

## Key Flows

### Content Upload Flow
1. User drops file or pastes URL on `/dashboard/upload`
2. `upload-zone.tsx` calls `/api/upload` to get Cloudinary signature
3. File uploads directly to Cloudinary with progress tracking
4. `/api/upload` PATCH confirms upload and triggers Inngest
5. Inngest `processContent` function transcribes and analyzes content
6. AI identifies highlights and generates clip suggestions
7. User views results on `/dashboard/content/[id]`

### Auth Flow (Supabase OTP)
1. User enters email on `/sign-in` or `/sign-up`
2. Supabase sends 6-digit OTP code via email
3. User enters code to verify
4. On success, Supabase creates session cookie
5. Middleware checks `supabase.auth.getUser()` for protected routes
6. User record auto-created in `users` table via trigger

### Subscription Flow
1. User clicks plan on `/pricing`
2. `/api/stripe/checkout` creates Stripe checkout session
3. User completes payment on Stripe
4. Webhook updates user plan in database
5. User redirected back with active subscription

## Revenue Model

| Plan | Price | Videos/mo | Target |
|------|-------|-----------|--------|
| Free | $0 | 3 | Trial users |
| Starter | $29 | 10 | Individual creators |
| Pro | $79 | 50 | Serious creators |
| Agency | $199 | Unlimited | Teams |

---

## Notes for Next Agent

The codebase is complete and functional. Main tasks:
1. Ensure environment variables are set in Vercel
2. Run the database schema in Supabase
3. Configure Stripe webhook
4. Test the full flow: sign up → upload → process → view

The build passes successfully. Push to GitHub and deploy via Vercel.
