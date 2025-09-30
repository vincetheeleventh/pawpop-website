# Microsoft Clarity Implementation

## Overview

Microsoft Clarity has been integrated into PawPop to provide session recording, heatmaps, and UX insights. This implementation focuses on privacy-first tracking with integration into existing analytics (Plausible and Google Ads).

## Features Implemented

### 1. Core Clarity Library (`/src/lib/clarity.ts`)
- Custom tag management for session segmentation
- Event tracking for key user interactions
- Session upgrade for high-value users
- GDPR consent support
- Integration with Plausible price variant A/B testing

### 2. Clarity Script Component (`/src/components/analytics/ClarityScript.tsx`)
- Automatic script loading with Next.js Script component
- Initial tag setup with price variant from Plausible
- Environment-based configuration

### 3. Clarity Tracking Hook (`/src/hooks/useClarityTracking.ts`)
- Convenient React hook for component integration
- Funnel tracking (upload → generation → purchase)
- Interaction tracking (buttons, modals, forms)
- Performance tracking (slow loads, API calls, timeouts)
- Error tracking with session upgrade
- Automatic price variant tagging

### 4. Component Integration
- **UploadModal**: Tracks photo uploads, form submissions, errors
- **ProductPurchaseModal**: Tracks modal opens, product selection, checkout
- Automatic integration with existing Plausible tracking

## Setup Instructions

### 1. Create Clarity Project
1. Go to [Microsoft Clarity](https://clarity.microsoft.com/)
2. Sign in with Microsoft account
3. Click "Add new project"
4. Enter project details:
   - **Name**: PawPop
   - **Website URL**: https://pawpopart.com
5. Copy the **Project ID** (format: `xxxxxxxxxx`)

### 2. Configure Environment
Add to your `.env.local`:
```bash
NEXT_PUBLIC_CLARITY_PROJECT_ID=your_clarity_project_id
```

### 3. Deploy
The Clarity script is already integrated in the main layout. Once you add the project ID, tracking will start automatically.

## Privacy Configuration

### IP Masking
Clarity automatically masks IP addresses to comply with GDPR and privacy regulations.

### Sensitive Data Masking
By default, Clarity masks:
- Input fields (email, passwords, payment info)
- Text content marked with `data-clarity-mask` attribute

To explicitly mask sensitive content:
```html
<div data-clarity-mask="true">
  Sensitive content here
</div>
```

### Cookie Consent
If you implement a cookie consent banner, call:
```typescript
import { consent } from '@/lib/clarity';

// After user grants consent
consent();
```

## Custom Tags for Segmentation

### Automatic Tags Set
- `price_variant`: A or B (from Plausible A/B test)
- `variant_label`: "Standard Pricing" or "Premium Pricing"
- `environment`: development or production
- `current_page`: Current page path

### Funnel Step Tags
Tags are automatically updated as users progress:
- `funnel_step`: Current step in conversion funnel
- `upload_file_type`: Type of photo uploaded
- `selected_product_type`: Product selected for purchase
- `checkout_product_type`: Product at checkout
- `is_customer`: "true" for users who complete purchase

### Custom Tag Usage
```typescript
import { setTag, setTags } from '@/lib/clarity';

// Single tag
setTag('user_segment', 'high_value');

// Multiple tags
setTags({
  campaign: 'summer_sale',
  referral_source: 'instagram'
});
```

## Event Tracking

### Automatic Events Tracked
1. **Upload Flow**
   - `upload_modal_opened`
   - `photo_uploaded`
   - `artwork_generation_started`
   - `artwork_completed`

2. **Purchase Flow**
   - `artwork_page_viewed`
   - `purchase_modal_opened`
   - `product_selected`
   - `checkout_initiated`
   - `purchase_completed`

3. **Interactions**
   - `button_clicked`
   - `modal_opened_[name]`
   - `modal_closed_[name]`
   - `form_started`
   - `form_completed`
   - `error_occurred`

4. **Performance**
   - `slow_page_load` (>3 seconds)
   - `slow_api_call` (>5 seconds)
   - `generation_timeout`

### Custom Event Usage
```typescript
import { trackEvent } from '@/lib/clarity';

trackEvent('custom_event_name', {
  tags: {
    category: 'engagement',
    value: 'high'
  }
});
```

## Session Upgrades

Sessions are automatically upgraded (prioritized for processing) when:
- User completes artwork generation
- User initiates checkout
- User completes purchase
- Error occurs (for investigation)
- Performance issue detected

This ensures high-value and problematic sessions are processed first.

### Manual Session Upgrade
```typescript
import { upgradeSession } from '@/lib/clarity';

upgradeSession('custom_reason');
```

## Integration with Existing Analytics

### Plausible Integration
Clarity automatically receives price variant tags from Plausible:
- Filter sessions by price variant A or B
- Compare UX patterns between pricing tiers
- Identify drop-off points for each variant

### Google Ads Integration
Clarity tracks the same conversion funnel as Google Ads:
- See visual playback of converting users
- Identify UX friction before conversion
- Optimize ad landing page experience

## Dashboard Access

### View Recordings
1. Go to [Clarity Dashboard](https://clarity.microsoft.com/)
2. Select "PawPop" project
3. Click "Recordings" to view sessions
4. Filter by tags (price_variant, funnel_step, etc.)

### View Heatmaps
1. Navigate to "Heatmaps" in dashboard
2. Select page to analyze
3. View click maps, scroll maps, and attention maps

### Insights
Clarity automatically detects:
- **Rage Clicks**: Users clicking repeatedly (UX frustration)
- **Dead Clicks**: Clicks on non-interactive elements
- **Excessive Scrolling**: Users struggling to find content
- **Quick Backs**: Users immediately leaving

## Use Cases

### 1. Upload Flow Optimization
**Filter**: `funnel_step: upload_modal`
- Watch recordings of photo upload process
- Identify where users get confused
- See if compression warnings are clear
- Optimize drag-and-drop UX

### 2. Purchase Conversion Analysis
**Filter**: `funnel_step: purchase_modal`
- Watch users selecting products
- See if pricing is clear
- Identify checkout drop-off points
- Compare behavior by price variant

### 3. Error Investigation
**Filter**: `last_error_type: [error_name]`
- Sessions are auto-upgraded when errors occur
- Watch what users did before error
- Identify error patterns
- Prioritize bug fixes

### 4. A/B Test Insights
**Filter**: `price_variant: A` or `price_variant: B`
- Compare UX patterns between variants
- See if higher prices cause hesitation
- Identify different behavior patterns
- Validate quantitative results with qualitative data

### 5. Mobile UX Issues
**Filter**: Device type = Mobile
- Watch mobile user sessions
- Identify touch target issues
- See if modals work on small screens
- Optimize mobile conversion funnel

## Performance Impact

### Script Loading
- **Size**: ~45KB (minified + gzipped)
- **Loading**: Async, after interactive
- **Impact**: Minimal, loaded after page is interactive

### Recording Impact
- **CPU**: <5% overhead on client
- **Network**: Minimal, data sent in batches
- **Storage**: No local storage required

### Sampling
By default, Clarity records 100% of sessions. If needed, you can configure sampling:
- Go to Project Settings
- Adjust "Session sampling" percentage
- Recommended: 50% for high-traffic sites

## Troubleshooting

### Script Not Loading
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_CLARITY_PROJECT_ID` is set
3. Ensure ad blockers are disabled for testing
4. Check browser network tab for clarity.ms requests

### No Recordings Appearing
1. Wait 5-10 minutes for processing
2. Check Project Settings → Cookie consent (should be off for testing)
3. Verify site URL matches project configuration
4. Ensure you're not in incognito/private mode

### Tags Not Showing
1. Check browser console for tracking logs
2. Verify `clarity.isEnabled()` returns true
3. Ensure tags are set before recording starts
4. Check tag format (strings, numbers, booleans only)

## Best Practices

### 1. Use Tags Consistently
- Always tag sessions with user segment
- Tag by traffic source (ads, organic, social)
- Tag by experiment variant
- Tag by user value tier

### 2. Upgrade Important Sessions
- Upgrade on conversion events
- Upgrade on errors for debugging
- Upgrade on slow performance
- Don't upgrade everything (defeats prioritization)

### 3. Respect Privacy
- Never tag with PII (emails, names, etc.)
- Use masked identifiers for users
- Implement cookie consent if required
- Follow GDPR/CCPA guidelines

### 4. Focus Analysis
- Filter by specific tags for targeted insights
- Watch 5-10 sessions, look for patterns
- Combine with quantitative data from Plausible
- Share interesting sessions with team

### 5. Regular Review
- Weekly: Review top insights and rage clicks
- Monthly: Analyze heatmaps for new pages
- Quarterly: Deep dive on conversion funnel
- After launches: Watch sessions of new features

## Testing

### Local Development
1. Clarity works in development mode
2. Check browser console for tracking logs
3. Recordings will appear in dashboard
4. Tag sessions with `environment: development`

### Production Testing
1. Test in incognito to avoid repeat visits
2. Complete full conversion funnel
3. Wait 5-10 minutes for processing
4. Filter by recent sessions in dashboard

## Maintenance

### Regular Tasks
- **Weekly**: Review insights and rage clicks
- **Monthly**: Check recording quality and sampling
- **Quarterly**: Audit tags and custom events
- **Yearly**: Review privacy configuration

### Alerts to Set
- High rage click rate (>10%)
- Increased dead clicks
- Drop in session count
- Spike in errors

## Support Resources

- [Clarity Documentation](https://docs.microsoft.com/en-us/clarity/)
- [Setup Guide](https://docs.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup)
- [Tag Documentation](https://docs.microsoft.com/en-us/clarity/custom-tags)
- [Privacy Guide](https://docs.microsoft.com/en-us/clarity/privacy-disclosure)

## Summary

Microsoft Clarity provides invaluable UX insights through:
- ✅ Session recordings of real user behavior
- ✅ Heatmaps showing where users click and scroll
- ✅ Automatic friction detection (rage clicks, dead clicks)
- ✅ Integration with existing analytics stack
- ✅ Privacy-first configuration
- ✅ Custom tagging for A/B test segmentation

Combined with Plausible (quantitative) and Google Ads (conversion), Clarity completes PawPop's analytics stack for comprehensive optimization insights.
