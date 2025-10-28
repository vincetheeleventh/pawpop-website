# Shtuu's Studio - Implementation Task List

**Version:** 1.0  
**Date:** October 27, 2025  
**Target Launch:** October 31, 2025 (MVP v1)  
**Related:** SHTUU_TECHNICAL_SPEC.md, SHTUU_API_DESIGN.md, SHTUU_COMPONENT_GUIDE.md  

---

## 1. Implementation Phases

### **Phase 1: MVP (v1) - Oct 31, 2025**
**Goal:** Prototype questionnaire → backend image generation → email capture

### **Phase 2: Credit System (v2) - Nov 15, 2025**
**Goal:** Snack/credit backend + Stripe integration

### **Phase 3: Subscription (v3) - Dec 1, 2025**
**Goal:** Subscription logic + recurring rewards

### **Phase 4: Advanced Features (v4) - Dec 15, 2025**
**Goal:** Personal idea input + editing features

---

## 2. Phase 1: MVP Tasks (Oct 27-31, 2025) - 63 hours

**Goal:** Launch questionnaire → generation → email capture

**Status:** 🟡 In Progress (40% Complete)

### 2.1 Database Setup (Priority: CRITICAL)

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| DB-001 | Create `dialogue_sessions` table | 1h | Schema design | ✅ Complete |
| DB-002 | Create indexes for session lookups | 0.5h | DB-001 | ✅ Complete |
| DB-003 | Add `parody_style` column to `artworks` | 0.5h | Existing schema | ✅ Complete |
| DB-004 | Create migration script | 0.5h | DB-001, DB-003 | ✅ Complete |
| DB-005 | Apply migration via Supabase MCP | 0.5h | DB-004 | ✅ Complete |

**Total Estimate:** 3 hours

---

### 2.2 Backend API Development (Priority: CRITICAL)

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| API-001 | Create `/api/shtuu/dialogue/start` endpoint | 2h | DB-001 | ✅ Complete |
| API-002 | Create `/api/shtuu/dialogue/respond` endpoint | 2h | DB-001, API-001 | ✅ Complete |
| API-003 | Create `/api/shtuu/dialogue/upload` endpoint | 3h | DB-001, API-002 | ✅ Complete |
| API-004 | Create `/api/shtuu/status` polling endpoint | 1h | DB-001 | ✅ Complete |
| API-005 | Create `/api/shtuu/generate` with parody templates | 4h | Existing fal.ai integration | ✅ Complete |
| API-006 | Implement watermarking for free tier images | 3h | API-005 | ⬜ Pending |
| API-007 | Create email template for free artwork delivery | 2h | Existing email system | ⬜ Pending |
| API-008 | Add error handling and logging to all endpoints | 2h | All API tasks | ⬜ Pending |

**Total Estimate:** 19 hours

**Key Implementation Notes:**
- **API-005:** Reuse existing `/api/monalisa-maker/route.ts` pattern
- **API-006:** Use `sharp` library for watermark overlay
- **API-007:** Extend existing Resend email templates

---

### 2.3 Frontend Components (Priority: HIGH)

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| FE-001 | Create `ShtuuCharacter` component (emoji placeholders) | 4h | None | ✅ Complete |
| FE-002 | Create `DialogueBox` component with typewriter | 3h | None | ✅ Complete |
| FE-003 | Pet type selection (integrated in DialogueBox) | 1h | FE-002 | ✅ Complete |
| FE-004 | Create `ImageUploadZone` for dialogue flow | 3h | Existing UploadThing | ✅ Complete |
| FE-005 | Create `GeneratingAnimation` with polling | 3h | API-004 | ✅ Complete |
| FE-006 | Create `ArtworkReveal` component | 3h | API-005 | ✅ Complete |
| FE-007 | Create `ShtuuStudio` container component | 4h | FE-001 to FE-006 | ✅ Complete |
| FE-008 | Create `/shtuu` landing page | 2h | FE-007 | ✅ Complete |
| FE-009 | Add responsive styling for mobile | 3h | FE-008 | ✅ Complete |

**Total Estimate:** 26 hours

**Assets Status:**
- [x] Shtuu character (using emoji placeholders: 😌 🎨 😊 🤔)
- [x] Pixel (cat) (using emoji placeholder: 🐱)
- [x] Studio background (using CSS gradient)
- [x] Icons (using Lucide icons + emoji)

---

### 2.4 Custom Hooks (Priority: MEDIUM)

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| HOOK-001 | Create `useDialogueSession` hook | 2h | API-001, API-002 | ⬜ Pending |
| HOOK-002 | Add dialogue state persistence to localStorage | 1h | HOOK-001 | ⬜ Pending |
| HOOK-003 | Add error handling to hooks | 1h | HOOK-001, HOOK-002 | ⬜ Pending |

**Total Estimate:** 4 hours

---

### 2.5 Testing & QA (Priority: HIGH)

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| TEST-001 | Unit tests for all components | 2h | FE-001 to FE-006 | ✅ Complete (30 tests passing) |
| TEST-002 | Integration tests for dialogue flow APIs | 2h | API-001, API-002, API-003 | ✅ Complete (created) |
| TEST-003 | E2E tests for complete user journey | 2h | All FE tasks | ⬜ Pending (8 created, need dev server) |
| TEST-004 | Test image upload and generation | 2h | API-005, FE-004 | ⬜ Pending |
| TEST-005 | Test email delivery | 1h | API-007 | ⬜ Pending |
| TEST-006 | Test watermark application | 1h | API-006 | ⬜ Pending |
| TEST-007 | Mobile responsiveness testing | 1h | FE-009 | ⬜ Pending |

**Total Estimate:** 11 hours

---

### **Phase 1 Total: 63 hours (~8 working days)**

**Critical Path:**
```
DB Setup (3h) → API Development (19h) → Frontend (26h) → Testing (11h)
```

**Parallel Work Opportunities:**
- Design can create Shtuu assets while backend APIs are being built
- Frontend components can be built against mock API responses

---

## 3. Phase 2: Credit System Tasks (Nov 1-15, 2025)

### 3.1 Database Enhancements

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| DB-101 | Create `credit_transactions` table | 1h | Phase 1 complete | ⬜ Pending |
| DB-102 | Create `subscription_plans` table | 1h | None | ⬜ Pending |
| DB-103 | Add credit fields to `users` table | 30min | None | ⬜ Pending |
| DB-104 | Create credit transaction triggers | 2h | DB-101 | ⬜ Pending |
| DB-105 | Add credit balance constraint (no negatives) | 1h | DB-101, DB-103 | ⬜ Pending |

**Total Estimate:** 5.5 hours

---

### 3.2 Credit Economy APIs

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| API-101 | Create `/api/shtuu/credits/balance` endpoint | 2h | DB-103 | ⬜ Pending |
| API-102 | Create `/api/shtuu/credits/purchase` endpoint | 3h | DB-101, Stripe | ⬜ Pending |
| API-103 | Create `/api/shtuu/credits/transactions` endpoint | 2h | DB-101 | ⬜ Pending |
| API-104 | Implement credit deduction logic | 3h | DB-101, DB-104 | ⬜ Pending |
| API-105 | Create Stripe checkout session for credits | 3h | API-102, Stripe SDK | ⬜ Pending |
| API-106 | Handle Stripe webhook for credit purchases | 4h | API-105 | ⬜ Pending |
| API-107 | Add credit validation to generation endpoint | 2h | API-104 | ⬜ Pending |

**Total Estimate:** 19 hours

---

### 3.3 Credit UI Components

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| FE-101 | Create `CreditBalance` component | 2h | API-101 | ⬜ Pending |
| FE-102 | Create `useCreditBalance` hook | 2h | API-101 | ⬜ Pending |
| FE-103 | Create `CreditPurchaseModal` component | 4h | API-102 | ⬜ Pending |
| FE-104 | Create `/shtuu/credits` page | 3h | FE-101, FE-102 | ⬜ Pending |
| FE-105 | Add "Shtuu needs snacks!" dialogue for low credits | 2h | FE-102 | ⬜ Pending |
| FE-106 | Create `TransactionHistory` component | 3h | API-103 | ⬜ Pending |
| FE-107 | Add credit cost indicators to all actions | 2h | FE-102 | ⬜ Pending |

**Total Estimate:** 18 hours

---

### 3.4 Stripe Integration

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| STRIPE-101 | Create Stripe products for credit packs | 1h | None | ⬜ Pending |
| STRIPE-102 | Set up Stripe webhook endpoint | 2h | API-106 | ⬜ Pending |
| STRIPE-103 | Test credit purchase flow end-to-end | 2h | STRIPE-101, STRIPE-102 | ⬜ Pending |
| STRIPE-104 | Add webhook idempotency handling | 2h | STRIPE-102 | ⬜ Pending |

**Total Estimate:** 7 hours

---

### 3.5 Free Tier Protection

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| SEC-101 | Implement daily limit tracking (3 free/day) | 3h | DB-001 | ⬜ Pending |
| SEC-102 | Create `/api/shtuu/free-tier/check` endpoint | 2h | SEC-101 | ⬜ Pending |
| SEC-103 | Add rate limiting to generation endpoints | 2h | SEC-102 | ⬜ Pending |
| SEC-104 | Implement IP-based throttling | 2h | SEC-102 | ⬜ Pending |

**Total Estimate:** 9 hours

---

### **Phase 2 Total: 58.5 hours (~7 working days)**

---

## 4. Phase 3: Subscription Tasks (Nov 16 - Dec 1, 2025)

### 4.1 Subscription Backend

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| SUB-001 | Create `/api/shtuu/subscription/create` endpoint | 3h | Phase 2 complete | ⬜ Pending |
| SUB-002 | Create `/api/shtuu/subscription/manage` portal | 2h | SUB-001 | ⬜ Pending |
| SUB-003 | Handle subscription lifecycle webhooks | 4h | SUB-001 | ⬜ Pending |
| SUB-004 | Implement auto-refill credit logic | 3h | SUB-003, DB-101 | ⬜ Pending |
| SUB-005 | Create subscription renewal email | 2h | SUB-004 | ⬜ Pending |
| SUB-006 | Handle subscription cancellation | 2h | SUB-003 | ⬜ Pending |

**Total Estimate:** 16 hours

---

### 4.2 Subscription UI

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| FE-201 | Create subscription plan comparison cards | 4h | SUB-001 | ⬜ Pending |
| FE-202 | Create `/shtuu/subscription` page | 3h | FE-201 | ⬜ Pending |
| FE-203 | Add subscription upsell to credit page | 2h | FE-201 | ⬜ Pending |
| FE-204 | Create subscription status indicator | 2h | SUB-001 | ⬜ Pending |
| FE-205 | Add "Manage Subscription" link | 1h | SUB-002 | ⬜ Pending |

**Total Estimate:** 12 hours

---

### 4.3 Subscription Features

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| FEAT-201 | Unlock exclusive parody styles for subscribers | 3h | SUB-001, API-005 | ⬜ Pending |
| FEAT-202 | Implement priority generation queue | 4h | SUB-001, API-005 | ⬜ Pending |
| FEAT-203 | Add "mystery art" monthly bonus | 3h | SUB-004 | ⬜ Pending |

**Total Estimate:** 10 hours

---

### **Phase 3 Total: 38 hours (~5 working days)**

---

## 5. Phase 4: Advanced Features (Dec 1-15, 2025)

### 5.1 Custom Idea Input

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| ADV-001 | Add custom prompt input to dialogue | 3h | Phase 3 complete | ⬜ Pending |
| ADV-002 | Implement prompt safety filtering | 3h | ADV-001 | ⬜ Pending |
| ADV-003 | Create AI prompt enhancement system | 4h | ADV-001 | ⬜ Pending |
| ADV-004 | Add "Shtuu's suggestions" feature | 3h | ADV-003 | ⬜ Pending |

**Total Estimate:** 13 hours

---

### 5.2 Editing & Variations

| Task | Description | Estimate | Dependencies | Status |
|------|-------------|----------|--------------|--------|
| EDIT-001 | Create `/api/shtuu/variation` endpoint | 3h | API-005 | ⬜ Pending |
| EDIT-002 | Implement "try again" with variations | 3h | EDIT-001 | ⬜ Pending |
| EDIT-003 | Add simple editing tools (crop, rotate) | 6h | EDIT-001 | ⬜ Pending |
| EDIT-004 | Create variation history UI | 4h | EDIT-001 | ⬜ Pending |

**Total Estimate:** 16 hours

---

### **Phase 4 Total: 29 hours (~4 working days)**

---

## 6. Ongoing Tasks (All Phases)

### 6.1 Analytics & Monitoring

| Task | Description | Frequency | Estimate/Week |
|------|-------------|-----------|---------------|
| MON-001 | Set up Plausible events for Shtuu funnel | One-time | 2h |
| MON-002 | Create monitoring dashboard for credit economy | One-time | 4h |
| MON-003 | Track generation success/failure rates | Ongoing | 1h |
| MON-004 | Monitor subscription churn | Ongoing | 1h |

---

### 6.2 Documentation

| Task | Description | Estimate | Dependencies |
|------|-------------|----------|--------------|
| DOC-001 | Update README with Shtuu setup instructions | 2h | Phase 1 complete |
| DOC-002 | Create admin guide for credit management | 2h | Phase 2 complete |
| DOC-003 | Document subscription lifecycle | 2h | Phase 3 complete |
| DOC-004 | Create troubleshooting guide | 2h | Phase 4 complete |

**Total Estimate:** 8 hours

---

## 7. Task Assignment Recommendations

### **Solo Developer Timeline (Full-Time)**
- **Week 1 (Oct 27-31):** Phase 1 MVP - 63 hours (overtime required)
- **Week 2 (Nov 1-8):** Phase 2 Credit System - 58.5 hours
- **Week 3 (Nov 11-15):** Phase 2 Testing + Phase 3 Start
- **Week 4 (Nov 18-22):** Phase 3 Subscription Complete
- **Week 5 (Nov 25-29):** Phase 4 Advanced Features
- **Week 6 (Dec 2-6):** Polish & Launch Prep

### **Team of 2 (Backend + Frontend)**
- **Backend Developer:** DB + API tasks
- **Frontend Developer:** UI components + hooks
- **Overlap:** Testing and integration

**Estimated Timeline:** 3-4 weeks to production

---

## 8. Critical Dependencies

### 8.1 External Services Required
- [x] Supabase (already integrated)
- [x] fal.ai (already integrated)
- [x] Stripe (already integrated)
- [x] Resend (already integrated)
- [x] UploadThing (already integrated)
- [ ] Watermarking library (`sharp` - needs installation)

### 8.2 Design Assets Required
- [ ] Shtuu character sprite sheets (32 frames)
- [ ] Pixel cat sprite (4 frames)
- [ ] Studio background
- [ ] Snack/credit icons (3-4 variations)
- [ ] Parody style preview images (4 styles)

### 8.3 Content Required
- [ ] Shtuu dialogue scripts (8-10 responses per step)
- [ ] Email templates (4 templates)
- [ ] Marketing copy for subscription plans
- [ ] FAQ content

---

## 9. Risk Mitigation

### High Risk Items

| Risk | Impact | Mitigation | Owner |
|------|--------|------------|-------|
| Shtuu character not ready by Oct 31 | HIGH | Use placeholder character, launch with text-only | Design |
| fal.ai generation too slow | HIGH | Add progress updates, optimize prompts | Backend |
| Credit economy imbalanced | MEDIUM | A/B test pricing, monitor metrics | Product |
| Watermark easily removable | MEDIUM | Use embedded watermark, legal terms | Backend |
| Subscription churn too high | HIGH | Improve onboarding, add value | Product |

---

## 10. Launch Checklist (Oct 31, 2025)

### Pre-Launch (MVP v1)
- [ ] All Phase 1 tasks completed
- [ ] Database migrations applied to production
- [ ] Environment variables configured
- [ ] Free tier limits tested
- [ ] Email delivery working
- [ ] Watermarks applied correctly
- [ ] 4 parody styles generating successfully
- [ ] Mobile responsive
- [ ] Analytics tracking functional
- [ ] Error handling tested

### Launch Day
- [ ] Deploy to Vercel production
- [ ] Monitor error logs
- [ ] Watch generation success rate
- [ ] Track email deliverability
- [ ] Monitor user drop-off points

### Post-Launch (Week 1)
- [ ] Gather user feedback
- [ ] Fix critical bugs
- [ ] Optimize slow endpoints
- [ ] Iterate on dialogue copy
- [ ] Prepare Phase 2 deployment

---

## 11. Success Metrics (MVP v1)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Dialogue completion rate | ≥60% | Plausible funnel |
| Email capture rate | ≥40% | Database query |
| Time to first artwork | <90 seconds | Generation logs |
| Generation success rate | ≥95% | Error monitoring |
| User satisfaction (survey) | >60% | Post-reveal survey |

---

## 12. Phase Rollout Strategy

### Week 1: Soft Launch (10% traffic)
- Route 10% of `/` traffic to `/shtuu`
- Monitor metrics vs. control group
- Gather qualitative feedback

### Week 2: Ramp Up (50% traffic)
- If metrics positive, increase to 50%
- Implement quick iterations

### Week 3: Full Launch (100% traffic)
- Redirect all new users to Shtuu experience
- Keep legacy PawPop for existing customers

---

## 13. Next Steps (Immediate Actions)

### Priority 1 (This Week)
1. **Set up development branch:** `feature/shtuu-studio`
2. **Create database migrations** (DB-001 to DB-005)
3. **Set up Shtuu API folder structure** (`/api/shtuu/`)
4. **Start Shtuu character design** (coordinate with designer)
5. **Implement dialogue start endpoint** (API-001)

### Priority 2 (Next Week)
1. Build core dialogue flow components
2. Integrate with existing fal.ai generation
3. Test end-to-end flow
4. Prepare for soft launch

---

## 14. Budget Estimates

### Development Time
- **Phase 1:** 63 hours × $75/hr = $4,725
- **Phase 2:** 58.5 hours × $75/hr = $4,387.50
- **Phase 3:** 38 hours × $75/hr = $2,850
- **Phase 4:** 29 hours × $75/hr = $2,175
- **Total Development:** $14,137.50

### Design Assets
- Shtuu character design: $500-1,000
- Animation sprite sheets: $1,000-1,500
- UI assets & icons: $300-500
- **Total Design:** $1,800-3,000

### Infrastructure (Monthly)
- No new costs (using existing services)

**Grand Total (One-Time):** $15,937.50 - $17,137.50

---

## 15. Appendix: Quick Reference Commands

```bash
# Create development branch
git checkout -b feature/shtuu-studio

# Apply database migrations
npm run migration:apply supabase/migrations/015_shtuu_dialogue_sessions.sql

# Run development server
npm run dev

# Test API endpoints
npm run test:api

# Deploy to staging
vercel --prod
```
