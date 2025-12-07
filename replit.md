# Discord Username Checker

## Overview

A utility web application for checking the availability of Discord usernames. The application generates potential usernames (3-character, 4-character, and semi-3-character patterns) and checks their availability through Discord's lookup API. Built with a focus on Arabic RTL layout and Material Design principles for efficient data visualization.

**Core Functionality:**
- Generate username patterns based on configurable settings (letters, numbers, length)
- Check Discord username availability in real-time via external API
- Display results in organized columns (queue, available, unavailable)
- Track session statistics and export available usernames
- Rate limiting controls to prevent API abuse

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 18 with TypeScript
- **Build Tool:** Vite for development and production builds
- **Routing:** Wouter for lightweight client-side routing
- **State Management:** React hooks (useState, useRef, useCallback) for local state
- **Data Fetching:** TanStack Query (React Query) for server state management and caching
- **UI Components:** Shadcn/ui component library with Radix UI primitives
- **Styling:** Tailwind CSS with custom design system extending base theme

**Design System:**
- RTL (Right-to-Left) layout for Arabic language support
- Typography: Cairo font for Arabic, JetBrains Mono for usernames
- Material Design dashboard patterns with card-based layouts
- Responsive breakpoints for mobile/tablet/desktop
- Dark/light theme toggle support

**Key Architectural Decisions:**
- **Component Composition:** Reusable UI components from Shadcn/ui provide consistent design language while allowing customization
- **Real-time Updates:** React Query with polling (2-second intervals when running) ensures fresh statistics without manual refresh
- **Client-side Generation:** Username generation happens in the browser to reduce server load
- **Queue Management:** Ref-based queue management prevents React re-render issues during rapid state updates

### Backend Architecture

**Runtime:** Node.js with Express.js
- **Language:** TypeScript with ES Modules
- **HTTP Server:** Express with custom logging middleware
- **Build Process:** ESBuild for server-side bundling with selective dependency bundling

**API Structure:**
- `POST /api/generate` - Generate username based on type and settings
- `POST /api/check` - Check single username availability
- `GET /api/stats` - Retrieve current session statistics
- `GET /api/checks` - Fetch all username checks
- `GET /api/checks/available` - Fetch only available usernames
- `DELETE /api/checks` - Clear all checks and reset statistics

**Storage Layer:**
- In-memory storage (`MemStorage` class) for session data
- Map-based data structures for fast lookups
- No persistence - all data is session-based
- Statistics tracking: total checks, available/unavailable counts, daily limits

**Rate Limiting:**
- Client-configurable delay between checks (1-10 seconds)
- Daily check limits (10-500 per day)
- Last-check timestamp tracking to enforce minimum intervals
- Prevents overwhelming Discord's lookup API

**Architectural Rationale:**
- **In-memory Storage:** Chosen for simplicity and speed since data doesn't need persistence across sessions. Future migration to database can be done without changing API contracts.
- **Stateless API:** Each request is independent, making the system easy to scale horizontally if needed
- **Client-side Heavy:** Offloading username generation and queue management to client reduces server load and improves responsiveness

### Data Models

**Core Schemas (Zod validation):**

```typescript
UsernameCheck {
  id: string
  username: string
  type: "three" | "four" | "semiThree"
  status: "pending" | "checking" | "available" | "taken"
  checkedAt?: string
}

CheckSettings {
  usernameTypes: array of username types
  includeLetters: boolean
  includeNumbers: boolean
  delayMs: number (1000-10000)
  dailyLimit: number (10-500)
}

SessionStats {
  totalChecks: number
  availableCount: number
  unavailableCount: number
  startTime?: string
  checksToday: number
}
```

**Schema Sharing:** Shared types between client and server via `shared/schema.ts` ensure type safety and validation consistency across the full stack.

## External Dependencies

### Third-party APIs

**Discord Lookup API:**
- Endpoint: `https://discordlookup.mesalytic.moe/v1/user/{username}`
- Purpose: Check username availability on Discord platform
- Response: 404 = available, 200 = taken, 429 = rate limited
- No authentication required
- Error handling for network failures and rate limits

### Database

**Configuration for Future Use:**
- Drizzle ORM configured with PostgreSQL dialect
- Schema location: `shared/schema.ts`
- Migration output: `./migrations`
- Database connection via `DATABASE_URL` environment variable
- **Current Status:** Database not actively used; in-memory storage handles all data

**Migration Path:** The codebase is structured to easily migrate from in-memory storage to PostgreSQL persistence by implementing the `IStorage` interface with a database-backed class.

### UI Component Libraries

**Radix UI:** Headless component primitives for accessible interactions
- Dialogs, dropdowns, tooltips, tabs, sliders, switches
- Provides accessibility features (ARIA, keyboard navigation)
- Allows complete style customization

**Shadcn/ui:** Pre-styled components built on Radix UI
- Follows "New York" design variant
- Integrated with Tailwind CSS
- Components copied into project for full customization

### Development Tools

**Replit Integration:**
- Vite plugins for runtime error overlay, cartographer, and dev banner
- Development-only features excluded from production builds
- Custom error handling and dev server setup

### Build Dependencies

**Core:**
- TypeScript for type safety across frontend and backend
- ESBuild for fast server bundling with selective dependency inclusion
- Vite for frontend development and optimized production builds

**Allowlisted Server Dependencies (bundled):** Express, Drizzle ORM, date-fns, Zod, pg, axios, nanoid - reduces cold start time by minimizing file system calls.