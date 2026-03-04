# Overview

This is a fully functional Thirukural Learning Web Application designed to help children (ages 6-14) learn ancient Tamil text in an engaging and interactive manner. The application displays individual Thirukural verses with their meanings in both Tamil and English, includes audio pronunciation playback from GitHub-hosted files, Tamil pronunciation practice with speech recognition feedback, and embedded YouTube videos for enhanced learning context. Features Google OAuth authentication, PostgreSQL database for user data, leaderboard, quest system, school management, and a virtual shop (Sandhai).

## Recent Changes (March 2025)
- **SEO Improvements**: Added server-rendered `sr-only` text content to homepage and kural pages for Googlebot crawlability (intro text, kural of the day, featured verses, chapter links, verse text + meanings)
- **Video Sitemap**: Created `/video-sitemap` route with `<video:video>` XML tags for all YouTube-linked kurals; registered in robots.txt alongside main sitemap
- **Sitemap Expansion**: Added missing pages (learntamil, leaderboard, quest) to main sitemap.xml
- **Redirect Fix**: Updated middleware.ts to use `x-forwarded-host` and construct redirect URL from pathname+search for reliable thirukural.replit.app → learnthirukkural.com redirects
- **GitHub Code Sync**: Pulled latest codebase from GitHub (SilaPal/LearnKural) with new features including database integration, Google OAuth, dashboards, leaderboard, quest system, and school management
- **PostgreSQL Database**: Re-added PostgreSQL with Drizzle ORM for persistent user data (users, schools, classrooms, avatars, progress, favorites, waitlist)
- **Google OAuth Authentication**: Replaced simple username/password auth with Google Sign-In
- **Leaderboard**: Added competitive leaderboard with weekly XP tracking
- **Quest System**: New quest/adventure mode for guided learning paths
- **School Management**: Schools can register, create classrooms, invite teachers/students
- **Parent/Teacher/School Admin Dashboards**: Role-based dashboards for different user types
- **Sandhai (Virtual Shop)**: In-app coin shop for avatar purchases
- **Avatar System**: Users can unlock and equip different avatars
- **Waitlist**: Admin waitlist management for new feature rollouts
- **Payment Integration**: Stripe checkout stub for premium features
- **CRON Weekly Reset**: Automated weekly XP reset endpoint

## Previous Changes (January 2025)
- **Next.js SSR Migration**: Migrated from React SPA (Vite) to Next.js App Router with Server-Side Rendering
- **SEO-First Architecture**: Dynamic sitemap.ts, robots.ts, per-page metadata with Open Graph and Twitter cards
- **Custom Domain**: Deployed to learnthirukkural.com
- **Audio/Video Integration**: GitHub-hosted audio, YouTube embeds with completion tracking
- **Tamil Pronunciation Practice**: Speech recognition with Levenshtein distance scoring
- **Badge System**: Achievement badges with celebration effects
- **Interactive Games**: Puzzle, Flying, Balloon, Race, Memory games
- **Tamil Letter Learning**: Letter tracing and quizzes
- **Persistent Progress**: localStorage-based point and progress tracking
- **GitHub CSV Data Source**: Kural content from GitHub CSV with 24-hour caching

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: Next.js 14 with App Router for server-side rendering and static generation
- **Rendering**: Server Components for SEO-critical content, Client Components for interactive features
- **UI Library**: Radix UI primitives with custom components
- **Styling**: Tailwind CSS with CSS variables, Gen Z/Gen Alpha aesthetic (glassmorphism, neon effects)
- **State Management**: localStorage for client-side persistence, React Query for server state
- **Routing**: Next.js App Router with dynamic routes

## Backend Architecture
- **API Routes**: Next.js API routes in `app/api/` directory
- **Authentication**: Google OAuth with cookie-based sessions
- **Database**: PostgreSQL via Drizzle ORM (`db/db.ts`, `db/schema.ts`)
- **Schema Push**: `drizzle-kit push` for schema management

## Database Schema (db/schema.ts)
- **users**: id, email, name, googleId, tier (free/paid), coins, weeklyXP, streak, role, schoolId, region
- **schools**: id, name, logo, banner, subscriptionStatus
- **classrooms**: id, schoolId, name, teacherId
- **classroomStudents**: classroomId, studentId (junction table)
- **schoolInvites**: code, schoolId, classroomId, role, expiresAt
- **userProgress**: userId, completedLetters, completedChapters, badges
- **userFavorites**: userId, kuralIds
- **waitlist**: email, createdAt
- **avatars**: id, name, description, price, imageUrl, isPremiumOnly
- **userAvatars**: userId, avatarId (junction table)

## SEO Architecture
- **Server-Side Rendering**: All 1330+ kural pages render complete HTML server-side
- **Metadata**: Dynamic generateMetadata() for per-page titles, descriptions, Open Graph
- **Structured Data**: JSON-LD schema for LearningResource, VideoObject, AudioObject
- **Sitemap**: Dynamic sitemap.ts generating XML with all kural URLs
- **Robots**: Dynamic robots.ts with Googlebot-specific rules
- **URL Structure**: Clean URLs like /kural-learning/1

## Audio & Speech Features
- **Audio Playback**: HTML5 Audio API for pronunciation recordings
- **Speech Recognition**: Web Speech API for pronunciation practice (desktop only)
- **Pronunciation Scoring**: Levenshtein distance algorithm
- **Language Support**: Tamil (ta-IN) and English (en-US) locales

## Environment Variables
- **DATABASE_URL**: PostgreSQL connection string (Replit managed)
- **GOOGLE_CLIENT_ID**: Google OAuth client ID
- **GOOGLE_CLIENT_SECRET**: Google OAuth client secret
- **SESSION_SECRET**: Cookie session encryption
- **CRON_SECRET**: Weekly reset endpoint authentication
- **STRIPE_SECRET_KEY**: Payment processing (not yet active)

## Key Files
- `db/db.ts`: Drizzle database connection
- `db/schema.ts`: Database table definitions
- `drizzle.config.ts`: Drizzle Kit configuration
- `middleware.ts`: Domain redirect (thirukural.replit.app → learnthirukkural.com)
- `lib/kurals.ts`: Kural data fetching and caching from GitHub CSV
- `lib/badge-system.ts`: Achievement badge definitions and logic
- `lib/use-auth.tsx`: Client-side auth hook
- `lib/use-tier.tsx`: User tier/subscription hook
- `lib/features.ts`: Feature flags
- `lib/db-sync.ts`: Database sync utilities
- `components/navigation-modal.tsx`: Shared navigation modal
- `components/auth-modal.tsx`: Google sign-in modal
- `components/badge-modal.tsx`: Badge display modal

## GitHub Repository
- **URL**: https://github.com/SilaPal/LearnKural
- **Branch**: main
