# Database Schema Management & Migration System

## Overview
This document outlines a safe, git-tracked database schema management system to prevent production breakage and enable easy rollbacks.

## Current Risk
⚠️ **DANGER**: Direct schema changes to production Supabase can break the live application with no easy rollback mechanism.

## Solution: Versioned Migration System

### Directory Structure
```
supabase/
├── migrations/
│   ├── 001_initial_schema.sql
│   ├── 002_add_upscaling_fields.sql
│   ├── 003_clean_artwork_schema.sql
│   └── ...
├── rollbacks/
│   ├── 001_rollback_initial.sql
│   ├── 002_rollback_upscaling.sql
│   └── ...
├── seeds/
│   ├── test_data.sql
│   └── production_data.sql
├── schema_version.sql
└── apply_migration.js
```

## Migration Workflow

### 1. Development Changes
```bash
# Create new migration
npm run migration:create "add_user_association"
# Generates: supabase/migrations/004_add_user_association.sql

# Test locally
npm run migration:apply:local

# Commit to git
git add supabase/migrations/
git commit -m "feat: add user association to artworks"
```

### 2. Staging Deployment
```bash
# Deploy to staging environment
npm run migration:apply:staging

# Run tests
npm run test:integration

# Verify schema
npm run schema:verify:staging
```

### 3. Production Deployment
```bash
# Apply to production (with safety checks)
npm run migration:apply:production

# Automatic backup created before applying
# Rollback available if issues detected
```

### 4. Emergency Rollback
```bash
# Rollback last migration
npm run migration:rollback:production

# Rollback to specific version
npm run migration:rollback:production --to=002
```

## Safety Mechanisms

### Pre-Migration Checks
- ✅ Schema backup created automatically
- ✅ Migration tested in staging environment
- ✅ No breaking changes to existing data
- ✅ All tests pass before production apply

### Post-Migration Validation
- ✅ Application health checks pass
- ✅ Critical API endpoints respond correctly
- ✅ Data integrity verification
- ✅ Performance impact assessment

### Rollback Triggers
- ❌ Application errors increase >5%
- ❌ API response time increases >50%
- ❌ Database connection failures
- ❌ Manual rollback requested

## Migration File Format

### Forward Migration
```sql
-- Migration: 003_clean_artwork_schema
-- Description: Consolidate artwork lifecycle management
-- Author: System
-- Date: 2025-01-08

-- Check current version
DO $$
BEGIN
  IF (SELECT version FROM schema_version) != 2 THEN
    RAISE EXCEPTION 'Migration 003 requires version 2, current: %', 
      (SELECT version FROM schema_version);
  END IF;
END $$;

-- Begin transaction
BEGIN;

-- Schema changes
ALTER TABLE artworks ADD COLUMN user_id UUID REFERENCES users(id);
ALTER TABLE artworks ADD COLUMN generation_status TEXT DEFAULT 'pending';

-- Update version
UPDATE schema_version SET 
  version = 3, 
  applied_at = NOW(),
  description = 'Clean artwork schema with user association';

COMMIT;
```

### Rollback Migration
```sql
-- Rollback: 003_clean_artwork_schema
-- Description: Revert artwork lifecycle consolidation

BEGIN;

-- Revert changes
ALTER TABLE artworks DROP COLUMN IF EXISTS user_id;
ALTER TABLE artworks DROP COLUMN IF EXISTS generation_status;

-- Revert version
UPDATE schema_version SET 
  version = 2, 
  applied_at = NOW(),
  description = 'Rollback to version 2';

COMMIT;
```

## Environment Configuration

### Local Development
```env
# .env.local
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=local_key
SUPABASE_SERVICE_ROLE_KEY=local_service_key
MIGRATION_ENV=local
```

### Staging
```env
# .env.staging
SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_ANON_KEY=staging_key
SUPABASE_SERVICE_ROLE_KEY=staging_service_key
MIGRATION_ENV=staging
```

### Production
```env
# .env.production
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=prod_key
SUPABASE_SERVICE_ROLE_KEY=prod_service_key
MIGRATION_ENV=production
```

## Git Integration

### Branch Protection
- `main` branch requires PR review
- Migrations must pass CI/CD tests
- Staging deployment required before production

### Commit Message Format
```
feat(schema): add user association to artworks

- Add user_id foreign key to artworks table
- Create anonymous user function
- Add proper RLS policies
- Migration: 003_add_user_association

Closes #123
```

### CI/CD Pipeline
```yaml
# .github/workflows/schema-migration.yml
name: Schema Migration
on:
  push:
    paths: ['supabase/migrations/**']

jobs:
  test-migration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Test Migration
        run: npm run migration:test
      - name: Deploy to Staging
        run: npm run migration:apply:staging
      - name: Run Integration Tests
        run: npm run test:integration:staging
```

## Monitoring & Alerts

### Schema Change Notifications
- Slack alert when migration applied to production
- Email notification for rollbacks
- Dashboard showing current schema version across environments

### Health Monitoring
- API endpoint response time tracking
- Database query performance monitoring
- Error rate tracking post-migration

## Best Practices

### Migration Guidelines
1. **Always create rollback scripts** before forward migration
2. **Test in staging** environment first
3. **Use transactions** for atomic changes
4. **Version check** before applying migration
5. **Backup data** before destructive changes

### Naming Conventions
- Migrations: `###_descriptive_name.sql`
- Rollbacks: `###_rollback_descriptive_name.sql`
- Use semantic versioning for major schema changes

### Code Review Checklist
- [ ] Migration tested locally
- [ ] Rollback script provided
- [ ] No breaking changes to existing APIs
- [ ] Performance impact assessed
- [ ] Documentation updated

This system ensures your production database remains stable while allowing safe, trackable schema evolution.
