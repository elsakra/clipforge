# ClipForge - AI Content Repurposing Platform

Transform your long-form content into viral clips, social posts, and newsletters automatically with AI.

## Features

- **Smart Upload**: Drag & drop videos or import from YouTube/TikTok
- **AI Transcription**: Automatic speech-to-text using OpenAI Whisper
- **Viral Clip Detection**: AI identifies the most engaging moments
- **Multi-Platform Content**: Generate posts for Twitter, LinkedIn, Instagram, and more
- **Content Calendar**: Schedule and manage posts across all platforms
- **Analytics Dashboard**: Track engagement and get AI-powered recommendations

## Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, shadcn/ui
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2
- **AI**: OpenAI (GPT-4 Turbo, Whisper)
- **Video Processing**: Modal.com (FFmpeg)
- **Payments**: Stripe
- **Queue**: Upstash Redis

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Accounts for: Clerk, Supabase, Cloudflare R2, OpenAI, Stripe

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/clipforge.git
cd clipforge
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Copy the environment variables:
\`\`\`bash
cp env.example.txt .env.local
\`\`\`

4. Fill in your environment variables in `.env.local`

5. Set up the database:
   - Go to your Supabase dashboard
   - Run the SQL from `supabase/schema.sql` in the SQL editor

6. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

See `env.example.txt` for all required environment variables:

- **Clerk**: Authentication
- **Supabase**: Database
- **Cloudflare R2**: File storage
- **OpenAI**: AI transcription and content generation
- **Stripe**: Payments
- **Upstash Redis**: Job queues
- **Modal**: Video processing (optional)
- **Social APIs**: Twitter, LinkedIn (optional)

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add all environment variables
4. Deploy!

### Configuration

The `vercel.json` file includes:
- Cron jobs for publishing scheduled posts
- Extended function timeout for video processing

## Project Structure

\`\`\`
clipforge/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── (auth)/         # Auth pages (sign-in, sign-up)
│   │   ├── (dashboard)/    # Dashboard pages
│   │   ├── api/            # API routes
│   │   └── page.tsx        # Landing page
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── layout/        # Layout components
│   │   └── upload/        # Upload components
│   ├── lib/               # Utilities and services
│   │   ├── ai/           # OpenAI integration
│   │   ├── social/       # Social media APIs
│   │   ├── stripe/       # Stripe integration
│   │   ├── storage/      # R2 storage
│   │   ├── supabase/     # Database client
│   │   └── queue/        # Redis queue
│   ├── store/            # Zustand stores
│   └── types/            # TypeScript types
├── supabase/
│   └── schema.sql        # Database schema
└── vercel.json           # Deployment config
\`\`\`

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/upload` | POST | Get presigned upload URL |
| `/api/upload` | PATCH | Confirm upload completion |
| `/api/process` | POST | Start content processing |
| `/api/transcribe` | POST | Transcribe audio/video |
| `/api/generate` | POST | Generate social content |
| `/api/clips` | GET/POST/PUT/DELETE | Manage clips |
| `/api/content` | GET/DELETE | Manage content |
| `/api/schedule` | GET/POST/DELETE | Manage scheduled posts |
| `/api/publish` | POST | Publish to social media |
| `/api/stripe/checkout` | POST | Create checkout session |
| `/api/stripe/webhook` | POST | Handle Stripe webhooks |
| `/api/stripe/portal` | POST | Create billing portal |

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| Starter | $29/mo | 10 videos, basic features |
| Pro | $79/mo | 50 videos, all platforms, scheduling |
| Agency | $199/mo | Unlimited, team features, API access |

## License

MIT License - see LICENSE file for details.

## Support

- Email: support@clipforge.ai
- Twitter: @clipforge
- Discord: discord.gg/clipforge
