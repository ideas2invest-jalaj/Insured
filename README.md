# Insurance Renewal Management Portal

A complete production-ready insurance renewal management system built with Next.js 14.

## Features

- **Dashboard** - Overview with stats cards, upcoming renewals, quick actions
- **Policy Management** - Full CRUD, search, filter by company/status/date
- **Bulk Import** - Upload CSV/Excel to import multiple policies
- **Interaction Logs** - Track client communications with timeline view
- **Authentication** - JWT-based auth with login/register
- **Automated Alerts** - T-30 reminders and overdue notifications
- **Multi-channel Notifications** - Email (SendGrid), SMS/WhatsApp (Twilio)
- **Cron Jobs** - Daily automated checks for renewals

## Quick Start

### 1. Setup Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `database/schema.sql`
3. Copy your project URL and keys

### 2. Environment Setup

```bash
# In the root directory
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
```

### 3. Install & Run

```bash
npm install
npm run dev
```

### 4. Open Application

- Go to [http://localhost:3000](http://localhost:3000)
- Register a new account
- Start managing policies!

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Styling**: CSS Modules
- **Auth**: JWT + bcrypt
- **SMS/WhatsApp**: Twilio (mock mode if not configured)
- **Email**: SendGrid (mock mode if not configured)

## Project Structure

```
ins-sec/
├── frontend/
│   ├── app/
│   │   ├── (auth)/          # Login, Register pages
│   │   ├── (dashboard)/     # Dashboard, Policies, Interactions
│   │   │   ├── dashboard/
│   │   │   ├── policies/
│   │   │   ├── clients/
│   │   │   └── interactions/
│   │   └── api/             # API routes
│   │       ├── auth/
│   │       ├── policies/
│   │       ├── interactions/
│   │       ├── alerts/
│   │       └── cron/
│   ├── components/
│   ├── lib/
│   │   ├── api.js           # API client
│   │   ├── authContext.js    # Auth provider
│   │   ├── supabase.js      # Supabase client
│   │   ├── sendgrid.js      # Email service
│   │   └── twilio.js        # SMS/WhatsApp service
│   └── styles/
├── database/
│   └── schema.sql           # Database schema
└── .env.example
```

## API Endpoints

All endpoints require JWT authentication (except `/api/auth/login` and `/api/auth/register`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/policies` | List policies (with filters) |
| POST | `/api/policies` | Create policy |
| GET | `/api/policies/:id` | Get policy |
| PUT | `/api/policies/:id` | Update policy |
| DELETE | `/api/policies/:id` | Delete policy |
| POST | `/api/policies/import` | Bulk import CSV/Excel |
| GET | `/api/policies/stats` | Dashboard stats |
| GET | `/api/interactions` | List interactions |
| POST | `/api/interactions` | Create interaction |
| DELETE | `/api/interactions/:id` | Delete interaction |
| POST | `/api/alerts/send` | Send alert |
| GET | `/api/cron/renewals` | Run cron job manually |

## Cron Job

The cron job runs daily at 9:00 AM (set via external service like Vercel Cron or a system cron).

It:
1. Checks all unpaid policies
2. Sends T-30 day reminders for upcoming renewals
3. Sends overdue alerts (every 3 days for unpaid overdue policies)

### Setting up Vercel Cron

In `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/renewals",
    "schedule": "0 9 * * *"
  }]
}
```

## Mock Mode

If no API keys are configured, services run in mock mode:
- Emails print to console
- SMS/WhatsApp print to console

This allows full functionality testing without external services.

## License

Private - All rights reserved
