# ClipForge Project Status - For Cursor Agents

**Last Updated**: December 13, 2025

## Overview
ClipForge is an AI-powered video repurposing SaaS that turns one video into 100 pieces of content.

**Live Domain**: https://getclipforge.com
**GitHub Repo**: https://github.com/elsakra/clipforge
**Vercel Project ID**: prj_SKxePaZ0QqjCcMIvRRYM5aU2i5pt

## Current Status: FULLY FUNCTIONAL - DESIGN OVERHAULED

### Latest Changes (Dec 13) - Design Overhaul

**Complete UI/UX redesign** inspired by Airbnb, Figma, and Palantir:

1. **New Design Token System** (`globals.css`)
   - Typography: Manrope (headings) + DM Sans (body) - premium font pairing
   - Color palette: Deep indigo/violet primary with warm coral accent
   - 8pt spacing grid with consistent design tokens
   - Refined shadows, transitions, and animations
   - Accessible focus states and reduced motion support

2. **New Logo** (`public/logo.svg`, `public/logo-icon.svg`)
   - Distinctive geometric mark with stacked layers + clip element
   - Works at all sizes (favicon to full logo)
   - Uses brand gradient (violet → purple)
   - SVG favicon for modern browsers

3. **Landing Page Overhaul** (`src/app/page.tsx`)
   - Refined hero with better visual hierarchy
   - Polished feature cards with subtle hover states
   - Sophisticated testimonials and pricing sections
   - New Logo component with proper branding

4. **Auth Pages Redesign** (`src/app/(auth)/sign-in/page.tsx`, `sign-up/page.tsx`)
   - Segmented OTP input with auto-focus and paste support
   - Auto-submit when OTP is complete
   - Cleaner card design with refined backgrounds
   - Benefits section on sign-up page

5. **Dashboard Updates**
   - Updated sidebar with new logo (`src/components/layout/sidebar.tsx`)
   - Refined header with glass effect (`src/components/layout/dashboard-header.tsx`)
   - Polished dashboard page with card hover effects
   - Consistent spacing and typography throughout

6. **Pricing Page** (`src/app/pricing/page.tsx`)
   - Updated with new logo and design tokens
   - Refined card styles and FAQ section

### Build Status: ✅ Successfully builds with no errors

---

## What's Working ✅

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

---

## External Setup Required 🔴

### 1. Run Schema in Supabase SQL Editor

Go to: https://supabase.com/dashboard/project/wxctqlokkmobpnueuvdr/sql

Run the full schema from `supabase/schema.sql` (already includes Supabase Auth support).

### 2. Configure Supabase Email Templates for OTP

**IMPORTANT**: To show the OTP code in the email subject line:

1. Go to: https://supabase.com/dashboard/project/wxctqlokkmobpnueuvdr/auth/templates
2. Select "Magic Link" or "OTP" template
3. Update the **Subject** field to:
   ```
   ClipForge: Your code is {{ .Token }}
   ```
4. Update the **Body** to include a better message:
   ```html
   <h2>Your ClipForge verification code</h2>
   <p>Enter this code to sign in:</p>
   <h1 style="font-size: 32px; letter-spacing: 8px; font-family: monospace;">{{ .Token }}</h1>
   <p>This code expires in 10 minutes.</p>
   <p>If you didn't request this, you can safely ignore this email.</p>
   ```
5. Click "Save"

### 3. Enable Email OTP in Supabase

1. Go to: https://supabase.com/dashboard/project/wxctqlokkmobpnueuvdr/auth/providers
2. Enable Email provider
3. Ensure "Enable email confirmations" is OFF for OTP flow
4. Ensure "Enable email OTP" is ON

### 4. Set Vercel Environment Variables

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

### 5. Set Up Stripe Webhook

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
│   │   │   ├── sign-in/page.tsx       # OTP sign-in with segmented input
│   │   │   └── sign-up/page.tsx       # OTP sign-up with benefits
│   │   ├── auth/
│   │   │   └── callback/route.ts      # Auth callback handler
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx           # Main dashboard (redesigned)
│   │   │       ├── content/
│   │   │       │   ├── page.tsx       # Content library
│   │   │       │   └── [id]/page.tsx  # Content detail view
│   │   │       ├── clips/page.tsx     # Clips gallery
│   │   │       ├── upload/page.tsx    # Upload content
│   │   │       ├── calendar/page.tsx  # Content calendar
│   │   │       └── settings/page.tsx  # User settings
│   │   ├── api/                       # All API routes
│   │   ├── globals.css                # Design tokens & styles
│   │   ├── layout.tsx                 # Root layout with fonts
│   │   ├── page.tsx                   # Landing page (redesigned)
│   │   └── pricing/page.tsx           # Pricing page (redesigned)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── dashboard-header.tsx   # Dashboard header
│   │   │   └── sidebar.tsx            # Sidebar with new logo
│   │   ├── ui/                        # shadcn/ui components
│   │   └── upload/
│   │       └── upload-zone.tsx        # File upload component
│   └── lib/                           # Utilities and services
├── public/
│   ├── logo.svg                       # Full logo
│   └── logo-icon.svg                  # Icon/favicon
├── supabase/
│   └── schema.sql                     # Database schema
└── CURSOR_STATUS.md                   # This file
```

---

## Design System

### Typography
- **Display/Headings**: Manrope (700-800 weight, tight tracking)
- **Body**: DM Sans (400-600 weight, relaxed line height)
- **Monospace**: SF Mono / Fira Code

### Colors (Dark Mode Default)
- **Primary**: oklch(0.70 0.22 275) - Vibrant indigo/violet
- **Accent**: oklch(0.72 0.18 25) - Warm coral
- **Background**: oklch(0.11 0.015 265) - Deep slate
- **Card**: oklch(0.145 0.015 265) - Elevated surface
- **Border**: oklch(0.24 0.015 265) - Subtle dividers

### Spacing (8pt Grid)
```css
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-6: 24px;  --space-8: 32px;
```

### Key Utility Classes
- `.font-display` - Manrope headings
- `.text-gradient` - Brand gradient text
- `.bg-gradient-brand` - Primary gradient background
- `.glow` / `.glow-sm` - Primary color glow effect
- `.glass` - Frosted glass effect
- `.card-hover` - Card hover animation
- `.press-effect` - Button press scale

---

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
2. Supabase sends 6-digit OTP code via email (subject includes code)
3. User enters code in segmented input (auto-submits on completion)
4. On success, Supabase creates session cookie
5. Middleware checks `supabase.auth.getUser()` for protected routes
6. User record auto-created in `users` table via trigger

### Subscription Flow
1. User clicks plan on `/pricing`
2. `/api/stripe/checkout` creates Stripe checkout session
3. User completes payment on Stripe
4. Webhook updates user plan in database
5. User redirected back with active subscription

---

## Revenue Model

| Plan | Price | Videos/mo | Target |
|------|-------|-----------|--------|
| Free | $0 | 3 | Trial users |
| Starter | $29 | 10 | Individual creators |
| Pro | $79 | 50 | Serious creators |
| Agency | $199 | Unlimited | Teams |

---

## Notes for Next Agent

The codebase is complete and functional with a new premium design. Main tasks:

1. **Supabase Setup**: Run schema + configure email templates for OTP in subject
2. **Vercel**: Ensure all environment variables are set
3. **Stripe**: Configure webhook endpoint
4. **Testing**: Full flow test: sign up → upload → process → view

The build passes successfully. Push to GitHub and deploy via Vercel.

### Design Notes
- Uses Manrope + DM Sans (Google Fonts) - preconnected in layout
- Dark mode is default (class="dark" on html)
- Logo is SVG-based, works as favicon
- All components use design tokens from globals.css
- Press effect (.press-effect) adds subtle scale on click
- Card hover (.card-hover) adds subtle lift and shadow
