# MVP Implementation Roadmap - 3 Months

**Target Launch:** 12 weeks from start  
**Status:** Planning Phase

---

## Week 1-2: Database & Auth Foundation

### Deliverables
- [ ] Migration 025: Credits, projects, storybook_pages tables
- [ ] Welcome credits automation (20 credits on signup)
- [ ] Credit deduction/addition functions
- [ ] Supabase Auth with magic links
- [ ] Migrate existing customers (link emails to accounts)

**Files to Create:**
- `/supabase/migrations/025_diy_platform_schema.sql`
- `/src/lib/auth.ts`
- `/src/contexts/AuthContext.tsx`
- `/src/lib/credits.ts`

**Files to Modify:**
- `/src/app/api/webhook/route.ts` (add credit purchase handling)

---

## Week 3-4: Credit Purchase Flow

### Deliverables
- [ ] Credit balance API (`/api/credits/balance`)
- [ ] Stripe checkout for credit packs (1, 10, 50 credits)
- [ ] Webhook handler for credit fulfillment
- [ ] Credit purchase confirmation emails
- [ ] Credit balance UI component

**Credit Pricing (Updated with Real fal.ai Costs):**
- 1 credit: $1.00 (casual users)
- 10 credits: $7.00 ($0.70 each, 30% savings)
- 50 credits: $25.00 ($0.50 each, 50% savings) ⭐ Most Popular
- 100 credits: $40.00 ($0.40 each, 60% savings)

**Margins (at $0.12 fal.ai cost per composite):**
- Single credit: 88% margin
- 50-pack: 76% margin
- 100-pack: 70% margin

**New API Routes:**
- `/api/credits/balance/route.ts`
- `/api/credits/purchase/route.ts`
- `/api/credits/deduct/route.ts`

---

## Week 5-6: Gallery Dashboard

### Deliverables
- [ ] Gallery page (`/gallery`) with auth protection
- [ ] Display all user artworks with tags
- [ ] Tag filtering system
- [ ] Credit balance header
- [ ] "New Creation" and "Start Storybook" CTAs
- [ ] Muse welcome message component
- [ ] In-progress projects preview

**Reuse from Admin Dashboard:**
- Grid layout from `/src/app/admin/reviews/page.tsx`
- Filtering logic
- Card components

**New Components:**
- `/src/app/gallery/components/GalleryGrid.tsx`
- `/src/app/gallery/components/TagFilter.tsx`
- `/src/app/gallery/components/CreditBalance.tsx`
- `/src/app/gallery/components/MuseMessage.tsx`

---

## Week 7-8: Creation & Remix Studio

### Deliverables
- [ ] New creation flow (upload photo) with credit cost
- [ ] Remix interface for existing artworks
- [ ] Guided style selection (Mona Lisa, Starry Night, etc.)
- [ ] Mood adjustments (warmer/cooler/brighter)
- [ ] Real-time generation status with Muse commentary
- [ ] Credit deduction before generation
- [ ] Automatic refund on failure

**Credit Costs:**
- New generation (composite): 1 credit
- Remix/style change: 1 credit
- Simple generation: 1 credit

**New Routes:**
- `/src/app/create/page.tsx`
- `/src/app/create/remix/[artworkId]/page.tsx`
- `/src/app/api/generate/new/route.ts`
- `/src/app/api/generate/remix/route.ts`

**Reuse:**
- `/src/components/forms/UploadModal.tsx` logic
- `/src/app/api/monalisa-maker/route.ts` (add credit check)
- `/src/app/api/pet-integration/route.ts` (add credit check)

---

## Week 9-10: Storybook MVP

### Deliverables
- [ ] One template: "A Day in the Life" (8 pages)
- [ ] Project creation wizard
- [ ] Character assignment (upload or select from gallery)
- [ ] Page-by-page generation with prompts
- [ ] Save draft functionality
- [ ] Text editing per page
- [ ] Export to PDF
- [ ] Share link generation

**Template Structure:**
```json
{
  "id": "day_in_life",
  "pages": 8,
  "credit_cost": 24,
  "scenes": ["wake_up", "breakfast", "play", "lunch", "nap", "walk", "dinner", "bedtime"]
}
```

**New Routes:**
- `/src/app/storybook/new/page.tsx`
- `/src/app/storybook/[projectId]/page.tsx`
- `/src/app/storybook/[projectId]/preview/page.tsx`
- `/src/app/api/projects/create/route.ts`
- `/src/app/api/projects/[projectId]/generate-page/route.ts`

**Character Consistency:**
- Use fal.ai's consistent character generation
- Store character reference image in project metadata
- Generate all pages with same character embedding

---

## Week 11: Social Sharing & Viral Features

### Deliverables
- [ ] Public gallery links (share_token)
- [ ] Social media preview cards (OG images)
- [ ] "Made with [Brand]" watermarks on shared images
- [ ] Referral system (give 5, get 5 credits)
- [ ] Gallery view counter
- [ ] Referral tracking

**New Routes:**
- `/src/app/share/[shareToken]/page.tsx` (public view)
- `/src/app/api/share/create/route.ts`
- `/src/app/api/referrals/track/route.ts`

---

## Week 12: Polish & Launch Prep

### Deliverables
- [ ] Muse character illustration and personality polish
- [ ] Onboarding flow optimization
- [ ] Email templates (welcome, credit purchase, project reminders)
- [ ] Error handling and fallbacks
- [ ] Loading states and animations
- [ ] Mobile responsive design
- [ ] Beta testing with 50 users
- [ ] Analytics dashboard setup

**Key Metrics to Track:**
- Sign-up conversion rate
- First generation completion rate
- D1, D7, D30 retention
- Credits purchased per user
- Project completion rate
- Referral conversion rate

---

## Technical Reuse Summary

### ✅ Keep & Adapt
| Current File | New Purpose |
|-------------|-------------|
| `UploadModal.tsx` | Creation wizard (add credit check) |
| `/admin/reviews` page | Gallery dashboard |
| `/admin/reviews/[id]` page | Remix studio |
| `supabase-artworks.ts` | Enhanced with tags, projects |
| `fal.ai` integration | Add credit deduction |
| `printify.ts` | Storybook printing |
| Email system | Add credit purchase emails |

### ❌ Remove
- Manual approval workflow for user edits
- Anonymous token access (auth required)
- One-time purchase modal (credits only)

### ➕ New
- Credits system (database + APIs)
- Projects system (storybooks)
- Social sharing
- Referral tracking
- Muse guide character

---

## Launch Criteria

### Must Have (MVP)
- ✅ User auth & credit system working
- ✅ Gallery with tagging functional
- ✅ New creation + remix operational
- ✅ 1 storybook template complete
- ✅ Social sharing enabled
- ✅ No critical bugs

### Nice to Have (Post-Launch)
- Voice-enabled Muse
- Multiple storybook templates
- Team/family accounts
- Advanced remixing options
- Mobile app

---

## Risk Mitigation

### Risk: Credit economics don't work
**Mitigation:** A/B test pricing with beta users before launch

### Risk: Users don't return after first session
**Mitigation:** Email reminders, unfinished project nudges, seasonal templates

### Risk: Storybook complexity too high
**Mitigation:** Start with 4-page "mini stories" instead of 8

### Risk: Character consistency fails
**Mitigation:** Have manual QA review first 100 storybooks

---

## Next Actions

1. **Create migration 025** (credits + projects schema)
2. **Design Muse character** (illustration + personality doc)
3. **Set up Stripe credit products**
4. **Wireframe gallery dashboard** (high-fidelity mockups)
5. **Validate fal.ai character consistency** (technical spike)

**Start Date:** TBD  
**Team:** TBD  
**Budget:** TBD
