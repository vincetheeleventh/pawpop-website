# Database Environment Setup Guide

## Environment Strategy

### 1. Production Database
- **What**: Your live Supabase project
- **When**: Only for final deployments via migration system
- **Access**: Read-only for development, write-only via migrations

### 2. Local Development Database
You have two options for local development:

#### Option A: Supabase Local (Recommended)
```bash
# Install Supabase CLI
npm install -g supabase

# Initialize local Supabase
supabase init

# Start local development stack
supabase start

# This creates:
# - Local PostgreSQL database
# - Local Supabase API
# - Local Auth service
# - Local Storage
```

#### Option B: Separate Supabase Project
- Create a new Supabase project for development
- Use different environment variables
- More expensive but simpler setup

### 3. Staging Database (Optional)
- Separate Supabase project that mirrors production
- Used for final testing before production deployment

## Recommended Setup: Supabase Local

### Installation Steps
```bash
# 1. Install Supabase CLI
npm install -g supabase

# 2. Login to Supabase (for project linking)
supabase login

# 3. Initialize in your project
cd /path/to/pawpop-website
supabase init

# 4. Link to your production project (for schema sync)
supabase link --project-ref YOUR_PROJECT_ID

# 5. Pull current schema from production
supabase db pull

# 6. Start local development
supabase start
```

### Local Environment URLs
After `supabase start`, you'll get:
```
API URL: http://localhost:54321
GraphQL URL: http://localhost:54321/graphql/v1
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
Inbucket URL: http://localhost:54324
JWT secret: your-super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJ0eXAiOiJKV1Q...
service_role key: eyJ0eXAiOiJKV1Q...
```

## Environment Configuration

### .env.local (Local Development)
```env
# Local Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJ0eXAiOiJKV1Q... # from supabase start output
SUPABASE_SERVICE_ROLE_KEY=eyJ0eXAiOiJKV1Q... # from supabase start output

# Migration environment
MIGRATION_ENV=local

# Local development flags
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NODE_ENV=development
```

### .env.staging (Staging Environment)
```env
# Staging Supabase project
SUPABASE_URL=https://your-staging-project.supabase.co
SUPABASE_ANON_KEY=staging_anon_key
SUPABASE_SERVICE_ROLE_KEY=staging_service_key

MIGRATION_ENV=staging
NEXT_PUBLIC_BASE_URL=https://staging.pawpopart.com
```

### .env.production (Production)
```env
# Production Supabase project
SUPABASE_URL=https://your-prod-project.supabase.co
SUPABASE_ANON_KEY=prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_key

MIGRATION_ENV=production
NEXT_PUBLIC_BASE_URL=https://pawpopart.com
```

## Development Workflow

### Daily Development
```bash
# 1. Start local database
supabase start

# 2. Run your Next.js app
npm run dev

# 3. Make schema changes via migrations
npm run migration:create "add new field"
npm run migration:apply:local 002_add_new_field.sql

# 4. Test your changes locally
# Your app connects to localhost:54321

# 5. Stop when done
supabase stop
```

### Schema Iteration Process
```bash
# Create migration
npm run migration:create "experiment with new schema"

# Edit the migration file
# Apply locally
npm run migration:apply:local 002_experiment.sql

# Test in your app
npm run dev

# If you need to iterate:
npm run migration:rollback  # Undo changes
# Edit migration file
npm run migration:apply:local 002_experiment.sql  # Try again

# When satisfied, commit to git
git add supabase/migrations/
git commit -m "feat: experiment with new schema"
```

## Data Management

### Seeding Local Database
```bash
# Create seed data
echo "INSERT INTO artworks (customer_name, customer_email, ...) VALUES (...);" > supabase/seed.sql

# Apply seeds
supabase db reset  # Resets to migrations + seeds
```

### Syncing with Production Schema
```bash
# Pull latest schema from production
supabase db pull

# This updates your local migrations to match production
# Useful when other developers make changes
```

## Testing Strategy

### Unit Tests
- Run against local database
- Fast iteration
- Isolated test data

### Integration Tests  
- Run against local database with seed data
- Test complete workflows
- Safe to reset/cleanup

### Staging Tests
- Final validation before production
- Real-world data volumes
- Performance testing

## Benefits of This Setup

✅ **Safe Iteration**: Local database you can break/reset
✅ **Fast Development**: No network latency
✅ **Offline Work**: Database runs locally
✅ **Cost Effective**: No extra Supabase projects needed
✅ **Production Parity**: Same PostgreSQL version and features
✅ **Easy Reset**: `supabase db reset` starts fresh

## Troubleshooting

### Common Issues
```bash
# Port conflicts
supabase stop
supabase start

# Schema out of sync
supabase db pull
supabase db reset

# Migration issues
npm run migration:status
npm run migration:rollback
```

This setup gives you a safe playground to iterate on schema changes without touching production.
