# ⚠️ IMPORTANT: Apply Migration 019

## Issue Found
During testing, we discovered a type mismatch in the `get_artworks_needing_reminders()` function. The function returns `UUID` but declares `TEXT` for the `artwork_id` column.

## Error Message
```
structure of query does not match function result type
Returned type uuid does not match expected type text in column 1.
```

## Fix Required
Apply migration 019 to cast the UUID to TEXT.

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/019_fix_reminder_function_type.sql`
3. Paste and run

### Option 2: Copy-Paste SQL

```sql
-- Migration: Fix get_artworks_needing_reminders function type mismatch
-- Description: Cast UUID to TEXT for artwork_id return value

CREATE OR REPLACE FUNCTION get_artworks_needing_reminders(
  hours_since_capture INTEGER DEFAULT 24,
  max_reminders INTEGER DEFAULT 3
)
RETURNS TABLE (
  artwork_id TEXT,
  customer_email TEXT,
  customer_name TEXT,
  email_captured_at TIMESTAMPTZ,
  upload_reminder_count INTEGER,
  upload_token TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id::TEXT,  -- Cast UUID to TEXT
    a.customer_email,
    a.customer_name,
    a.email_captured_at,
    a.upload_reminder_count,
    a.upload_token
  FROM artworks a
  WHERE a.upload_deferred = true
    AND a.generation_step = 'pending'
    AND a.upload_reminder_count < max_reminders
    AND (
      -- First reminder: 24 hours after capture
      (a.upload_reminder_count = 0 AND a.email_captured_at < NOW() - (hours_since_capture || ' hours')::INTERVAL)
      OR
      -- Subsequent reminders: 48 hours after last reminder
      (a.upload_reminder_count > 0 AND a.upload_reminder_sent_at < NOW() - INTERVAL '48 hours')
    )
  ORDER BY a.email_captured_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_artworks_needing_reminders(INTEGER, INTEGER) TO authenticated;
```

## Verification

After applying, run:
```bash
node scripts/test-reminder-function.js
```

Should output:
```
✅ Function works!
   Found 0 artworks needing reminders
   No artworks need reminders at this time.
```

## Then Test Full Flow

```bash
LOCAL_TEST=true npm run reminders:check
```

Should output:
```
✅ Cron job completed successfully
```
