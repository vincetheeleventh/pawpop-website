# 🚀 Meta Pixel Setup - Quick Start

## Your New Pixel ID: 828833546257064

---

## ✅ Step 1: Get Access Token (Do This Now)

Since you're the Admin of your new Business Portfolio, you can now generate the Access Token:

1. Go to: https://business.facebook.com/events_manager2
2. Select your Pixel: **828833546257064**
3. Click **Settings** tab (left sidebar)
4. Scroll to **Conversions API** section
5. Click **Generate Access Token**
6. Copy the token (starts with `EAA...`)

---

## ✅ Step 2: Add to `.env.local`

Open your `.env.local` file and add:

```bash
# Meta (Facebook) Ads Pixel & Conversions API
NEXT_PUBLIC_META_PIXEL_ID=828833546257064
META_CONVERSION_API_ACCESS_TOKEN=paste_your_token_here
META_TEST_EVENT_CODE=TEST12345
```

**Replace**:
- `paste_your_token_here` with the actual token from Step 1
- `TEST12345` with test code from Events Manager → Test Events (optional)

---

## ✅ Step 3: Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## ✅ Step 4: Test It Works

### Install Meta Pixel Helper
- Chrome Extension: https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc

### Visit Your Site
1. Go to: http://localhost:3000
2. Click Pixel Helper extension
3. Should see:
   - ✅ Green checkmark
   - Pixel ID: **828833546257064**
   - PageView event

### Test Upload Form
1. Fill out the upload form
2. Check console for: `Meta Pixel: Lead (Photo Upload) tracked`
3. Check Pixel Helper shows "Lead" event

---

## 🎯 What Gets Tracked

| Event | When | Value |
|-------|------|-------|
| PageView | Every page | - |
| Lead | Photo upload | $2 CAD |
| ViewContent | Artwork generated | $8 CAD |
| ViewContent | Artwork page view | $1 CAD |
| InitiateCheckout | "Buy Now" clicked | Cart value |
| Purchase | Payment complete | Order value |

---

## 📊 Verify in Events Manager

After testing:

1. Go to: https://business.facebook.com/events_manager2
2. Select Pixel: **828833546257064**
3. Click **Test Events** tab
4. You should see your test events appearing in real-time

---

## 🚨 Troubleshooting

### "Meta Pixel: No pixel ID provided"
- Make sure you added `NEXT_PUBLIC_META_PIXEL_ID=828833546257064` to `.env.local`
- Restart your dev server

### Events not showing in Events Manager
- Check browser console for errors
- Make sure Access Token is correct
- Try the Test Events tab (not Overview)

### "Invalid Access Token" error
- Regenerate token in Events Manager → Settings → Conversions API
- Update `.env.local` with new token
- Restart server

---

## 📚 Full Documentation

For complete setup guide including:
- iOS 14.5+ Aggregated Event Measurement
- Campaign setup instructions
- Custom conversions
- Advanced troubleshooting

See: `/docs/marketing/META_CONVERSIONS_API_SETUP_GUIDE.md`

---

**Status**: Ready to activate with your new Pixel ID!  
**Next**: Get your Access Token and add to `.env.local`
