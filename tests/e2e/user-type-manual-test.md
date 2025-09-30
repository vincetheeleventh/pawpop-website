# Manual Testing Guide: User Type Tracking

## 🧪 Test Checklist for User Type Tracking Implementation

### **Test 1: Email Capture Modal - UI Verification**
**Objective**: Verify the email capture modal shows correctly without name field

**Steps**:
1. Open http://localhost:3000
2. Click "Get Started" or "Create Your PawPop" button
3. Verify the modal appears

**Expected Results**:
- ✅ Email input field is visible
- ✅ Name input field is NOT visible
- ✅ "Is this a gift?" toggle is visible
- ✅ Toggle is OFF by default
- ✅ Modal has clean, simple UI

---

### **Test 2: Gift Toggle - Self-Purchaser (Default)**
**Objective**: Test email capture as self-purchaser

**Steps**:
1. Open modal (as in Test 1)
2. Enter email: `test-self@example.com`
3. Leave gift toggle OFF
4. Click "Continue" or "Submit"
5. Open browser DevTools > Console
6. Look for Plausible event logs

**Expected Results**:
- ✅ Form submits successfully
- ✅ Console shows: `user_type: 'self_purchaser'`
- ✅ Console shows: `is_gift: false`
- ✅ No name field errors

---

### **Test 3: Gift Toggle - Gifter**
**Objective**: Test email capture as gifter

**Steps**:
1. Open modal
2. Enter email: `test-gifter@example.com`
3. Click the gift toggle to turn it ON
4. Verify helper text appears: "Perfect for surprising someone special!"
5. Click "Continue"
6. Check console logs

**Expected Results**:
- ✅ Toggle turns blue/active
- ✅ Helper text is visible
- ✅ Console shows: `user_type: 'gifter'`
- ✅ Console shows: `is_gift: true`

---

### **Test 4: Toggle Interaction**
**Objective**: Verify toggle can be switched on/off

**Steps**:
1. Open modal
2. Click toggle ON → verify it's active
3. Click toggle OFF → verify it's inactive
4. Click toggle ON again
5. Verify helper text appears/disappears

**Expected Results**:
- ✅ Toggle switches smoothly
- ✅ Helper text shows when ON
- ✅ Helper text hides when OFF
- ✅ Visual feedback is clear

---

### **Test 5: Email Validation**
**Objective**: Verify email validation works

**Steps**:
1. Open modal
2. Leave email empty, click Continue
3. Verify error message
4. Enter invalid email: `notanemail`
5. Click Continue
6. Verify error message

**Expected Results**:
- ✅ Shows "Email is required" error
- ✅ Shows "Invalid email" error
- ✅ Form doesn't submit with invalid data

---

### **Test 6: Plausible Analytics Tracking**
**Objective**: Verify Plausible events are tracked

**Steps**:
1. Open DevTools > Network tab
2. Filter by "event" or "plausible"
3. Complete email capture as gifter
4. Check network requests

**Expected Results**:
- ✅ POST request to Plausible API
- ✅ Event name: "Email Captured"
- ✅ Props include: `user_type`, `is_gift`
- ✅ Request succeeds (200 OK)

---

### **Test 7: Google Ads Conversion Tracking**
**Objective**: Verify Google Ads conversion with correct value

**Steps**:
1. Open DevTools > Console
2. Type: `window.dataLayer` and press Enter
3. Complete email capture as gifter
4. Check dataLayer for gtag events

**Expected Results**:
- ✅ dataLayer contains conversion event
- ✅ Conversion value = 3 (for gifter)
- ✅ OR value = 2 (for self-purchaser)
- ✅ Event includes user_type parameter

---

### **Test 8: Microsoft Clarity Tags**
**Objective**: Verify Clarity custom tags are set

**Steps**:
1. Open DevTools > Console
2. Complete email capture as gifter
3. Type: `clarity('get', 'user_type')` (if available)
4. Check console for Clarity logs

**Expected Results**:
- ✅ Clarity tag set: `user_type = 'gifter'`
- ✅ Clarity tag set: `is_gift = true`
- ✅ No JavaScript errors

---

### **Test 9: Deferred Upload Flow**
**Objective**: Test "Upload Later" option with user type

**Steps**:
1. Complete email capture as gifter
2. On upload choice screen, click "Upload Later"
3. Verify confirmation message
4. Check email inbox (if configured)

**Expected Results**:
- ✅ Shows "Check your email" message
- ✅ Email sent without name field
- ✅ Email greeting is generic: "Hello there! 👋"
- ✅ Upload link works

---

### **Test 10: Immediate Upload Flow**
**Objective**: Test "Upload Now" with user type tracking

**Steps**:
1. Complete email capture as self-purchaser
2. Click "Upload Now"
3. Upload a test pet image
4. Wait for generation
5. Check database (optional)

**Expected Results**:
- ✅ Upload works smoothly
- ✅ Generation completes
- ✅ user_type stored in database
- ✅ No name-related errors

---

### **Test 11: Email Templates**
**Objective**: Verify emails work without name

**Steps**:
1. Complete full flow (email → upload → generation)
2. Check email inbox for:
   - Email capture confirmation
   - Masterpiece creating email
   - Masterpiece ready email
3. Verify greetings

**Expected Results**:
- ✅ All emails received
- ✅ Greetings are: "Hello there! 👋" or "Hello!"
- ✅ No blank spaces where name would be
- ✅ Content reads naturally

---

### **Test 12: Database Verification**
**Objective**: Verify user_type is stored in database

**Steps**:
1. Complete email capture
2. Go to Supabase Dashboard
3. Open "artworks" table
4. Find your test record
5. Check user_type column

**Expected Results**:
- ✅ user_type column exists
- ✅ Value is 'gifter' or 'self_purchaser'
- ✅ customer_name is empty or null
- ✅ email_captured_at is set

---

## 📊 Analytics Verification

### **Check Plausible Dashboard**
1. Go to Plausible Analytics dashboard
2. Look for "Email Captured" events
3. Check custom properties for user_type
4. Verify event counts

### **Check Google Ads**
1. Go to Google Ads dashboard
2. Navigate to Conversions
3. Look for email capture conversions
4. Verify conversion values ($2 vs $3)

### **Check Microsoft Clarity**
1. Go to Clarity dashboard
2. Find recent sessions
3. Check custom tags for user_type
4. Watch session recordings

---

## 🐛 Common Issues & Solutions

### **Issue**: Modal doesn't open
**Solution**: Check console for JavaScript errors, verify React components loaded

### **Issue**: Toggle doesn't work
**Solution**: Check that useState is working, verify event handlers attached

### **Issue**: Analytics not tracking
**Solution**: Verify environment variables set, check network tab for API calls

### **Issue**: Email validation not working
**Solution**: Check form validation logic, verify error messages display

### **Issue**: Database not storing user_type
**Solution**: Verify migration applied, check API payload includes user_type

---

## ✅ Success Criteria

All tests should pass with:
- ✅ No name field visible
- ✅ Gift toggle works smoothly
- ✅ Analytics tracking all platforms
- ✅ Emails work without name
- ✅ Database stores user_type
- ✅ No JavaScript errors
- ✅ Clean, intuitive UX

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Test 1: Email Modal UI           [ ] Pass [ ] Fail
Test 2: Self-Purchaser Flow       [ ] Pass [ ] Fail
Test 3: Gifter Flow               [ ] Pass [ ] Fail
Test 4: Toggle Interaction        [ ] Pass [ ] Fail
Test 5: Email Validation          [ ] Pass [ ] Fail
Test 6: Plausible Tracking        [ ] Pass [ ] Fail
Test 7: Google Ads Tracking       [ ] Pass [ ] Fail
Test 8: Clarity Tags              [ ] Pass [ ] Fail
Test 9: Deferred Upload           [ ] Pass [ ] Fail
Test 10: Immediate Upload         [ ] Pass [ ] Fail
Test 11: Email Templates          [ ] Pass [ ] Fail
Test 12: Database Storage         [ ] Pass [ ] Fail

Notes:
_________________________________
_________________________________
_________________________________
```
