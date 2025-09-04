# Local Supabase Setup with Docker

This guide walks you through setting up a local Supabase instance for testing PawPop without affecting production data.

## Prerequisites

✅ **Completed:**
- Supabase CLI installed via Homebrew
- Docker Desktop installed
- Supabase project initialized

## Next Steps

### 1. Start Docker Desktop
```bash
# Open Docker Desktop application
open /Applications/Docker.app

# Wait for Docker to start (you'll see the whale icon in your menu bar)
# Then verify Docker is running:
docker --version
```

### 2. Start Local Supabase
```bash
# This will download and start all Supabase services locally
supabase start

# Expected output:
# Started supabase local development setup.
# 
#          API URL: http://localhost:54321
#      GraphQL URL: http://localhost:54321/graphql/v1
#           DB URL: postgresql://postgres:postgres@localhost:54322/postgres
#       Studio URL: http://localhost:54323
#     Inbucket URL: http://localhost:54324
#       JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
#         anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Apply Your Database Schema
```bash
# Copy your existing schema to Supabase migrations
cp create_tables.sql supabase/migrations/20240101000000_initial_schema.sql

# Apply the migration
supabase db reset
```

### 4. Update Environment Variables

Create `.env.local.test` for local Supabase testing:

```env
# Local Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Mock external services for testing
FAL_API_KEY=mock_fal_key
STRIPE_SECRET_KEY=sk_test_mock
STRIPE_PUBLISHABLE_KEY=pk_test_mock
PRINTIFY_API_TOKEN=mock_printify_token
UPLOADTHING_SECRET=mock_uploadthing_secret
UPLOADTHING_APP_ID=mock_uploadthing_app_id
```

### 5. Update Test Configuration

Update `playwright.config.ts` to use local Supabase:

```typescript
// Load local test environment
const localTestEnvPath = path.resolve(__dirname, '.env.local.test');
dotenv.config({ path: localTestEnvPath });
```

### 6. Access Local Services

- **Supabase Studio**: http://localhost:54323 (database management UI)
- **API Endpoint**: http://localhost:54321
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres
- **Email Testing**: http://localhost:54324 (Inbucket)

## Benefits of Local Supabase

### ✅ Advantages
- **Zero cost** - no Supabase project limits
- **Complete isolation** - never affects production
- **Fast reset** - `supabase db reset` cleans everything
- **Offline development** - works without internet
- **Real Supabase behavior** - identical to production

### 🔧 Development Workflow
```bash
# Start development
supabase start
npm run dev

# Run tests against local instance
npm run test:e2e

# Reset database between test runs
supabase db reset

# Stop when done
supabase stop
```

## Database Management

### Reset Database
```bash
# Wipes all data and reapplies migrations
supabase db reset
```

### Create Migration
```bash
# Generate new migration file
supabase migration new add_new_table

# Edit the generated file in supabase/migrations/
# Then apply with:
supabase db reset
```

### Seed Test Data
```bash
# Create seed file
echo "INSERT INTO artworks (customer_email, customer_name) VALUES ('test@example.com', 'Test User');" > supabase/seed.sql

# Apply seeds after reset
supabase db reset
```

## Troubleshooting

### Docker Issues
```bash
# Check Docker is running
docker ps

# Restart Docker Desktop if needed
# Then restart Supabase
supabase stop
supabase start
```

### Port Conflicts
```bash
# If ports are in use, stop conflicting services
lsof -ti:54321 | xargs kill -9

# Or configure different ports in supabase/config.toml
```

### Schema Sync Issues
```bash
# Pull latest schema from production (if needed)
supabase db pull

# Or manually copy your create_tables.sql to migrations
```

## Production vs Local Testing

| Aspect | Production | Local Supabase |
|--------|------------|----------------|
| Cost | Paid tiers | Free |
| Data | Real customer data | Test data only |
| Performance | Optimized | Development speed |
| Isolation | Shared | Complete isolation |
| Reset | Never | Anytime |

## Next Steps

1. **Start Docker Desktop** (manual step)
2. **Run `supabase start`** 
3. **Copy the generated keys** to `.env.local.test`
4. **Apply your schema** with migrations
5. **Run tests** against local instance

This setup gives you a complete Supabase environment locally for safe testing and development.
