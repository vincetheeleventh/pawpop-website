# Shtuu's Studio - Technical Specification

**Version:** 1.0  
**Date:** October 27, 2025  
**Product:** PawPop Freemium Transformation  

---

## 1. Overview

This document defines the technical architecture for transforming PawPop into **Shtuu's Studio**, a freemium, character-driven creative platform with a credit-based economy.

### Core Transformation
- **FROM:** Single-purchase physical products ($79+) with squeeze page
- **TO:** Freemium onboarding with credit-based subscription economy
- **Key Differentiator:** Dialogue-based interaction with Shtuu mascot character

---

## 2. Database Schema Changes

### 2.1 New Tables

#### `users` Table Enhancement
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS credit_balance INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_cancelled_at TIMESTAMPTZ;
```

#### `credit_transactions` Table (NEW)
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  artwork_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
  transaction_type TEXT NOT NULL, -- 'purchase', 'spend', 'refund', 'subscription_refill'
  credit_amount INTEGER NOT NULL, -- positive for additions, negative for spending
  credit_balance_after INTEGER NOT NULL,
  stripe_payment_intent_id TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
```

#### `dialogue_sessions` Table (NEW)
```sql
CREATE TABLE dialogue_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_token TEXT UNIQUE NOT NULL,
  current_step TEXT NOT NULL DEFAULT 'welcome', -- 'welcome', 'pet_type', 'upload', 'generating', 'reveal', 'feedback'
  conversation_state JSONB DEFAULT '{}', -- stores user responses, pet type, etc.
  artwork_id UUID REFERENCES artworks(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  session_metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_dialogue_sessions_token ON dialogue_sessions(session_token);
CREATE INDEX idx_dialogue_sessions_user_id ON dialogue_sessions(user_id);
CREATE INDEX idx_dialogue_sessions_last_interaction ON dialogue_sessions(last_interaction_at DESC);
```

#### `subscription_plans` Table (NEW)
```sql
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_name TEXT UNIQUE NOT NULL, -- 'free', 'snack_pack', 'art_supply_crate'
  display_name TEXT NOT NULL, -- 'Free', 'Snack Pack', 'Art Supply Crate'
  stripe_price_id TEXT,
  credits_per_month INTEGER NOT NULL DEFAULT 0,
  price_cents INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  features JSONB DEFAULT '{}', -- exclusive art sets, faster generation, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default plans
INSERT INTO subscription_plans (plan_name, display_name, credits_per_month, price_cents, features) VALUES
('free', 'Free', 0, 0, '{"artworks_per_session": 1, "watermarked": true, "generation_speed": "standard"}'),
('snack_pack', 'Snack Pack (5 Credits)', 5, 999, '{"artworks_per_session": 5, "watermarked": false, "generation_speed": "standard"}'),
('art_supply_crate', 'Art Supply Crate (20 Credits)', 20, 2999, '{"artworks_per_session": 20, "watermarked": false, "generation_speed": "priority", "exclusive_styles": true}');
```

### 2.2 Artworks Table Enhancement
```sql
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS is_free_tier BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS has_watermark BOOLEAN DEFAULT FALSE;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS credits_spent INTEGER DEFAULT 0;
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS parody_style TEXT; -- 'wizard', 'paws', 'popstar', 'dogfather'
ALTER TABLE artworks ADD COLUMN IF NOT EXISTS dialogue_session_id UUID REFERENCES dialogue_sessions(id);
```

---

## 3. Core Architecture Components

### 3.1 Shtuu Character Engine

**Purpose:** Manages dialogue flow, character responses, and emotional state

**Key Components:**
- `ShtuuDialogueManager` - Orchestrates conversation flow
- `ShtuuResponseGenerator` - Generates contextual responses
- `ShtuuAnimationController` - Controls character animations (working, thinking, celebrating)

**State Machine:**
```
WELCOME → PET_TYPE_SELECTION → IMAGE_UPLOAD → GENERATING → REVEAL → FEEDBACK_LOOP
                                                                         ↓
                                                                    [MONETIZATION]
```

### 3.2 Credit Economy System

**Components:**
- Credit wallet (per user)
- Transaction ledger (audit trail)
- Subscription auto-refill logic
- Credit purchase flow (Stripe)

**Credit Costs (MVP):**
- First artwork: **FREE** (email capture)
- Additional parody: **1 credit**
- Variation request: **0.5 credits**
- High-res download: **Included with credit spend**

### 3.3 Generation Pipeline Enhancement

**Reuse Existing:**
- fal.ai Flux Pro integration ✅
- Supabase Storage ✅
- Background generation pattern ✅

**New Requirements:**
- Parody template system (4 styles: wizard, paws, popstar, dogfather)
- Watermarking for free tier
- Low-res preview generation
- High-res gating behind credit spend

---

## 4. Technical Stack Compatibility

### 4.1 Leverage Existing Infrastructure

| Component | Current Status | Shtuu Usage |
|-----------|----------------|-------------|
| Next.js App Router | ✅ Production | Dialogue pages & API routes |
| Supabase Database | ✅ Production | Add credit & dialogue tables |
| fal.ai Integration | ✅ Production | Parody generation engine |
| Stripe Checkout | ✅ Production | Credit purchases & subscriptions |
| Email (Resend) | ✅ Production | Artwork delivery emails |
| UploadThing | ✅ Production | Pet photo uploads |
| Analytics (Plausible) | ✅ Production | Freemium funnel tracking |

### 4.2 New Integrations Required

- **Watermarking Service:** Add watermark to free tier images
- **Dialogue State Management:** Session-based conversation tracking
- **Subscription Webhooks:** Handle Stripe subscription lifecycle events

---

## 5. Data Flow Architecture

### 5.1 Freemium Onboarding Flow

```
User Lands → Meet Shtuu → Pet Type Selection → Upload Photo → Background Generation
                                                                      ↓
                                                              Email Capture
                                                                      ↓
                                                         Low-Res Preview Email
                                                                      ↓
                                              [FREE TIER: Watermarked | PAID: High-Res]
```

### 5.2 Credit Purchase Flow

```
User Wants More Art → "Shtuu Needs Snacks!" → Stripe Checkout → Credit Added
                                                                      ↓
                                                          Transaction Logged
                                                                      ↓
                                                          Generate New Artwork
```

### 5.3 Subscription Flow

```
Recurring Subscription → Stripe Webhook → Auto-Refill Credits → Update User Balance
                                                                         ↓
                                                              "Shtuu Got Supplies!"
```

---

## 6. Security & Compliance

### 6.1 Credit Security
- Atomic transactions for credit operations
- Transaction ledger for audit trail
- Prevent negative balances with database constraints
- Server-side credit validation before generation

### 6.2 Free Tier Protection
- Rate limiting per email (max 3 free artworks per day)
- Email verification required before high-res download
- Watermark cannot be removed client-side

### 6.3 User Data
- GDPR compliance: user data export/deletion
- Email opt-out for marketing (not transactional)
- Anonymous sessions tracked via session tokens

---

## 7. Performance Considerations

### 7.1 Database Optimization
- Indexes on `credit_transactions(user_id, created_at)`
- Indexes on `dialogue_sessions(session_token, last_interaction_at)`
- JSONB GIN indexes for metadata queries

### 7.2 Caching Strategy
- User credit balance cached in session (invalidate on transaction)
- Subscription status cached for 5 minutes
- Dialogue state stored in database, not memory

### 7.3 Scalability
- Background generation queue (same as current)
- Stripe webhook idempotency keys
- Database connection pooling (Supabase auto-scales)

---

## 8. Migration Strategy

### 8.1 Phase 1: Parallel Deployment
- New `/shtuu` route alongside existing PawPop
- Shared database and infrastructure
- A/B test traffic: 20% Shtuu, 80% PawPop

### 8.2 Phase 2: Feature Parity
- Ensure Shtuu has equivalent conversion rate
- Monitor credit economy health (burn rate, ARPU)
- Iterate on Shtuu character UX

### 8.3 Phase 3: Full Migration
- Redirect all traffic to Shtuu experience
- Legacy `/artwork/[token]` pages still accessible
- Archive old purchase modals (keep for reference)

---

## 9. Environment Variables

### New Required Variables
```bash
# Stripe Subscription
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Credit System
CREDITS_PER_FREE_ARTWORK=0
CREDITS_PER_PAID_ARTWORK=1
FREE_TIER_DAILY_LIMIT=3

# Watermarking
WATERMARK_TEXT="PawPop • pawpopart.com"
WATERMARK_OPACITY=0.3
```

---

## 10. Monitoring & Analytics

### 10.1 Key Metrics to Track

| Metric | Tool | Target |
|--------|------|--------|
| Free → Email Capture | Plausible | ≥60% |
| Email → Credit Purchase | Plausible | ≥10% |
| Credit Purchase → Subscription | Stripe | ≥5% |
| Avg. Credits per User | Custom | 3-5 credits |
| Subscription Churn | Stripe | <10%/month |
| Dialogue Completion Rate | Plausible | ≥80% |

### 10.2 Error Tracking
- Credit transaction failures
- Stripe webhook processing errors
- Generation failures (track by parody style)
- Dialogue session abandonment rate

---

## 11. Testing Strategy

### 11.1 Unit Tests
- Credit transaction logic
- Dialogue state machine
- Subscription lifecycle handlers

### 11.2 Integration Tests
- End-to-end freemium flow
- Credit purchase → generation workflow
- Subscription webhook handling

### 11.3 Manual QA Checklist
- [ ] Free tier watermark applied correctly
- [ ] Credit balance updates in real-time
- [ ] Subscription auto-refill works
- [ ] Dialogue flow feels natural
- [ ] Email capture and delivery functional
- [ ] All 4 parody styles generate correctly

---

## 12. Rollback Plan

### If Shtuu Underperforms:
1. Route traffic back to original PawPop
2. Preserve credit balances (convert to coupons)
3. Honor active subscriptions
4. Keep dialogue session data for analysis

### Database Rollback:
- All new tables have `IF NOT EXISTS` safety
- Columns added to existing tables are nullable
- No breaking changes to core `artworks` or `orders` tables
