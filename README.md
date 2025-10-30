# ChiroFlow - Modern Chiropractic Practice Management System

A full-featured practice management platform built with React, TypeScript, and Supabase for chiropractic clinics.

## Features

- **Patient Management**: Complete medical history tracking, SOAP notes, and clinical documentation
- **Appointment Scheduling**: Smart calendar with automated reminders and confirmations
- **Billing & Payments**: Invoice generation, payment processing, and financial reporting
- **Email Automation**: Automated appointment reminders, confirmations, and follow-ups
- **Patient Portal**: Self-service portal for patients to manage appointments and view records
- **Waitlist Management**: Intelligent waitlist system with automated slot filling
- **Analytics Dashboard**: Real-time insights and performance metrics
- **Multi-Factor Authentication**: Enhanced security with optional MFA

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Validation**: Zod
- **Testing**: Vitest

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([Sign up here](https://supabase.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chiroflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Run database migrations**

   Navigate to your Supabase project dashboard and run the SQL migrations from the `supabase/migrations` folder in order.

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to `http://localhost:5173`

### First-Time Setup

1. Create an admin account by visiting `/admin/signup`
2. Configure clinic settings in the Settings page
3. Import or create your first patient
4. Set up appointment types and scheduling preferences

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript checks
```

### Code Quality Standards

This project enforces strict code quality standards:

- **ESLint**: Automated code linting with React and TypeScript rules
- **TypeScript**: Strict mode enabled for maximum type safety
- **Prettier**: Consistent code formatting
- **Max File Size**: 400 lines per file (warnings)
- **Max Function Size**: 100 lines per function (warnings)
- **Complexity**: Maximum cyclomatic complexity of 15

## Project Structure

```
src/
├── components/              # React components
│   ├── common/             # Reusable UI components (Toast, Modal, etc.)
│   ├── dashboard/          # Admin dashboard components
│   ├── navigation/         # Navigation components (Header, Sidebar)
│   └── patient-portal/     # Patient-facing components
├── pages/                  # Top-level route pages
│   ├── AdminDashboard.tsx  # Main admin interface
│   ├── PatientPortal.tsx   # Patient self-service portal
│   └── OnlineBooking.tsx   # Public booking page
├── lib/                    # Utilities and services
│   ├── supabase.ts         # Supabase client configuration
│   ├── env.ts              # Environment variable validation
│   ├── router.ts           # Custom routing system
│   ├── timeUtils.ts        # Date/time utilities
│   ├── errorHandler.ts     # Global error handling
│   └── performance.ts      # Performance monitoring
├── hooks/                  # Custom React hooks
│   ├── patients/           # Patient management hooks
│   ├── useTodayAppointments.ts
│   └── useKeyboardShortcuts.ts
├── config/                 # Centralized configuration
│   ├── app.config.ts       # App-wide settings
│   ├── timing.config.ts    # Timing and intervals
│   ├── business.config.ts  # Business rules
│   └── ui.config.ts        # UI constants
├── types/                  # TypeScript type definitions
├── contexts/               # React contexts
└── design-system/          # Design tokens and reusable components
```

## Configuration

### Centralized Configuration System

All magic numbers, timing values, and business rules are centralized in the `src/config` directory:

- `app.config.ts`: Performance thresholds, cache settings, error logging
- `timing.config.ts`: Appointment durations, reminder schedules, intervals
- `business.config.ts`: Pricing, clinic hours, waitlist rules
- `ui.config.ts`: Pagination, form limits, notification settings

This ensures maintainability and makes it easy to adjust application behavior.

### Environment Variables

See `.env.example` for all available configuration options. Required variables:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous/public key

Optional variables for extended features (email service, analytics, etc.) are documented in `.env.example`.

## Database

### Supabase Setup

1. Create a new Supabase project
2. Run migrations from `supabase/migrations/` in chronological order
3. Enable Row Level Security (RLS) is already configured in migrations
4. Deploy Edge Functions from `supabase/functions/` as needed

### Key Tables

- `patients_full`: Complete patient records with medical history
- `appointments_api`: Appointment scheduling and management
- `contacts`: Contact information and communication history
- `clinic_settings`: Clinic configuration and preferences
- `waitlist_invitations`: Intelligent waitlist management

## Security

- **Row Level Security (RLS)**: All database tables protected with RLS policies
- **Authentication**: Supabase Auth with email/password (MFA optional)
- **API Keys**: Environment variables, never committed to repository
- **HTTPS Only**: Enforced in production
- **Input Validation**: Zod schemas for all forms and API inputs

## Keyboard Shortcuts

Admin dashboard supports keyboard shortcuts for power users:

- `Ctrl+K`: Global search
- `Ctrl+T`: Today's view
- `Ctrl+N`: New patient
- `Ctrl+R`: Appointments
- `Ctrl+S`: Quick SOAP note
- `Ctrl+B`: Billing
- `?`: Show all shortcuts

## Building for Production

```bash
npm run build
```

The build output will be in the `dist/` directory. Deploy to any static hosting service (Vercel, Netlify, Cloudflare Pages, etc.).

### Deployment Checklist

- [ ] Set environment variables in hosting platform
- [ ] Run database migrations on production Supabase instance
- [ ] Deploy Edge Functions to production
- [ ] Configure custom domain and SSL
- [ ] Set up error monitoring (optional)
- [ ] Test authentication flows
- [ ] Verify email delivery

## Contributing

1. Create a feature branch from `main`
2. Make changes following the code quality standards
3. Ensure `npm run lint` and `npm run typecheck` pass
4. Test thoroughly
5. Submit a pull request with clear description

### Code Style

- Use functional components with hooks
- Extract complex logic into custom hooks
- Keep components under 400 lines
- Keep functions under 100 lines
- Use TypeScript strict mode
- Follow the existing naming conventions

## Troubleshooting

### Common Issues

**Build fails with TypeScript errors**
- Run `npm run typecheck` to see all type errors
- Ensure all dependencies are installed: `npm install`

**Supabase connection fails**
- Verify `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Check Supabase project status in dashboard

**Login doesn't work**
- Ensure database migrations have run
- Check browser console for error messages
- Verify RLS policies are applied

## License

[Specify your license here]

## Support

For issues and questions, please open an issue on the GitHub repository.

---

Built with ❤️ for chiropractic professionals
