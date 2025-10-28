# Shtuu Studio - Testing Guide

## ✅ Quick Test

### 1. Start Dev Server (Already Running)
```bash
# Server is running on http://localhost:3000
```

### 2. Manual Test in Browser
```bash
# Open in browser
open http://localhost:3000/shtuu
```

**Expected Flow:**
1. ✅ See "Shtuu's Studio" title
2. ✅ See Shtuu character (😌 emoji)
3. ✅ See dialogue: "Hi! I'm Shtuu..."
4. ✅ Click "🐕 Dog" button
5. ✅ See response: "I love doggies!"
6. ✅ See Shtuu change mood (😊)
7. ✅ See email input field
8. ✅ See upload zone
9. ✅ Enter email: test@example.com
10. ✅ Click upload zone or drag image
11. ✅ See upload preview
12. ✅ See generating state (🎨)

---

## 🧪 Automated Tests

### Run All Tests
```bash
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test tests/e2e/shtuu-questionnaire.spec.ts
```

### Run Single Browser
```bash
npx playwright test --project=chromium
```

### View Test Report
```bash
npx playwright show-report
```

### Debug Mode
```bash
npx playwright test --debug
```

---

## 📊 Test Coverage

### 11 Tests Created
1. ✅ Page loads correctly
2. ✅ Welcome dialogue appears
3. ✅ Dog selection works
4. ✅ Cat selection works
5. ✅ Email requirement enforced
6. ✅ Email format validation
7. ✅ Valid email accepted
8. ✅ Upload tips displayed
9. ✅ Character status updates
10. ✅ Mobile responsive
11. ✅ Session persistence

---

## 🔍 What to Check

### Visual Elements
- [ ] Shtuu character displays (emoji placeholder)
- [ ] Dialogue box has speech bubble tail
- [ ] Buttons have hover effects
- [ ] Upload zone highlights on drag
- [ ] Email input has border styling

### Functionality
- [ ] Dialogue advances on button click
- [ ] Character mood changes (emoji changes)
- [ ] Email validation works
- [ ] File upload shows preview
- [ ] Error messages display correctly

### Responsive
- [ ] Works on mobile (375px width)
- [ ] Works on tablet (768px width)
- [ ] Works on desktop (1440px width)

---

## 🐛 Troubleshooting

### Tests Not Running?
```bash
# Install Playwright browsers
npx playwright install

# Or just chromium
npx playwright install chromium
```

### Dev Server Not Starting?
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Restart
npm run dev
```

### Database Issues?
```bash
# Migration was already applied via MCP ✅
# Check Supabase dashboard to verify dialogue_sessions table exists
```

---

## 📸 Screenshots

Tests automatically capture screenshots on failure:
- Location: `test-results/`
- View in HTML report: `npx playwright show-report`

---

## ✅ Success Criteria

All tests should pass with:
- ✅ Green checkmarks in terminal
- ✅ 0 failed tests
- ✅ HTML report shows all passed
- ✅ No console errors in browser

---

## 🚀 Next Steps After Testing

1. ✅ **Migration applied** via Supabase MCP
2. ✅ **Components built** and functional
3. ✅ **Upload integration** complete
4. ⏳ **Tests running** (Playwright)
5. 🎯 **Next:** Connect to fal.ai generation

**You're ready to add image generation next!** 🎨
