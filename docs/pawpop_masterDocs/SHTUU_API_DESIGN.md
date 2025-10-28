# Shtuu's Studio - API Design Specification

**Version:** 1.0  
**Date:** October 27, 2025  
**Related:** SHTUU_TECHNICAL_SPEC.md  

---

## 1. API Endpoints Overview

All endpoints follow RESTful conventions and return JSON responses.

**Base URL:** `/api/shtuu/`

---

## 2. Dialogue System APIs

### 2.1 Start New Dialogue Session

**Endpoint:** `POST /api/shtuu/dialogue/start`

**Purpose:** Initialize a new dialogue session with Shtuu

**Request Body:**
```json
{
  "userId": "uuid or null (for anonymous)",
  "source": "landing_page | direct_link"
}
```

**Response:**
```json
{
  "success": true,
  "sessionToken": "sess_abc123def456",
  "currentStep": "welcome",
  "dialogue": {
    "character": "shtuu",
    "message": "I love making art of pets. Do you have a pet?",
    "options": [
      { "id": "dog", "label": "Dog", "emoji": "🐕" },
      { "id": "cat", "label": "Cat", "emoji": "🐈" }
    ],
    "animation": "idle_happy"
  }
}
```

---

### 2.2 Submit Dialogue Response

**Endpoint:** `POST /api/shtuu/dialogue/respond`

**Purpose:** Submit user's choice and get next dialogue step

**Request Body:**
```json
{
  "sessionToken": "sess_abc123def456",
  "step": "pet_type",
  "response": {
    "petType": "dog"
  }
}
```

**Response:**
```json
{
  "success": true,
  "sessionToken": "sess_abc123def456",
  "currentStep": "upload",
  "dialogue": {
    "character": "shtuu",
    "message": "I love doggies! Show me a picture and I will make something for my new friend",
    "action": "upload_image",
    "animation": "excited"
  }
}
```

**Possible Steps:**
- `welcome` → `pet_type` → `upload` → `generating` → `reveal` → `feedback`

---

### 2.3 Upload Pet Photo (Dialogue Context)

**Endpoint:** `POST /api/shtuu/dialogue/upload`

**Purpose:** Upload pet photo within dialogue session

**Request:** `multipart/form-data`
```
sessionToken: sess_abc123def456
petPhoto: [File]
email: user@example.com (captured during upload)
```

**Response:**
```json
{
  "success": true,
  "sessionToken": "sess_abc123def456",
  "currentStep": "generating",
  "dialogue": {
    "character": "shtuu",
    "message": "So cute! I have a great idea for something…",
    "animation": "working",
    "generationStarted": true
  },
  "artworkId": "uuid-artwork-123"
}
```

**Background Process:**
- Start artwork generation (fal.ai)
- Assign random parody style (MVP: select based on pet type)
- Create artwork record with `dialogue_session_id`

---

### 2.4 Check Generation Status

**Endpoint:** `GET /api/shtuu/dialogue/status?sessionToken=sess_abc123`

**Purpose:** Poll generation status during "working" animation

**Response (In Progress):**
```json
{
  "success": true,
  "status": "generating",
  "estimatedTimeRemaining": 45,
  "dialogue": {
    "character": "shtuu",
    "message": "Almost done! Adding the finishing touches…",
    "animation": "working"
  }
}
```

**Response (Complete):**
```json
{
  "success": true,
  "status": "completed",
  "currentStep": "reveal",
  "dialogue": {
    "character": "shtuu",
    "message": "I got the idea from a moving picture I watched. Humans are so creative!",
    "animation": "celebrating",
    "artworkPreview": "https://storage.supabase.co/artwork-preview.jpg",
    "parodyStyle": "dogfather",
    "isWatermarked": true
  },
  "artworkId": "uuid-artwork-123"
}
```

---

## 3. Credit System APIs

### 3.1 Get User Credit Balance

**Endpoint:** `GET /api/shtuu/credits/balance`

**Headers:** `Authorization: Bearer [jwt_token]`

**Response:**
```json
{
  "success": true,
  "userId": "uuid-user-123",
  "creditBalance": 12,
  "subscriptionTier": "snack_pack",
  "nextRefillDate": "2025-11-27T00:00:00Z",
  "nextRefillAmount": 5
}
```

---

### 3.2 Purchase Credits (One-Time)

**Endpoint:** `POST /api/shtuu/credits/purchase`

**Purpose:** Create Stripe checkout session for credit pack

**Request Body:**
```json
{
  "userId": "uuid-user-123",
  "creditAmount": 5,
  "productType": "snack_pack"
}
```

**Response:**
```json
{
  "success": true,
  "checkoutSessionId": "cs_test_abc123",
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_abc123"
}
```

**Stripe Metadata:**
```json
{
  "product_type": "credit_purchase",
  "credit_amount": 5,
  "user_id": "uuid-user-123"
}
```

---

### 3.3 Credit Transaction History

**Endpoint:** `GET /api/shtuu/credits/transactions?limit=20&offset=0`

**Headers:** `Authorization: Bearer [jwt_token]`

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid-tx-1",
      "type": "spend",
      "amount": -1,
      "balanceAfter": 11,
      "description": "Generated Dogfather parody",
      "artworkId": "uuid-artwork-123",
      "createdAt": "2025-10-27T19:30:00Z"
    },
    {
      "id": "uuid-tx-2",
      "type": "purchase",
      "amount": 5,
      "balanceAfter": 12,
      "description": "Snack Pack purchase",
      "stripePaymentIntentId": "pi_abc123",
      "createdAt": "2025-10-27T18:00:00Z"
    }
  ],
  "total": 45,
  "hasMore": true
}
```

---

## 4. Subscription APIs

### 4.1 Create Subscription

**Endpoint:** `POST /api/shtuu/subscription/create`

**Purpose:** Create Stripe checkout for subscription

**Request Body:**
```json
{
  "userId": "uuid-user-123",
  "planName": "art_supply_crate",
  "billingInterval": "monthly"
}
```

**Response:**
```json
{
  "success": true,
  "checkoutSessionId": "cs_test_sub_123",
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_sub_123"
}
```

---

### 4.2 Manage Subscription

**Endpoint:** `POST /api/shtuu/subscription/manage`

**Purpose:** Create Stripe customer portal session

**Request Body:**
```json
{
  "userId": "uuid-user-123"
}
```

**Response:**
```json
{
  "success": true,
  "portalUrl": "https://billing.stripe.com/session/abc123"
}
```

---

### 4.3 Stripe Subscription Webhook

**Endpoint:** `POST /api/shtuu/webhook/stripe-subscription`

**Events Handled:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded` (auto-refill credits)
- `invoice.payment_failed`

**Processing Logic:**

```typescript
// invoice.payment_succeeded
if (event.type === 'invoice.payment_succeeded') {
  const subscription = event.data.object.subscription;
  const userId = await getUserByStripeCustomerId(customerId);
  const plan = await getSubscriptionPlan(subscription.items.data[0].price.id);
  
  // Auto-refill credits
  await addCredits(userId, plan.credits_per_month, {
    transaction_type: 'subscription_refill',
    description: `${plan.display_name} monthly refill`,
    stripe_payment_intent_id: invoice.payment_intent
  });
  
  // Send "Shtuu got supplies!" email
  await sendSubscriptionRefillEmail(userId, plan.credits_per_month);
}
```

---

## 5. Artwork Generation APIs (Enhanced)

### 5.1 Generate Parody Artwork

**Endpoint:** `POST /api/shtuu/generate`

**Purpose:** Generate parody artwork (credit-gated)

**Request Body:**
```json
{
  "userId": "uuid-user-123",
  "petPhotoUrl": "https://uploadthing.com/pet.jpg",
  "parodyStyle": "dogfather",
  "useCredits": true
}
```

**Response (Success):**
```json
{
  "success": true,
  "artworkId": "uuid-artwork-456",
  "creditsSpent": 1,
  "creditBalanceAfter": 11,
  "generationStarted": true,
  "estimatedCompletionTime": 60
}
```

**Response (Insufficient Credits):**
```json
{
  "success": false,
  "error": "insufficient_credits",
  "creditBalance": 0,
  "creditsRequired": 1,
  "dialogue": {
    "character": "shtuu",
    "message": "I need more art supplies to make this! Can you help me?",
    "animation": "sad",
    "cta": {
      "label": "Get Snacks for Shtuu",
      "action": "purchase_credits"
    }
  }
}
```

---

### 5.2 Request Variation

**Endpoint:** `POST /api/shtuu/variation`

**Purpose:** Generate variation of existing artwork (0.5 credits)

**Request Body:**
```json
{
  "userId": "uuid-user-123",
  "originalArtworkId": "uuid-artwork-123",
  "variationPrompt": "make it more dramatic"
}
```

**Response:**
```json
{
  "success": true,
  "artworkId": "uuid-artwork-789",
  "creditsSpent": 0.5,
  "creditBalanceAfter": 10.5,
  "parentArtworkId": "uuid-artwork-123"
}
```

---

## 6. Analytics & Tracking APIs

### 6.1 Track Dialogue Event

**Endpoint:** `POST /api/shtuu/analytics/event`

**Purpose:** Track user interactions for funnel analysis

**Request Body:**
```json
{
  "sessionToken": "sess_abc123",
  "eventType": "dialogue_step_completed",
  "eventData": {
    "step": "pet_type",
    "response": "dog",
    "timeSpent": 3.5
  }
}
```

**Events to Track:**
- `dialogue_started`
- `dialogue_step_completed`
- `image_uploaded`
- `generation_started`
- `artwork_revealed`
- `credit_purchase_initiated`
- `subscription_initiated`

---

## 7. Email Capture & Delivery APIs

### 7.1 Capture Email (Within Dialogue)

**Endpoint:** `POST /api/shtuu/email/capture`

**Request Body:**
```json
{
  "sessionToken": "sess_abc123",
  "email": "user@example.com",
  "artworkId": "uuid-artwork-123"
}
```

**Response:**
```json
{
  "success": true,
  "dialogue": {
    "character": "shtuu",
    "message": "Thank you! I'll send your artwork to your email when it's ready!",
    "animation": "happy"
  }
}
```

---

### 7.2 Send Artwork Email

**Triggered by:** Generation completion webhook

**Email Template:** "Your Free Artwork from Shtuu!"

**Content:**
- Low-res preview (watermarked)
- "Download High-Res" CTA (requires credit purchase)
- "Make More Art with Shtuu" CTA

---

## 8. Free Tier Protection APIs

### 8.1 Check Free Tier Eligibility

**Endpoint:** `POST /api/shtuu/free-tier/check`

**Request Body:**
```json
{
  "email": "user@example.com",
  "ipAddress": "192.168.1.1"
}
```

**Response (Eligible):**
```json
{
  "success": true,
  "eligible": true,
  "remainingFreeArtworks": 2,
  "dailyLimit": 3
}
```

**Response (Limit Reached):**
```json
{
  "success": true,
  "eligible": false,
  "reason": "daily_limit_reached",
  "resetTime": "2025-10-28T00:00:00Z",
  "dialogue": {
    "character": "shtuu",
    "message": "Wow, you really love art! I need to rest my paws for today. Come back tomorrow, or get some snacks to keep creating!",
    "animation": "tired",
    "cta": {
      "label": "Get Credits Now",
      "action": "purchase_credits"
    }
  }
}
```

---

## 9. Error Handling Standards

### Standard Error Response Format
```json
{
  "success": false,
  "error": "error_code",
  "message": "Human-readable error message",
  "dialogue": {
    "character": "shtuu",
    "message": "Oops! Something went wrong. Let me try again!",
    "animation": "confused"
  }
}
```

### Common Error Codes
- `insufficient_credits`
- `invalid_session_token`
- `daily_limit_reached`
- `generation_failed`
- `payment_failed`
- `invalid_parody_style`
- `file_upload_failed`

---

## 10. Rate Limiting

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/shtuu/dialogue/*` | 100 requests | per hour |
| `/api/shtuu/generate` | 10 generations | per hour |
| `/api/shtuu/credits/purchase` | 5 checkouts | per hour |
| `/api/shtuu/free-tier/check` | 50 requests | per hour |

**Implementation:** Use Vercel Edge Config or Upstash Redis

---

## 11. Authentication Strategy

### MVP (Phase 1): Email-Based Sessions
- Anonymous dialogue sessions (token-based)
- Email capture creates user record
- Magic link for returning users

### Future (Phase 2): Full Auth
- NextAuth.js integration
- Google/Facebook OAuth
- Persistent user accounts

---

## 12. API Testing Checklist

- [ ] All endpoints return proper error codes
- [ ] Credit transactions are atomic
- [ ] Stripe webhooks are idempotent
- [ ] Dialogue state persists correctly
- [ ] Free tier limits enforced
- [ ] Rate limiting works
- [ ] Email delivery functional
- [ ] Analytics events tracked
