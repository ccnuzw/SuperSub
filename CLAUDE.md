# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SuperSub is a full-stack application built on the Cloudflare ecosystem that provides powerful and flexible proxy subscription conversion and management functionality. It allows users to aggregate, process, and distribute customized configuration files for different clients.

## High-Level Architecture

### Frontend
- Vue 3 (Composition API) with TypeScript
- Vite for development and build tooling
- Naive UI component library
- Pinia for state management
- Tailwind CSS for styling
- Vue Router for navigation

### Backend
- Cloudflare Workers with Hono framework
- D1 (SQLite-compatible) database
- KV for key-value storage
- JWT-based authentication

### Key Components
1. **Node Management**: CRUD operations for proxy nodes with health checking
2. **Subscription Management**: Import and manage remote subscription sources
3. **Profile System**: Create output configurations by combining nodes, subscriptions, and processing rules
4. **Processing Pipeline**: Apply filters, sorting, and renaming operations to nodes
5. **Template Engine**: Generate client-specific configuration files (Clash, Surge, etc.)
6. **Health Monitoring**: Test node connectivity and track latency

## Common Development Commands

### Development
```bash
# Install dependencies
npm install

# Initialize local D1 database (run on first setup or after schema changes)
npm run db:init

# Start both services simultaneously
npm run dev

# Start services individually (recommended - use two separate terminals)
npm run start:backend   # Runs wrangler pages dev on port 8789
npm run start:frontend  # Runs vite on port 5173
```

### Database
```bash
# Initialize local database (creates tables from schema.sql)
npm run db:init

# Hard reset database (if you encounter "no such table" errors)
rm -rf .wrangler
npm run db:init

# Apply migrations to production database
npx wrangler d1 execute [production-db-name] --file=./db/schema.sql
npx wrangler d1 execute [production-db-name] --file=./migrations/[migration-file].sql
```

### Build and Deployment
```bash
# Build for production (type-check + vite build)
npm run build

# Preview production build locally
npm run preview
```

## Key Files and Directories

### Backend API
- `functions/api/[[path]].ts` - Main Hono app with all route definitions
- `functions/api/routes/` - Individual route modules (auth, nodes, subscriptions, profiles, etc.)
- `functions/api/middleware/` - Custom middleware (auth, methodOverride)
- `functions/api/utils/` - Utility functions and types (Env, JWT, node parsing, etc.)
- `functions/api/lib/` - Node parsers for different protocols (ss, vmess, trojan, etc.)

### Frontend
- `src/views/` - Page components for each major feature (LoginView, HomeView, NodesView, etc.)
- `src/components/` - Reusable UI components
- `src/stores/` - Pinia stores (auth, groups, theme, nodeStatus)
- `src/router/` - Vue Router configuration
- `src/composables/` - Vue composition functions for shared logic

### Database
- `db/schema.sql` - Complete database schema with seeded data
- `migrations/` - Incremental database migration files

### Configuration
- `wrangler.toml` - Cloudflare deployment configuration (D1 bindings, env vars, compatibility flags)
- `vite.config.ts` - Vite build configuration with API proxy to backend

## Architecture Notes

### API Structure
The backend uses Hono with a centralized route pattern. All routes are prefixed with `/api`. Public routes (auth, system, public) don't require authentication. Protected routes (nodes, subscriptions, profiles) use `manualAuthMiddleware` to verify JWT tokens.

### Profile Generation Pipeline
Profiles are the core feature that combines:
1. **Data sources**: Manual nodes (via `profile_nodes`) and subscriptions (via `profile_subscriptions`)
2. **Processing rules**: Filter/rename operations from `profile_rules` table
3. **Output modes**: Local generation or external subconverter integration

### User Authentication
- JWT-based with `manualAuthMiddleware` middleware
- User data includes role-based access (user, admin, system)
- System user (`_system_`) owns global assets like default subconverter configurations

### Subscription Processing
- Supports multiple source formats (Base64, Clash, V2RayN, etc.)
- UA-based client detection via `ua_mappings` table for adaptive responses
- Subscription info parsing extracts traffic/expiration data from source URLs