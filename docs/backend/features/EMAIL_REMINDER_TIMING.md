# Email Reminder Timing & Logic

## ⏰ **Email Schedule**

### **Timeline Overview**
```
Day 0, Hour 0:  User enters email, clicks "Upload Later"
                → Confirmation email sent immediately
                
Day 1, Hour 0:  First reminder (24 hours after email capture)
                → "Reminder: Complete Your PawPop Order"
                
Day 3, Hour 0:  Second reminder (48 hours after first reminder)
                → "Action Required: Upload Photos to Complete Order"
                
Day 5, Hour 0:  Final reminder (48 hours after second reminder)
                → "Final Notice: Complete Your PawPop Order"
                
Day 7+:         No more reminders (max 3 reached)
```

### **Detailed Timing**

**Confirmation Email:**
- **Trigger:** User clicks "I'll Upload Later"
- **Timing:** Immediate
- **Subject:** "Action Required: Complete Your PawPop Order"
- **Content:** Upload link, order details, what to expect

**Reminder #1:**
- **Trigger:** 24 hours after email capture
- **Condition:** `upload_deferred = true AND generation_step = 'pending'`
- **Subject:** "Reminder: Complete Your PawPop Order"
- **Content:** Order status, time to complete, processing time

**Reminder #2:**
- **Trigger:** 48 hours after Reminder #1 sent
- **Condition:** `upload_deferred = true AND generation_step = 'pending'`
- **Subject:** "Action Required: Upload Photos to Complete Order"
- **Content:** Order incomplete status, link expiration notice

**Reminder #3 (Final):**
- **Trigger:** 48 hours after Reminder #2 sent
- **Condition:** `upload_deferred = true AND generation_step = 'pending'`
- **Subject:** "Final Notice: Complete Your PawPop Order"
- **Content:** Order expiring warning, 48-hour expiration

---

## 🛑 **Stop Logic: YES, Emails Stop When User Uploads**

### **How It Works**

The reminder system has **built-in stop logic** that prevents emails after upload:

```sql
-- From get_artworks_needing_reminders function
WHERE a.upload_deferred = true
  AND a.generation_step = 'pending'  -- ← THIS STOPS EMAILS
  AND a.upload_reminder_count < max_reminders
```

### **What Happens When User Uploads**

**Step 1: User Clicks Upload Link**
```
User visits: /upload/{token}
```

**Step 2: User Uploads Photos**
```
Photos uploaded → Generation starts
```

**Step 3: Generation Step Changes**
```sql
UPDATE artworks 
SET generation_step = 'monalisa_generation'  -- No longer 'pending'
WHERE id = artwork_id;
```

**Step 4: Upload Deferred Flag Cleared**
```sql
-- Called by complete_deferred_upload()
UPDATE artworks
SET 
  upload_deferred = false,  -- ← Stops reminders
  upload_completed_at = NOW(),
  updated_at = NOW()
WHERE id = artwork_id;
```

**Step 5: Reminder Query Excludes This Artwork**
```
Next cron job runs → Query finds 0 artworks with:
- upload_deferred = true (now false ✅)
- generation_step = 'pending' (now 'monalisa_generation' ✅)

Result: No more reminder emails sent! 🎉
```

---

## 📊 **Database Logic**

### **Conditions That STOP Reminders**

An artwork will **NOT** receive reminders if:

1. ✅ `upload_deferred = false` (user uploaded)
2. ✅ `generation_step != 'pending'` (generation started)
3. ✅ `upload_reminder_count >= 3` (max reminders reached)
4. ✅ `upload_completed_at IS NOT NULL` (upload completed)

### **Conditions That CONTINUE Reminders**

An artwork will receive reminders if:

1. ❌ `upload_deferred = true` (still waiting)
2. ❌ `generation_step = 'pending'` (no upload yet)
3. ❌ `upload_reminder_count < 3` (under limit)
4. ❌ Timing conditions met (24h, 48h, 48h)

---

## 🔄 **Cron Job Execution**

### **Frequency**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/email/upload-reminder?send=true",
    "schedule": "0 */6 * * *"  // Every 6 hours
  }]
}
```

### **Why Every 6 Hours?**

- **Catches all timing windows:** 24h, 48h intervals
- **Not too frequent:** Avoids spam
- **Not too slow:** Timely reminders
- **Optimal balance:** Between responsiveness and resource usage

### **Example Execution**

```
12:00 AM - Cron runs, finds 0 artworks needing reminders
06:00 AM - Cron runs, finds 1 artwork (24h passed), sends Reminder #1
12:00 PM - Cron runs, finds 0 artworks needing reminders
06:00 PM - Cron runs, finds 0 artworks needing reminders
12:00 AM - Cron runs, finds 0 artworks needing reminders
...
(48 hours later)
06:00 AM - Cron runs, finds 1 artwork (48h passed), sends Reminder #2
```

---

## 🎯 **User Experience Examples**

### **Example 1: User Uploads After First Reminder**

```
Day 0, 12:00 PM: Email captured → Confirmation sent
Day 1, 12:00 PM: Reminder #1 sent
Day 1, 03:00 PM: User uploads photos ✅
Day 1, 03:00 PM: generation_step = 'monalisa_generation'
Day 1, 03:00 PM: upload_deferred = false

Day 3, 12:00 PM: Cron runs → Finds 0 artworks (upload_deferred = false)
                 → No Reminder #2 sent ✅
```

### **Example 2: User Never Uploads**

```
Day 0, 12:00 PM: Email captured → Confirmation sent
Day 1, 12:00 PM: Reminder #1 sent
Day 3, 12:00 PM: Reminder #2 sent
Day 5, 12:00 PM: Reminder #3 sent (final)
Day 7, 12:00 PM: Cron runs → Finds 0 artworks (max reminders = 3)
                 → No more reminders ✅
```

### **Example 3: User Uploads Immediately**

```
Day 0, 12:00 PM: Email captured → Confirmation sent
Day 0, 12:05 PM: User uploads photos ✅
Day 0, 12:05 PM: upload_deferred = false

Day 1, 12:00 PM: Cron runs → Finds 0 artworks (upload_deferred = false)
                 → No Reminder #1 sent ✅
```

---

## 🔧 **Implementation Details**

### **Key Functions**

**1. get_artworks_needing_reminders()**
```sql
-- Only returns artworks that:
-- 1. Have upload_deferred = true
-- 2. Have generation_step = 'pending'
-- 3. Haven't reached max reminders (3)
-- 4. Meet timing conditions (24h, 48h, 48h)
```

**2. complete_deferred_upload()**
```sql
-- Called when user uploads photos
-- Sets upload_deferred = false
-- Sets upload_completed_at = NOW()
-- This STOPS all future reminders
```

**3. mark_reminder_sent()**
```sql
-- Increments upload_reminder_count
-- Updates upload_reminder_sent_at
-- Used for timing next reminder
```

---

## 📈 **Monitoring Queries**

### **Check Reminder Status**
```sql
SELECT 
  customer_email,
  email_captured_at,
  upload_reminder_count,
  upload_reminder_sent_at,
  upload_deferred,
  generation_step,
  upload_completed_at
FROM artworks
WHERE upload_deferred = true
ORDER BY email_captured_at DESC;
```

### **See Who Will Get Reminders Next**
```sql
SELECT * FROM get_artworks_needing_reminders(24, 3);
```

### **Reminder Effectiveness**
```sql
SELECT 
  upload_reminder_count,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE upload_completed_at IS NOT NULL) as completed,
  ROUND(100.0 * COUNT(*) FILTER (WHERE upload_completed_at IS NOT NULL) / COUNT(*), 2) as completion_rate
FROM artworks
WHERE upload_deferred = true
GROUP BY upload_reminder_count
ORDER BY upload_reminder_count;
```

---

## ✅ **Summary**

**Email Timing:**
- ✅ Confirmation: Immediate
- ✅ Reminder #1: 24 hours after email capture
- ✅ Reminder #2: 48 hours after Reminder #1
- ✅ Reminder #3: 48 hours after Reminder #2 (final)

**Stop Logic:**
- ✅ **YES, emails automatically stop when user uploads**
- ✅ Triggered by `upload_deferred = false`
- ✅ Triggered by `generation_step != 'pending'`
- ✅ Maximum 3 reminders total
- ✅ No manual intervention needed

**Cron Schedule:**
- ✅ Runs every 6 hours
- ✅ Checks for artworks needing reminders
- ✅ Sends emails automatically
- ✅ Configured in vercel.json

**User Experience:**
- ✅ Timely reminders without spam
- ✅ Automatic stop when action taken
- ✅ Clear communication at each step
- ✅ Professional, transactional tone

The system is **smart** and **automatic** - it knows when to send reminders and when to stop! 🎉
