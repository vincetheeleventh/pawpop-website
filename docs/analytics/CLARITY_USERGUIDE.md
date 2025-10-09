# Microsoft Clarity - Quick Start Guide

## What is Microsoft Clarity?

Microsoft Clarity is a **free** analytics tool that provides:
- 🎥 **Session Recordings** - Watch real user sessions like a movie
- 🗺️ **Heatmaps** - See where users click, scroll, and spend time
- 😤 **Rage Click Detection** - Find UX frustration points automatically
- 📊 **Zero Cost** - Completely free, unlimited recordings and users
- 🔒 **Privacy-First** - GDPR compliant, automatic PII masking

## 5-Minute Setup

### Step 1: Create Clarity Account
1. Visit [https://clarity.microsoft.com/](https://clarity.microsoft.com/)
2. Sign in with Microsoft, Google, or Facebook account
3. Click **"Add new project"**

### Step 2: Configure Project
- **Name**: PawPop
- **Website URL**: https://pawpopart.com
- Click **"Create"**
- Copy your **Project ID** (10-character code like `abc123xyz4`)

### Step 3: Add to Environment
Add to `.env.local`:
```bash
NEXT_PUBLIC_CLARITY_PROJECT_ID=abc123xyz4
```

### Step 4: Deploy
```bash
npm run build
npm run dev
```

**That's it!** Recordings start appearing in 5-10 minutes.

## View Your First Recording

1. Go to [Clarity Dashboard](https://clarity.microsoft.com/)
2. Select "PawPop" project
3. Click **"Recordings"** in left sidebar
4. Click any session to watch

## What Gets Tracked Automatically?

### ✅ Already Integrated
- **Upload Flow**: Modal opens, photo uploads, generation
- **Purchase Flow**: Product selection, checkout clicks
- **Errors**: Automatic session upgrade for debugging
- **Performance**: Slow loads and API calls flagged
- **Price Variants**: A/B test segmentation from Plausible

### 🏷️ Custom Tags Set
Every session is tagged with:
- `price_variant`: A or B (for A/B test filtering)
- `funnel_step`: Current position in conversion funnel
- `is_customer`: true for users who purchased
- `environment`: development or production

## Key Features to Try

### 1. Filter by Price Variant
**Dashboard → Recordings → Filters → Custom Tags**
- Add filter: `price_variant = A`
- Compare behavior between pricing tiers
- See if higher prices cause hesitation

### 2. Watch Upload Flow Sessions
**Dashboard → Recordings → Filters**
- Add filter: `funnel_step = upload_modal`
- Watch users upload photos
- Identify confusion points
- Optimize drag-and-drop UX

### 3. Investigate Errors
**Dashboard → Recordings → Filters**
- Add filter: `last_error_type = upload_form_error`
- Sessions auto-upgraded for priority processing
- Watch what user did before error
- Fix high-priority bugs first

### 4. View Heatmaps
**Dashboard → Heatmaps**
- Select homepage or artwork page
- View click heatmap (where users click)
- View scroll heatmap (how far users scroll)
- View attention heatmap (where users focus)

### 5. Check Insights
**Dashboard → Insights**
- **Rage Clicks**: Users clicking repeatedly (frustration)
- **Dead Clicks**: Clicks on non-interactive elements
- **Excessive Scrolling**: Users struggling to find content
- **Quick Backs**: Users immediately leaving

## Common Use Cases

### 🐛 Debug Upload Errors
```
Filter: last_error_type = upload_form_error
Action: Watch 5 sessions, identify pattern
Result: Fix most common error cause
```

### 💰 Optimize Checkout
```
Filter: funnel_step = purchase_modal
Action: Watch users selecting products
Result: Improve size selection UX
```

### 📱 Mobile UX Issues
```
Filter: Device = Mobile
Action: Watch mobile sessions
Result: Fix touch target sizes
```

### 🎯 A/B Test Insights
```
Filter: price_variant = B
Action: Compare with variant A behavior
Result: Understand pricing psychology
```

## Integration with Other Analytics

### Works Alongside Plausible
- **Plausible**: Quantitative data (numbers, counts, trends)
- **Clarity**: Qualitative data (visual behavior, UX issues)
- **Together**: Complete picture of user experience

### Works Alongside Google Ads
- **Google Ads**: Which ads convert best
- **Clarity**: Why they convert (or don't)
- **Together**: Optimize ad targeting AND landing page

## Pro Tips

### 🎯 Use Filters Liberally
Don't watch random sessions - filter by:
- Specific funnel steps
- Error types
- Price variants
- Device types
- Conversion status

### ⏱️ Watch at 2x Speed
Speed up playback to analyze more sessions quickly.
Click the speed button in the recording player.

### 📌 Bookmark Important Sessions
Found something interesting? Click the bookmark icon.
Share links with team for discussion.

### 🔄 Check Weekly
- **Monday**: Review weekend recordings
- **Friday**: Check weekly rage click trends
- **Monthly**: Analyze heatmaps after changes

### 🚀 Upgrade High-Value Sessions
Sessions are auto-upgraded when:
- User completes purchase
- User encounters error
- Performance issues detected

This ensures important sessions process first.

## Privacy & Compliance

### Automatic Privacy Protection
✅ IP addresses masked by default
✅ Input fields (email, passwords) auto-masked
✅ Payment information never recorded
✅ GDPR compliant out of the box

### Manual Masking
Add to any element containing sensitive data:
```html
<div data-clarity-mask="true">
  Sensitive content here
</div>
```

### Cookie Consent
If you implement a cookie banner:
```typescript
import { consent } from '@/lib/clarity';

// After user accepts cookies
consent();
```

## Troubleshooting

### "No recordings appearing"
- Wait 10 minutes for processing
- Check Project ID is correct in `.env.local`
- Verify site URL matches Clarity project
- Disable ad blockers when testing

### "Tags not showing"
- Check browser console for errors
- Verify `NEXT_PUBLIC_CLARITY_PROJECT_ID` is set
- Ensure environment variable doesn't have typos
- Restart development server after adding env var

### "Script not loading"
- Check browser network tab for `clarity.ms` requests
- Verify no ad blockers are active
- Check browser console for JavaScript errors
- Try in incognito mode

## Next Steps

### Week 1: Familiarize
- Watch 10-20 random sessions
- Explore heatmaps for main pages
- Check insights dashboard
- Set up filters for key flows

### Week 2: Optimize
- Focus on one pain point (e.g., upload flow)
- Watch 20+ sessions of that flow
- Identify patterns and issues
- Make improvements

### Week 3: Compare
- Filter by price variant A vs B
- Compare behavior differences
- Watch conversion vs abandonment
- Refine pricing strategy

### Ongoing: Monitor
- Weekly rage click review
- Monthly heatmap analysis
- Quarterly deep-dive on conversion funnel
- Share insights with team

## Support

- **Documentation**: [docs.microsoft.com/clarity](https://docs.microsoft.com/en-us/clarity/)
- **Setup Help**: See `CLARITY_IMPLEMENTATION.md` for detailed guide
- **Code Examples**: See `/src/lib/clarity.ts` for integration code
- **Test Suite**: Run `npm run test:clarity` to verify setup

## Summary

Microsoft Clarity adds **visual UX insights** to your analytics stack:

| Tool | Purpose | Output |
|------|---------|--------|
| **Plausible** | What happens | Numbers & trends |
| **Google Ads** | Where users come from | Conversion rates |
| **Clarity** | Why & how it happens | Visual behavior |

Together, these give you complete visibility into user experience and conversion optimization opportunities.

**Start watching sessions today!** 🎥
