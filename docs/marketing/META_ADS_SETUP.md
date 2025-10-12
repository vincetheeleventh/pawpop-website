# Meta (Facebook) Ads Pixel & Conversions API Setup

## Overview

PawPop uses **Meta (Facebook) Pixel** for client-side tracking and **Meta Conversions API** for server-side tracking to provide comprehensive conversion attribution and optimization for Meta advertising campaigns.

## Implementation Status

✅ **FULLY IMPLEMENTED AND PRODUCTION-READY**

### Components Implemented:
- ✅ Client-side Meta Pixel tracking (`/src/lib/meta-ads.ts`)
- ✅ Server-side Conversions API tracking (`/src/lib/meta-ads-server.ts`)
- ✅ MetaPixel component integration in layout (`/src/components/analytics/MetaPixel.tsx`)
- ✅ Webhook integration for purchase tracking
- ✅ Event deduplication between client and server
- ✅ Advanced matching for better attribution
- ✅ Component integration (UploadModal, ProductPurchaseModal)

## Conversion Events Tracked

### 1. **Lead - Photo Upload** ($2 CAD value)
- **Trigger**: User completes photo upload form
- **Location**: `UploadModal.tsx` after artwork creation
- **Event**: `Lead`
- **Data**: Email, name, value
- **Purpose**: Track initial engagement and form completions

### 2. **ViewContent - Artwork Generation** ($8 CAD value)
- **Trigger**: Artwork generation completes successfully
- **Location**: After pet integration completes
- **Event**: `ViewContent`
- **Data**: Artwork ID, value
- **Purpose**: Track qualified leads with completed artwork

### 3. **ViewContent - Artwork Page View** ($1 CAD value)
- **Trigger**: User views their completed artwork page
- **Location**: `/artwork/[token]` page
- **Event**: `ViewContent`
- **Data**: Artwork ID, value
- **Purpose**: Track high-intent users viewing results

### 4. **InitiateCheckout - Begin Checkout** (Actual value)
- **Trigger**: User clicks "Buy Now" in purchase modal
- **Location**: `ProductPurchaseModal.tsx`
- **Event**: `InitiateCheckout`
- **Data**: Product type, price, quantity
- **Purpose**: Track checkout initiation

### 5. **Purchase - Order Completion** (Actual order value)
- **Trigger**: Stripe checkout.session.completed webhook
- **Location**: `/api/webhook/route.ts` (server-side)
- **Event**: `Purchase`
- **Data**: Order ID, value, customer details, shipping address
- **Purpose**: Track revenue and optimize for purchases
- **Special**: Deduplicated with client-side event via event_id

## Event Deduplication Strategy

Meta Conversions API supports **event deduplication** to prevent double-counting conversions from both client-side (Pixel) and server-side (Conversions API) sources.

### How It Works:
1. **Client-side tracking** generates a unique `event_id` for each conversion
2. **Server-side tracking** uses the same `event_id` when available
3. Meta automatically deduplicates events with matching `event_id` within 48 hours
4. This ensures accurate conversion counting and attribution

### Event ID Generation:
```typescript
// Both client and server use consistent event ID generation
const eventId = generateEventId('Purchase', orderId);
// Example: "ab12cd34ef56gh78"
```

## Advanced Matching

Enhanced user data matching improves attribution accuracy by **20-30%** according to Meta.

### Data Hashing:
- All user data is **SHA-256 hashed** before sending to Meta Conversions API
- Hashing happens server-side to protect user privacy
- Client-side Pixel automatically hashes data via `fbq('init')` advanced matching

### User Data Collected:
- Email (hashed)
- First Name (hashed)
- Last Name (hashed)
- Phone (hashed, if available)
- City, State, Zip, Country (hashed, from shipping address)

### Implementation:
```typescript
// Client-side
setMetaAdvancedMatching({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe'
});

// Server-side (automatic hashing)
userData.em = hashData(customerEmail); // SHA-256 hash
```

## Environment Configuration

### Required Environment Variables:

```bash
# Meta Pixel ID (client-side tracking)
NEXT_PUBLIC_META_PIXEL_ID=your_meta_pixel_id

# Meta Conversions API Access Token (server-side tracking)
META_CONVERSION_API_ACCESS_TOKEN=your_meta_conversions_api_access_token

# Test Event Code (optional, for testing in Events Manager)
META_TEST_EVENT_CODE=test_event_code_from_events_manager
```

### How to Get These Values:

#### 1. Meta Pixel ID
1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2)
2. Select your Pixel (or create a new one)
3. Copy the Pixel ID from the top (15-digit number)

#### 2. Conversions API Access Token
1. In Events Manager, go to your Pixel
2. Navigate to "Settings" tab
3. Scroll to "Conversions API" section
4. Click "Generate Access Token"
5. Copy the long token string (starts with "EAA...")

#### 3. Test Event Code (Optional)
1. In Events Manager, go to "Test Events" tab
2. Click "Test Server Events"
3. Copy the test event code shown
4. This allows you to see server events in real-time during testing

## Setup Instructions

### 1. Configure Environment Variables

Add to your `.env.local`:

```bash
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
META_CONVERSION_API_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
META_TEST_EVENT_CODE=TEST12345
```

### 2. Verify Client-Side Pixel Installation

1. Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper) Chrome extension
2. Visit your site: `https://pawpopart.com`
3. Click the extension icon - should show green checkmark
4. Verify `PageView` event fires on page load

### 3. Test Conversion Events

Use Meta Events Manager > Test Events tab:

1. **Test Lead Event**:
   - Fill out upload form with test email
   - Verify "Lead" event appears in Test Events
   - Check value is $2 CAD

2. **Test InitiateCheckout Event**:
   - Click "Buy Now" on any product
   - Verify "InitiateCheckout" event appears
   - Check product details are correct

3. **Test Purchase Event (Server-Side)**:
   - Complete a test purchase with Stripe test card
   - Verify "Purchase" event appears in Test Events
   - Check event has `event_id` for deduplication
   - Verify customer data is hashed correctly

### 4. Verify Event Deduplication

1. Complete a purchase that triggers both client and server events
2. In Events Manager > Test Events, check for duplicate events
3. Events with same `event_id` should show as deduplicated
4. Event count should be **1**, not **2**

## Testing & Verification

### Development Testing

```bash
# 1. Start dev server
npm run dev

# 2. Open browser console
# Look for Meta tracking logs:
# "Meta Pixel: Script loaded successfully"
# "Meta Pixel: Lead (Photo Upload) tracked"
# "Meta Pixel: InitiateCheckout tracked"

# 3. Complete test purchase
# Check webhook logs for:
# "✅ Meta Conversions API: Purchase tracked successfully"
```

### Production Verification

1. **Events Manager Dashboard**:
   - Go to Meta Events Manager
   - Select "Events" tab
   - Verify events are appearing in last 24 hours

2. **Conversions API Quality Score**:
   - In Events Manager, go to "Overview" tab
   - Check "Events Match Quality" section
   - Should show **"Good"** or **"Great"**
   - If "Poor", review advanced matching implementation

3. **Attribution Modeling**:
   - Wait 24-48 hours for data collection
   - Go to Meta Ads Manager > Campaigns
   - Check attribution for your ad sets
   - Conversions should be attributed correctly

## Conversion Values

Optimized for PawPop product pricing ($19.99-$129.99):

| Event | Value (CAD) | Purpose |
|-------|-------------|---------|
| Lead (Photo Upload) | $2 | Initial engagement, form completion |
| ViewContent (Artwork Generated) | $8 | Qualified lead with completed artwork |
| ViewContent (Artwork Page View) | $1 | High-intent user engagement |
| InitiateCheckout | Actual cart value | Checkout intent tracking |
| Purchase | Actual order value | Revenue and ROAS optimization |

## Campaign Optimization

### Using Conversion Events in Meta Ads

1. **Create Campaign**:
   - Choose "Sales" or "Conversions" objective
   - Select your Pixel as the conversion source

2. **Choose Conversion Event**:
   - For top-of-funnel: Use "Lead" event
   - For middle-of-funnel: Use "InitiateCheckout" event
   - For bottom-of-funnel: Use "Purchase" event

3. **Set Up Conversion Value Optimization**:
   - Enable "Value Optimization"
   - Meta will optimize for highest value purchases
   - Works best with Purchase event and accurate order values

4. **Create Lookalike Audiences**:
   - Go to Audiences > Create > Lookalike Audience
   - Source: "Purchase" event converters (last 180 days)
   - Similarity: 1-2% for cold audiences
   - Location: Your target markets

## Troubleshooting

### Pixel Not Loading

**Symptoms**: Meta Pixel Helper shows no pixel detected

**Solutions**:
1. Check environment variable is set: `NEXT_PUBLIC_META_PIXEL_ID`
2. Verify variable starts with numeric ID (not "your_meta_pixel_id")
3. Check browser console for script loading errors
4. Clear browser cache and hard reload

### Events Not Appearing

**Symptoms**: No events in Events Manager > Test Events

**Solutions**:
1. Verify `META_TEST_EVENT_CODE` is set correctly
2. Check webhook logs for error messages
3. Ensure Conversions API access token is valid
4. Verify server has internet access to Meta API

### Poor Event Match Quality

**Symptoms**: Events Manager shows "Poor" match quality

**Solutions**:
1. Verify advanced matching is implemented correctly
2. Check that user data is being hashed properly
3. Ensure email addresses are being captured
4. Add more customer data (phone, address) from Stripe

### Duplicate Events

**Symptoms**: Same conversion counted twice

**Solutions**:
1. Verify event_id is being generated and passed correctly
2. Check both client and server are using same event_id logic
3. Review deduplication implementation in webhook
4. Wait 48 hours for Meta to process and deduplicate

### Server-Side Events Failing

**Symptoms**: Webhook logs show Meta API errors

**Common Errors**:

- **"Invalid access token"**: Regenerate access token in Events Manager
- **"Pixel not found"**: Verify Pixel ID matches exactly
- **"Parameter validation failed"**: Check currency format (use "CAD" not "cad")
- **"Rate limit exceeded"**: Implement batch processing for high volume

## API Integration Details

### Meta Conversions API Endpoint

```
POST https://graph.facebook.com/v18.0/{pixel_id}/events
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Request Payload Structure

```typescript
{
  "data": [
    {
      "event_name": "Purchase",
      "event_time": 1234567890, // Unix timestamp
      "event_id": "unique_event_id", // For deduplication
      "event_source_url": "https://pawpopart.com",
      "action_source": "website",
      "user_data": {
        "em": "hashed_email",
        "ph": "hashed_phone",
        "fn": "hashed_first_name",
        "ln": "hashed_last_name",
        "ct": "hashed_city",
        "st": "hashed_state",
        "zp": "hashed_zip",
        "country": "hashed_country"
      },
      "custom_data": {
        "value": 99.99,
        "currency": "CAD",
        "content_name": "PawPop Art Print",
        "content_category": "pet_art",
        "content_ids": ["pawpop_art_print"],
        "content_type": "product",
        "num_items": 1,
        "order_id": "ch_abc123"
      }
    }
  ],
  "test_event_code": "TEST12345" // Optional, for testing
}
```

## Performance & Attribution

### Expected Results

After 7-14 days of data collection:

- **Attribution Accuracy**: 80-90% of purchases attributed correctly
- **Event Match Quality**: "Good" or "Great" rating
- **Conversion Tracking**: Real-time event data in Events Manager
- **Campaign Optimization**: Meta can optimize ads for best converters
- **ROAS Visibility**: Clear view of return on ad spend

### Privacy & Compliance

- ✅ **GDPR Compliant**: User data is hashed before transmission
- ✅ **CCPA Compliant**: No personal data sent in plain text
- ✅ **User Privacy**: SHA-256 hashing protects user information
- ✅ **Deduplication**: Prevents inflated conversion counts
- ✅ **Advanced Matching**: Improves attribution without compromising privacy

## Support & Resources

### Meta Documentation
- [Conversions API Guide](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Pixel Implementation](https://developers.facebook.com/docs/meta-pixel)
- [Event Deduplication](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)
- [Advanced Matching](https://developers.facebook.com/docs/meta-pixel/advanced/advanced-matching)

### PawPop Implementation Files
- `/src/lib/meta-ads.ts` - Client-side tracking
- `/src/lib/meta-ads-server.ts` - Server-side tracking
- `/src/components/analytics/MetaPixel.tsx` - Pixel component
- `/src/app/api/webhook/route.ts` - Purchase conversion tracking

### Getting Help
- Meta Business Help Center: https://business.facebook.com/business/help
- Events Manager: https://business.facebook.com/events_manager2
- Meta Developer Support: https://developers.facebook.com/support

---

**Last Updated**: January 2025  
**Status**: Production-Ready  
**Version**: 1.0.0
