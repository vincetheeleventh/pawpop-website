# Shtuu's Studio - Implementation Overview

**Version:** 1.0  
**Date:** October 27, 2025  
**Status:** Ready for Development  

---

## 📚 Documentation Index

This is the master reference for implementing PawPop's transformation into **Shtuu's Studio**, a freemium, character-driven creative platform.

### Core Documents

1. **[PRD_SHTUU_FREEMIUM.md](./PRD_SHTUU_FREEMIUM.md)** - Product Requirements Document
   - Product vision and goals
   - User experience flow
   - Monetization model
   - Success metrics

2. **[SHTUU_TECHNICAL_SPEC.md](./SHTUU_TECHNICAL_SPEC.md)** - Technical Architecture
   - Database schema changes
   - System architecture
   - Integration points
   - Security considerations

3. **[SHTUU_API_DESIGN.md](./SHTUU_API_DESIGN.md)** - API Specifications
   - All endpoint definitions
   - Request/response formats
   - Error handling
   - Webhook implementations

4. **[SHTUU_COMPONENT_GUIDE.md](./SHTUU_COMPONENT_GUIDE.md)** - Frontend Architecture
   - Component hierarchy
   - Custom hooks
   - Styling guidelines
   - Animation specifications

5. **[SHTUU_IMPLEMENTATION_TASKS.md](./SHTUU_IMPLEMENTATION_TASKS.md)** - Task Breakdown
   - Phase-by-phase task list
   - Time estimates
   - Dependencies
   - Success criteria

---

## 🎯 Quick Start

### For Product Managers
→ Start with **PRD_SHTUU_FREEMIUM.md** to understand the vision and user flow

### For Backend Developers
→ Review **SHTUU_TECHNICAL_SPEC.md** then **SHTUU_API_DESIGN.md**
→ Begin with Phase 1 database tasks (DB-001 to DB-005)

### For Frontend Developers
→ Review **SHTUU_COMPONENT_GUIDE.md**
→ Begin with ShtuuCharacter component (FE-001)

### For Project Managers
→ Review **SHTUU_IMPLEMENTATION_TASKS.md** for timeline and resource allocation

---

## 🏗️ What We're Building

### The Transformation
**FROM:** Single-purchase physical products ($79+) with squeeze page  
**TO:** Freemium dialogue-based experience with credit economy  

### Key Innovation
Users don't just "use a tool" — they **meet Shtuu**, a shy, fuzzy artist who wants to create art with them through playful conversation.

### Monetization Strategy
1. **Free Tier:** First artwork free (watermarked, email capture)
2. **Credit Packs:** "Snacks for Shtuu" ($4.99 for 5 credits)
3. **Subscriptions:** "Art Supply Crate" ($9.99/month, 20 credits + perks)

---

## 📊 What We're Leveraging

### ✅ Existing Infrastructure (Ready to Use)

| Component | Status | Shtuu Usage |
|-----------|--------|-------------|
| **Next.js App Router** | ✅ Production | New `/shtuu` route |
| **Supabase Database** | ✅ Production | Add 3 new tables |
| **fal.ai Integration** | ✅ Production | Parody generation |
| **Stripe Checkout** | ✅ Production | Credit purchases |
| **Email (Resend)** | ✅ Production | Artwork delivery |
| **UploadThing** | ✅ Production | Pet photo uploads |
| **Analytics (Plausible)** | ✅ Production | Freemium funnel |

### 🆕 New Components to Build

1. **Dialogue System** - Interactive conversation flow
2. **Credit Economy** - Transaction management & wallet
3. **Subscription Logic** - Recurring billing & auto-refill
4. **Watermarking** - Free tier protection
5. **Shtuu Character** - Animated mascot UI

---

## 🚀 Implementation Timeline

### **Phase 1: MVP (Oct 27-31, 2025)** - 63 hours
**Deliverable:** Questionnaire → generation → email capture

**Key Features:**
- Dialogue flow with Shtuu
- Pet type selection
- Image upload
- Free parody generation (watermarked)
- Email delivery

**Critical Path:**
```
Database Setup (3h) → API Development (19h) → Frontend (26h) → Testing (11h)
```

---

### **Phase 2: Credits (Nov 1-15, 2025)** - 58.5 hours
**Deliverable:** Credit purchase & consumption system

**Key Features:**
- Credit wallet
- Stripe checkout for credit packs
- Transaction history
- Credit-gated generation
- Free tier daily limits (3/day)

---

### **Phase 3: Subscriptions (Nov 16 - Dec 1, 2025)** - 38 hours
**Deliverable:** Recurring subscription with perks

**Key Features:**
- Monthly subscription plans
- Auto-refill credits
- Exclusive parody styles
- Priority generation queue
- Subscription management portal

---

### **Phase 4: Advanced (Dec 1-15, 2025)** - 29 hours
**Deliverable:** Custom prompts & editing

**Key Features:**
- Personal idea input
- Artwork variations
- Basic editing tools
- Shtuu's suggestions

---

## 📈 Success Metrics

### MVP (Phase 1) Targets
- **Dialogue Completion:** ≥60% complete full flow
- **Email Capture:** ≥40% provide email
- **Time to Art:** <90 seconds average
- **Generation Success:** ≥95% no errors
- **User Satisfaction:** >60% positive feedback

### Credit System (Phase 2) Targets
- **Free → Paid Conversion:** ≥10%
- **Average Credits/User:** 3-5 credits
- **Repeat Purchase Rate:** ≥20%

### Subscription (Phase 3) Targets
- **Credit → Subscription:** ≥5%
- **Monthly Churn:** <10%
- **ARPU:** $8-12/month

---

## 🔑 Key Differentiators

### vs. Other AI Art Tools
1. **Emotional Connection:** Shtuu character creates empathy and care
2. **Guided Experience:** No blank canvas paralysis
3. **Narrative Framing:** "Feed Shtuu" vs. "Buy credits"
4. **Parody Templates:** Instant gratification with recognizable styles

### vs. Current PawPop
1. **Zero Friction Entry:** Free first artwork vs. $79 commitment
2. **Viral Potential:** Shareable free proofs
3. **Recurring Revenue:** Subscriptions vs. one-time purchases
4. **Scalable Growth:** Credit economy vs. physical fulfillment

---

## 💾 Database Changes Summary

### New Tables (3)
1. **`dialogue_sessions`** - Conversation state tracking
2. **`credit_transactions`** - Credit wallet & audit trail
3. **`subscription_plans`** - Plan definitions & features

### Enhanced Tables (2)
1. **`users`** - Add credit_balance, subscription fields
2. **`artworks`** - Add parody_style, credit tracking

### Total Migration Impact
- **5 migrations** to apply
- **~10 new columns** across existing tables
- **3 new tables** with indexes
- **Backward compatible** with existing PawPop

---

## 🎨 Design Assets Needed (MVP - Still Images)

### Shtuu Character Still Images
- **Idle:** Default/neutral expression
- **Working:** Focused/creating look
- **Happy:** Celebrating/excited expression
- **Thinking:** Pondering expression

**Total:** 4 still images (animations can be added post-MVP)

### Additional Assets
- Pixel the cat (1 still image, optional)
- Studio background scene (1 image)
- Placeholder approach: Use emoji/simple graphics until final assets ready
- Parody style previews (4 images - can reuse existing parody examples)

---

## 🔧 Development Setup

### Environment Variables (New)
```bash
# Credit System
CREDITS_PER_FREE_ARTWORK=0
CREDITS_PER_PAID_ARTWORK=1
FREE_TIER_DAILY_LIMIT=3

# Watermarking
WATERMARK_TEXT="PawPop • pawpopart.com"
WATERMARK_OPACITY=0.3

# Stripe (already configured)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Installation
```bash
# Install new dependencies
npm install sharp  # For watermarking

# Create feature branch
git checkout -b feature/shtuu-studio

# Run database migrations
npm run migration:apply supabase/migrations/015_shtuu_dialogue_sessions.sql
npm run migration:apply supabase/migrations/016_shtuu_credit_system.sql
npm run migration:apply supabase/migrations/017_shtuu_subscriptions.sql

# Start development server
npm run dev
```

---

## 📝 API Endpoints Overview

### Dialogue System
- `POST /api/shtuu/dialogue/start` - Initialize session
- `POST /api/shtuu/dialogue/respond` - Submit user choice
- `POST /api/shtuu/dialogue/upload` - Upload pet photo
- `GET /api/shtuu/dialogue/status` - Poll generation

### Credit System
- `GET /api/shtuu/credits/balance` - Get user balance
- `POST /api/shtuu/credits/purchase` - Buy credits
- `GET /api/shtuu/credits/transactions` - Transaction history

### Subscription
- `POST /api/shtuu/subscription/create` - Start subscription
- `POST /api/shtuu/subscription/manage` - Customer portal
- `POST /api/shtuu/webhook/stripe-subscription` - Webhook handler

### Generation
- `POST /api/shtuu/generate` - Create parody artwork
- `POST /api/shtuu/variation` - Generate variation

---

## 🧪 Testing Strategy

### Phase 1 (MVP) Tests
- [ ] Dialogue flow completes successfully
- [ ] Image upload and generation work
- [ ] Watermark applied to free tier
- [ ] Email delivery functional
- [ ] Mobile responsive
- [ ] Cross-browser compatible

### Phase 2 (Credits) Tests
- [ ] Credit purchase flow works
- [ ] Credits deducted on generation
- [ ] Transaction history accurate
- [ ] Daily limits enforced
- [ ] Stripe webhook processes correctly

### Phase 3 (Subscriptions) Tests
- [ ] Subscription creation works
- [ ] Auto-refill credits monthly
- [ ] Cancellation flow functional
- [ ] Portal access works
- [ ] Webhook handles all events

---

## 🚨 Risk Mitigation

| Risk | Mitigation Strategy |
|------|---------------------|
| **Shtuu character not ready** | Launch with text-only dialogue, add character later |
| **Generation too slow** | Show engaging animation, set expectations |
| **Credit economy imbalance** | Start conservative, A/B test pricing |
| **Watermark easily removed** | Legal terms, embedded watermark |
| **Low conversion rate** | Iterate on dialogue copy, optimize funnel |

---

## 📞 Support & Questions

### For Technical Questions
- Review **SHTUU_TECHNICAL_SPEC.md**
- Check **SHTUU_API_DESIGN.md**

### For Component Questions
- Review **SHTUU_COMPONENT_GUIDE.md**

### For Timeline/Scope Questions
- Review **SHTUU_IMPLEMENTATION_TASKS.md**

### For Product Questions
- Review **PRD_SHTUU_FREEMIUM.md**

---

## ✅ Pre-Launch Checklist

### Week Before Launch
- [ ] All Phase 1 tasks completed
- [ ] Database migrations tested
- [ ] Shtuu character assets ready
- [ ] Email templates approved
- [ ] Analytics events configured
- [ ] Error monitoring set up

### Launch Day
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Watch generation metrics
- [ ] Track email deliverability
- [ ] Gather user feedback

### Week After Launch
- [ ] Review success metrics
- [ ] Identify friction points
- [ ] Plan iterations
- [ ] Prepare Phase 2

---

## 🎯 North Star Metrics

1. **Weekly Active Users (WAU)** - Target: 1,000+ by end of Q1 2026
2. **Free → Paid Conversion** - Target: 10% (industry avg: 2-5%)
3. **Monthly Recurring Revenue (MRR)** - Target: $5,000+ by Q1 2026
4. **Customer Lifetime Value (LTV)** - Target: $25+
5. **Viral Coefficient** - Target: 0.3+ (30% invite a friend)

---

## 🔄 Migration from Current PawPop

### Week 1: Parallel Testing (10% traffic)
- Route 10% of new visitors to `/shtuu`
- Keep existing `/` experience for 90%
- Monitor comparative metrics

### Week 2: Ramp Up (50% traffic)
- If metrics positive, increase to 50/50 split
- Gather qualitative feedback
- Iterate on dialogue flow

### Week 3: Full Migration (100% traffic)
- Redirect all new users to Shtuu
- Keep legacy artwork pages accessible
- Archive old purchase modals

### Rollback Plan
- If metrics decline >20%, revert to original
- Preserve credit balances as coupons
- Keep dialogue session data for analysis

---

## 📚 Additional Resources

### Design Inspiration
- Tamagotchi virtual pets
- Duolingo character interactions
- Replika AI companion
- Animal Crossing shop interactions

### Technical References
- Stripe Billing Documentation
- fal.ai API Reference
- Supabase RLS Policies
- Next.js App Router Patterns

---

## 🎉 Vision Statement

> "By the end of 2026, Shtuu's Studio will be the most delightful way for pet owners to create shareable art, converting curiosity into emotional attachment, and emotional attachment into recurring revenue — all while making users smile."

**Let's build something magical.** 🪄✨

---

**Last Updated:** October 27, 2025  
**Next Review:** November 1, 2025 (after MVP launch)
