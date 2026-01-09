# Facility Ready Board - Demo

Real-time resident pickup coordination for assisted living facilities.

## Quick Start

### 1. Install Dependencies

```bash
cd demo
npm install
```

### 2. Set Up Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** and run the contents of `supabase-schema.sql`
4. Go to **Settings > API** and copy your:
   - Project URL
   - Anon public key

### 3. Set Up Twilio (Optional for SMS)

1. Create a free account at [twilio.com](https://twilio.com)
2. Get a phone number (free trial includes one)
3. Copy your:
   - Account SID
   - Auth Token
   - Phone Number

### 4. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890

# For the demo, set this to the ED's phone number
DEMO_FAMILY_PHONE=+1234567890
```

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo Setup

For the demo, you'll need:

1. **Your laptop** - Open `/admin` (Clerk view)
2. **Your phone** - Open `/floor` (Nurse view)
3. **ED's phone number** - Set in `DEMO_FAMILY_PHONE`

### Demo Flow

1. On laptop: Add a pickup for a resident
2. Watch it appear on your phone instantly (no refresh)
3. On phone: Tap "Start Prep" - laptop turns yellow
4. On phone: Tap "Ready for Pickup" - ED gets SMS!

## Deployment (Vercel)

```bash
npm install -g vercel
vercel
```

Add your environment variables in Vercel dashboard.

## File Structure

```
demo/
├── app/
│   ├── admin/          # Clerk dashboard
│   ├── floor/          # Nurse tablet view
│   ├── api/            # API routes
│   └── page.tsx        # Home/landing
├── components/         # React components
├── hooks/              # Custom hooks (realtime)
├── lib/                # Supabase, Twilio, types
├── public/             # Static assets
└── supabase-schema.sql # Database setup
```

## PWA Install

On mobile/tablet:
1. Open the app URL
2. Tap browser menu
3. "Add to Home Screen"

This makes it look like a native app!
