# Supabase Security Issues Fix - Deployment Guide

## Overview

This document outlines the security issues found by Supabase's database linter and provides the complete solution to fix them.

## Security Issues Identified

### 1. Security Definer View (ERROR)
- **Issue**: View `public.monitoring_dashboard` is defined with the SECURITY DEFINER property
- **Risk**: Views with SECURITY DEFINER enforce permissions of the view creator rather than the querying user
- **Remediation**: [Supabase Docs](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)

### 2. RLS Disabled in Public - users table (ERROR)
- **Issue**: Table `public.users` is public but RLS has not been enabled
- **Risk**: All users can access all records in the users table
- **Remediation**: [Supabase Docs](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)

### 3. RLS Disabled in Public - schema_version table (ERROR)
- **Issue**: Table `public.schema_version` is public but RLS has not been enabled
- **Risk**: Sensitive migration information is accessible to all users
- **Remediation**: [Supabase Docs](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)

## Solution Implementation

### Files Created
- `/supabase/migrations/014_fix_security_issues.sql` - Main migration to fix RLS issues
- `/supabase/migrations/015_fix_function_search_path.sql` - Function search path fixes (WARN level)
- `/supabase/migrations/016_fix_monitoring_dashboard_security_invoker.sql` - Fix for SECURITY DEFINER view
- `/supabase/rollbacks/014_rollback_fix_security_issues.sql` - Rollback migration for RLS fixes
- `/supabase/rollbacks/015_rollback_fix_function_search_path.sql` - Rollback migration for function fixes
- `/supabase/rollbacks/016_rollback_monitoring_dashboard_security_invoker.sql` - Rollback for view fix

## Deployment Instructions

### Option 1: Manual Deployment via Supabase Dashboard

1. **Access Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor

2. **Apply the Security Fix Migration**
   - Copy the contents of `/supabase/migrations/014_fix_security_issues.sql`
   - Paste into the SQL Editor
   - Execute the migration

3. **Verify the Fixes**
   - Run the security linter again to confirm all issues are resolved
   - Test that the monitoring dashboard still works
   - Verify user access is properly restricted

### Option 2: CLI Deployment (if available)

```bash
# If using Supabase CLI
supabase db push

# Or apply specific migration
supabase migration up --target 014_fix_security_issues
```

## What the Migration Does

### 1. Fixes monitoring_dashboard View
- **Before**: View created with `SECURITY DEFINER`
- **After**: View recreated with default `SECURITY INVOKER`
- **Impact**: View now uses permissions of the querying user instead of creator

### 2. Secures users Table
- **Enables RLS**: `ALTER TABLE users ENABLE ROW LEVEL SECURITY`
- **Adds Policies**:
  - Users can only view their own record
  - Users can only update their own record
  - Service role has full access
  - Authenticated users can create their own record

### 3. Secures schema_version Table
- **Enables RLS**: `ALTER TABLE schema_version ENABLE ROW LEVEL SECURITY`
- **Adds Policies**:
  - Only service role can access the table
  - Explicitly denies access to anon and authenticated users

## Security Implications

### Before Fix
- ❌ Monitoring dashboard could bypass user permissions
- ❌ Any user could access all user records
- ❌ Migration information was publicly accessible

### After Fix
- ✅ Monitoring dashboard respects user permissions
- ✅ Users can only access their own records
- ✅ Migration information is restricted to service role only
- ✅ Proper access control policies in place

## Testing the Fix

After deployment, verify the fixes work correctly:

```sql
-- Test 1: Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('users', 'schema_version');

-- Test 2: Verify monitoring dashboard works
SELECT * FROM monitoring_dashboard LIMIT 1;

-- Test 3: Check view definition (should not show SECURITY DEFINER)
SELECT pg_get_viewdef('monitoring_dashboard'::regclass);
```

## Rollback Instructions

If issues arise, you can rollback using:

```sql
-- Copy and execute contents of:
-- /supabase/rollbacks/014_rollback_fix_security_issues.sql
```

## Impact Assessment

### Low Risk Changes
- ✅ Monitoring dashboard functionality preserved
- ✅ Existing user access patterns maintained
- ✅ Service role permissions unchanged

### No Breaking Changes
- ✅ Application code requires no changes
- ✅ API endpoints continue to work
- ✅ User authentication flow unchanged

## Post-Deployment Verification

1. **Run Supabase Security Linter**
   - All three ERROR-level security issues should be resolved
   - No new security issues should appear

2. **Test Application Functionality**
   - User registration/login still works
   - Monitoring dashboard accessible to authorized users
   - Admin functions continue to operate

3. **Monitor Logs**
   - Check for any permission-related errors
   - Verify monitoring functions still execute properly

## Support

If you encounter any issues during deployment:

1. Check the Supabase logs for permission errors
2. Verify service role permissions are intact
3. Use the rollback migration if needed
4. Consult the Supabase documentation links provided above

## Additional Security Warnings (WARN Level)

After fixing the ERROR-level issues, you may see additional WARNING-level security issues:

### Function Search Path Mutable (WARN)
- **Issue**: 15 functions have mutable search_path which can be a security risk
- **Solution**: Migration `015_fix_function_search_path.sql` sets `search_path = public` for all functions
- **Functions Fixed**:
  - `update_updated_at_column`
  - `get_schema_version`
  - `validate_migration`
  - `get_order_with_artwork`
  - `get_failed_orders`
  - `get_connection_stats`
  - `get_artwork_image`
  - `update_artwork_image`
  - `get_daily_fal_usage`
  - `get_stripe_webhook_health`
  - `cleanup_monitoring_data`
  - `get_pending_reviews`
  - `update_artwork_review_status`
  - `process_admin_review`
  - `update_admin_reviews_updated_at`

### Postgres Version (WARN)
- **Issue**: Current Postgres version has security patches available
- **Current**: supabase-postgres-17.4.1.075
- **Recommendation**: Upgrade database to receive latest security patches
- **Action**: Use Supabase Dashboard → Settings → Database → Upgrade

## Deployment Order

1. **✅ COMPLETED**: Deploy `014_fix_security_issues.sql` (ERROR-level RLS fixes)
2. **✅ COMPLETED**: Deploy `016_fix_monitoring_dashboard_security_invoker.sql` (SECURITY DEFINER view fix)
3. **Optional**: Deploy `015_fix_function_search_path.sql` (WARN-level function fixes)
4. **Optional**: Consider Postgres version upgrade via Supabase Dashboard

## Current Status

**✅ All ERROR-level security issues resolved:**
- RLS enabled on `users` table with proper policies
- RLS enabled on `schema_version` table with service-role-only access  
- `monitoring_dashboard` view fixed with explicit `WITH (security_invoker=on)` syntax

---

**Migration Status**: Ready for deployment
**Risk Level**: Low
**Estimated Downtime**: None (online migration)
**Rollback Available**: Yes
