# Database Migration System Setup Guide

## Overview
This guide walks through setting up the PawPop database migration system for safe, version-controlled schema management.

## Prerequisites
- Supabase project with admin access
- Service role key configured in environment variables
- Node.js and npm installed locally

## Step 1: Initial Database Setup

### 1.1 Run Setup Script in Supabase Dashboard

Copy and paste the following SQL into your Supabase SQL Editor and execute:

```sql
-- ============================================
-- PawPop Database Migration System Setup
-- Run this ONCE in Supabase SQL Editor
-- ============================================

-- Create schema_version table for tracking migrations
CREATE TABLE IF NOT EXISTS schema_version (
  id SERIAL PRIMARY KEY,
  version INTEGER NOT NULL,
  description TEXT NOT NULL,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  applied_by TEXT DEFAULT 'system',
  rollback_available BOOLEAN DEFAULT true
);

-- Create exec_sql function for migration system
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result TEXT;
BEGIN
    -- Execute the SQL
    EXECUTE sql_query;
    
    -- Return success message
    result := 'SQL executed successfully';
    RETURN result;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Re-raise the exception with context
        RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$;

-- Helper functions for schema management
CREATE OR REPLACE FUNCTION get_schema_version()
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE((SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION validate_migration(required_version INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  IF get_schema_version() != required_version THEN
    RAISE EXCEPTION 'Migration requires version %, current version: %', 
      required_version, get_schema_version();
  END IF;
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial version if table is empty
INSERT INTO schema_version (version, description, applied_by)
SELECT 0, 'Migration system initialized', 'setup_script'
WHERE NOT EXISTS (SELECT 1 FROM schema_version);

-- Verify setup
SELECT 
  'Setup completed successfully!' as status,
  get_schema_version() as current_version,
  COUNT(*) as total_versions
FROM schema_version;
```

### 1.2 Verify Setup

After running the setup script, you should see:
- `status`: "Setup completed successfully!"
- `current_version`: 0
- `total_versions`: 1

## Step 2: Environment Configuration

### 2.1 Update .env.local

Ensure your `.env.local` file contains:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Migration Environment (local/staging/production)
MIGRATION_ENV=development
```

### 2.2 Install Dependencies

```bash
npm install @supabase/supabase-js dotenv
```

## Step 3: Test Migration System

### 3.1 Check Migration Status

```bash
npm run migration:status
```

Expected output:
```
📋 Migration Status (Current: v0)
──────────────────────────────────────────────────
⏳ Pending 001_initial_schema.sql
⏳ Pending 002_add_user_tracking.sql
──────────────────────────────────────────────────
```

### 3.2 Apply Initial Migration

```bash
npm run migration:apply 001_initial_schema.sql
```

### 3.3 Verify Migration Applied

```bash
npm run migration:status
```

Expected output:
```
📋 Migration Status (Current: v1)
──────────────────────────────────────────────────
✅ Applied 001_initial_schema.sql
⏳ Pending 002_add_user_tracking.sql
──────────────────────────────────────────────────
```

## Step 4: Development Workflow

### 4.1 Creating New Migrations

```bash
npm run migration:create "add user preferences"
```

This creates:
- `supabase/migrations/003_add_user_preferences.sql`
- `supabase/rollbacks/003_rollback_add_user_preferences.sql`

### 4.2 Applying Migrations

```bash
# Apply specific migration
npm run migration:apply 003_add_user_preferences.sql

# Check health after migration
npm run migration:health
```

### 4.3 Rolling Back

```bash
# Rollback last migration
npm run migration:rollback

# Rollback to specific version
npm run migration:rollback 1
```

## Step 5: Production Deployment

### 5.1 Staging Environment

1. Set up staging Supabase project
2. Run setup script in staging
3. Configure staging environment variables:

```env
MIGRATION_ENV=staging
SUPABASE_STAGING_URL=your_staging_url
SUPABASE_STAGING_SERVICE_KEY=your_staging_key
```

4. Test migrations in staging:

```bash
MIGRATION_ENV=staging npm run migration:apply 001_initial_schema.sql
```

### 5.2 Production Environment

1. Ensure all migrations tested in staging
2. Configure production environment variables
3. Use CI/CD pipeline for automated deployment
4. Monitor health checks post-deployment

## Troubleshooting

### Common Issues

**1. "Could not find the function exec_sql"**
- Solution: Run the setup script in Supabase SQL Editor

**2. "Migration requires version X, current version: Y"**
- Solution: Apply missing migrations in order or rollback to correct version

**3. "Access denied: exec_sql requires service role"**
- Solution: Verify SUPABASE_SERVICE_ROLE_KEY is correctly set

**4. Migration fails with syntax error**
- Solution: Test SQL in Supabase SQL Editor first
- Check for proper transaction blocks (BEGIN/COMMIT)

### Health Checks

```bash
# Test database connectivity
npm run migration:health

# Check current schema version
npm run migration:status

# Verify migration history
```

Query in Supabase:
```sql
SELECT * FROM schema_version ORDER BY applied_at DESC;
```

## Security Considerations

1. **Service Role Key**: Keep service role keys secure and rotate regularly
2. **Migration Review**: All migrations must be code-reviewed before production
3. **Backup Strategy**: Automatic backups created before production migrations
4. **Rollback Testing**: Test rollback scripts in staging environment

## Monitoring

Set up alerts for:
- Migration deployment notifications
- Schema version mismatches across environments
- Failed migration attempts
- Post-migration health check failures

## Next Steps

1. Set up staging environment
2. Configure CI/CD pipeline
3. Establish monitoring and alerting
4. Train team on migration workflow
5. Document schema change procedures

---

**⚠️ Important**: Always test migrations in staging before production deployment. The migration system includes safety checks, but careful testing prevents production issues.
