# Overview

Radiology Intelligence MVP is a privacy-first web service for radiology clinics that automatically collects and processes regulatory data from FDA, CMS, and Federal Register sources. The application normalizes regulatory events, applies deterministic confidence scoring, categorizes alerts by urgency, and delivers AI-summarized notifications via email and SMS. It features a dashboard for monitoring alerts, calculating financial impact, and providing feedback to improve the system over time. All clinic-specific data remains client-side in localStorage to ensure zero PHI exposure.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React + TypeScript SPA**: Modern single-page application using React 18 with TypeScript for type safety
- **Vite Build System**: Fast development and optimized production builds with hot module replacement
- **Tailwind CSS + shadcn/ui**: Utility-first CSS framework with a comprehensive component library for consistent UI/UX
- **TanStack Query**: Robust data fetching, caching, and synchronization with automatic background updates
- **Wouter Routing**: Lightweight client-side routing for navigation between dashboard, alerts, archive, tools, and status pages
- **Client-Side Storage**: All user preferences, CPT volumes, and clinic-specific data stored in localStorage to maintain privacy

## Backend Architecture
- **Express.js API Server**: RESTful API with middleware for logging, error handling, and request processing
- **PostgreSQL Database Storage**: Neon PostgreSQL database with Drizzle ORM for type-safe database operations and schema management
- **Modular Route Handlers**: Separate endpoints for data collection (`/api/recalls`, `/api/cms-pfs`, `/api/fedreg`), utilities (`/api/send-email`, `/api/feedback`), and system status
- **Retry Logic**: Exponential backoff retry mechanism for handling upstream API failures gracefully
- **Deterministic Scoring**: Local JavaScript module for confidence scoring based on source, flags, device matches, and financial impact

## Data Processing Pipeline
- **Multi-Source Data Collection**: Automated fetching from FDA openFDA API, CMS PFS data, and Federal Register notices
- **AI-Powered Normalization**: Google Gemini AI for strict JSON normalization and pattern detection across different data sources
- **Confidence Scoring System**: Deterministic algorithm that scores events based on source credibility, device matching, manufacturer notices, and financial impact
- **Alert Categorization**: Automatic classification into Urgent (≥85 score), Informational (≥75), Digest (≥50), or Suppressed (<50)
- **Smart Summarization**: Perplexity AI generates clinic-ready 1-2 sentence summaries for actionable alerts

## Integration Layer
- **Google Gemini AI**: Data normalization and pattern detection with structured JSON output
- **Perplexity AI**: Clinical alert summarization optimized for radiology staff
- **Email Service Integration**: Configurable transactional email provider (SendGrid, Mailgun, Brevo compatible)
- **SMS Service Integration**: Optional Twilio integration for urgent alert delivery
- **FDA openFDA API**: Real-time device enforcement recall data
- **CMS Payment Data**: CPT code pricing changes and updates

# External Dependencies

## AI Services
- **Google Gemini API**: Required for data normalization and pattern detection across regulatory sources
- **Perplexity API**: Required for generating clinic-ready alert summaries

## Data Sources
- **FDA openFDA API**: Public API for device enforcement recalls and safety notices
- **CMS Payment File System**: Medicare payment schedule and CPT code updates
- **Federal Register API**: Government regulatory notices and announcements

## Communication Services
- **Email Provider**: Transactional email service (SendGrid, Mailgun, Brevo, or similar) for alert delivery
- **Twilio SMS**: Optional SMS service for urgent alert notifications

## Database & Hosting
- **PostgreSQL**: Active Neon PostgreSQL database integrated with Drizzle ORM for type-safe operations
- **DatabaseStorage Implementation**: Fully migrated from file-based storage to PostgreSQL with schema deployed (August 16, 2025)
- **Neon Database**: Serverless PostgreSQL provider for production deployment

## Development Tools
- **Replit Environment**: Development and hosting platform with integrated secrets management
- **External Cron Service**: Scheduled triggers for automated data collection (UptimeRobot, cron-job.org, or similar)