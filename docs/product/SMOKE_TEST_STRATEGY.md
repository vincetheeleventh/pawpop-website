# Smoke Test Strategy: PawPop → DIY Platform Bridge

**Purpose:** Validate market demand for DIY subscription service BEFORE building it  
**Timeline:** 2-4 weeks to run test, gather data, make go/no-go decision  
**Investment:** Minimal ($500-2000 for video/landing page)

---

## 🎯 Core Hypothesis to Test

**"Users who love their Mona Lisa result will pay for ongoing access to create more AI art for their loved ones."**

### What We Need to Learn

1. **Interest Level:** What % of users want DIY vs one-time purchase?
2. **Price Sensitivity:** Will they pay $25 for 50 credits? Or prefer $9.99/month subscription?
3. **Use Cases:** What would they create next? (Family portraits? Storybooks? Gifts?)
4. **Viral Potential:** Do they share their creations and refer friends?
5. **Retention Signal:** Do they return to the landing page multiple times?

---

## 🚀 Smoke Test MVP: "The Fork in the Road"

### Current PawPop Flow (Baseline)
```
Landing → Upload → Generate → Artwork Page → Purchase → Done
```

### New Flow (A/B Test)
```
Landing → Upload → Generate → Artwork Page → 🔀 CHOICE POINT
                                                ↓
                                    ┌───────────┴───────────┐
                                    ↓                       ↓
                            ONE-TIME PURCHASE        DIY WAITLIST
                            (Current PawPop)         (New Option)
                                    ↓                       ↓
                            Stripe Checkout          Email Capture
                                    ↓                       ↓
                                  Done              "Coming Soon!" Page
```

---

## 🎨 Implementation: The Choice Point

### Artwork Page Enhancement

After user sees their generated Mona Lisa, show **two clear paths**:

```
┌─────────────────────────────────────────────────────────┐
│  🎨 Your Masterpiece is Ready!                         │
│                                                         │
│  [Generated Mona Lisa Image]                           │
│                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                         │
│  Love it? Here's what you can do:                      │
│                                                         │
│  ┌────────────────────┐  ┌────────────────────────┐   │
│  │  🖼️ GET THIS ONE    │  │  ✨ CREATE UNLIMITED   │   │
│  │                    │  │                        │   │
│  │  Get this artwork  │  │  Join our DIY Studio   │   │
│  │  printed & shipped │  │  & make art anytime    │   │
│  │                    │  │                        │   │
│  │  FROM $19.99       │  │  $25 for 50 artworks   │   │
│  │                    │  │                        │   │
│  │  [Order Now]       │  │  [Join Waitlist] 🔥    │   │
│  └────────────────────┘  └────────────────────────┘   │
│                                                         │
│  "This is just the beginning. Imagine creating art     │
│   of your whole family, your pets, your memories..."   │
└─────────────────────────────────────────────────────────┘
```

### Copy Strategy (Positioning)

**One-Time Purchase (Left Option):**
- "Love this one? Get it printed!"
- Emphasize: Physical product, gift-ready, hassle-free
- Target: Customers who want this specific artwork

**DIY Waitlist (Right Option):** ⭐ **NEW**
- "Want to create unlimited art like this?"
- Emphasize: Ongoing creativity, family projects, storybooks
- Target: Customers who see bigger possibilities

---

## 📹 The "Fake Demo" Video (30-60 seconds)

### Video Concept: "What if you could create art anytime?"

**Script:**
```
[0:00-0:05] Show: User's actual Mona Lisa result
"You just created this in 2 minutes..."

[0:05-0:15] Show: Mockup of gallery with multiple artworks
"Imagine having a whole gallery of your loved ones..."

[0:15-0:25] Show: Mockup of storybook being created
"Or turning your photos into a children's storybook..."

[0:25-0:35] Show: Mockup of remix interface
"Change styles, adjust colors, try different art parodies..."

[0:35-0:45] Show: Mockup of sharing/gifting
"Create personalized gifts for every occasion..."

[0:45-0:55] Show: Muse character waving
"With your personal creative guide helping you every step..."

[0:55-1:00] CTA
"Join the waitlist for early access"
[Email signup form]
```

**Production:**
- Use Figma mockups + screen recordings
- Add voiceover (you or Fiverr, $50-100)
- Music from Epidemic Sound ($15/month)
- Edit in CapCut (free) or Descript ($20/month)
- **Total cost: $50-200**

### Video Placement
1. On "DIY Waitlist" landing page (hero section)
2. In follow-up email to customers who chose one-time purchase
3. On social media (TikTok, Instagram) for cold acquisition

---

## 📧 Email Funnel Strategy

### Email 1: Immediate (After Artwork Generation)
**Subject:** "Your masterpiece is ready! 🎨"

**Body:**
```
[Generated artwork image]

Amazing work! Your Mona Lisa is ready.

Here's what you can do:

1. Get it printed & shipped → [Order Now]
2. Create unlimited art like this → [Join DIY Waitlist]

P.S. - Imagine creating a whole storybook of your pet's 
adventures, or art of your entire family in famous paintings. 
That's what we're building next. Want early access?
```

**Goal:** Capture emails of interested users who don't purchase yet

---

### Email 2: 24 Hours Later (One-Time Purchasers)
**Subject:** "Want to create more? (Special offer inside)"

**Body:**
```
Hey [Name],

So glad you loved your Mona Lisa artwork!

Quick question: Would you ever want to create MORE art like this?

→ Art of your whole family
→ Different art styles (Starry Night, Girl with Pearl Earring)
→ Create storybooks for your kids/grandkids
→ Make unique gifts for every occasion

We're building a DIY studio where you can create unlimited 
art for one simple price.

[Watch 60-second demo video]

Interested? Join 327 others on the waitlist:
[Get Early Access]

- The PawPop Team
```

**Goal:** Convert happy one-time customers to DIY waitlist

---

### Email 3: 48 Hours Later (Waitlist Signups)
**Subject:** "Quick question about DIY art creation"

**Body:**
```
Hey [Name],

Thanks for joining the DIY Studio waitlist!

Quick question to help us build this right:

What would you create first if you could make unlimited art?

[ ] More pet portraits (different styles)
[ ] Art of my family members
[ ] A children's storybook
[ ] Gifts for upcoming occasions
[ ] Just explore and have fun

[Click your answer - 1-click survey]

Also - what price sounds fair?

[ ] $9.99/month subscription
[ ] $25 for 50 artworks (credits)
[ ] $50 for unlimited for 3 months

Your feedback shapes what we build!

P.S. - First 100 people get 50% off when we launch. 
You're on the list. 🎉
```

**Goal:** Gather pricing and use case data

---

## 🎯 Success Metrics (Validation Criteria)

### Run Test for 2-4 Weeks, Then Evaluate

**Minimum Viable Success (GO Signal):**
- [ ] **20%+ of artwork viewers** click "Join Waitlist"
- [ ] **500+ email signups** for DIY waitlist
- [ ] **40%+ survey response rate** on pricing/use cases
- [ ] **60%+ say $25 for 50 credits** is "fair" or "great value"
- [ ] **Top use case:** Creating more family portraits or storybooks (not just pets)

**Strong Success (DEFINITELY BUILD):**
- [ ] **40%+ of artwork viewers** choose DIY over one-time
- [ ] **1000+ email signups** in 4 weeks
- [ ] **Users share waitlist link** unprompted (viral coefficient >0.1)
- [ ] **Multiple users email asking** "When is this available?"
- [ ] **Existing customers reply** to email saying "I'd pay for this today!"

**Failure Signal (PIVOT/STOP):**
- [ ] **<5% click** "Join Waitlist"
- [ ] **<100 signups** after 4 weeks
- [ ] **Survey says:** "Too expensive" or "I'd only use it once"
- [ ] **No organic sharing** or referrals

---

## 🛠️ Technical Implementation (Minimal)

### Week 1: Setup (2-3 days of dev work)

#### 1. Add Choice Point to Artwork Page
**File:** `/src/app/artwork/[token]/page.tsx`

```typescript
// Add after artwork display, before purchase button
{showDIYOption && (
  <div className="grid md:grid-cols-2 gap-6 mt-8">
    {/* One-Time Purchase */}
    <div className="border rounded-xl p-6">
      <h3 className="text-xl font-bold mb-2">🖼️ Get This One</h3>
      <p className="text-gray-600 mb-4">
        Print & ship this artwork
      </p>
      <p className="text-2xl font-bold mb-4">From $19.99</p>
      <button 
        onClick={() => setShowPurchaseModal(true)}
        className="btn-primary w-full"
      >
        Order Now
      </button>
    </div>

    {/* DIY Waitlist */}
    <div className="border-2 border-cyclamen rounded-xl p-6 relative">
      <div className="absolute -top-3 right-4 bg-cyclamen text-white px-3 py-1 rounded-full text-sm">
        🔥 New!
      </div>
      <h3 className="text-xl font-bold mb-2">✨ Create Unlimited</h3>
      <p className="text-gray-600 mb-4">
        Join our DIY Studio & make art anytime
      </p>
      <p className="text-2xl font-bold mb-4">$25 for 50 artworks</p>
      <button 
        onClick={() => router.push('/diy-waitlist')}
        className="btn-secondary w-full"
      >
        Join Waitlist
      </button>
    </div>
  </div>
)}
```

#### 2. Create DIY Waitlist Landing Page
**File:** `/src/app/diy-waitlist/page.tsx`

**Structure:**
- Hero: "Create Art Anytime" headline + demo video
- Social proof: "Join 327 creators on the waitlist"
- Email capture form (name + email)
- FAQ section answering common questions
- Example use cases (family portraits, storybooks, gifts)

#### 3. Waitlist Database Table
**Migration:** `/supabase/migrations/026_diy_waitlist.sql`

```sql
CREATE TABLE diy_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT, -- 'artwork_page', 'email_campaign', 'social_media'
  artwork_token TEXT, -- Which artwork led them here
  survey_responses JSONB DEFAULT '{}',
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_diy_waitlist_email ON diy_waitlist(email);
CREATE INDEX idx_diy_waitlist_referral ON diy_waitlist(referral_code);
```

#### 4. Email Automation
**Tool:** Resend (already integrated) or ConvertKit

- Trigger: User joins waitlist → send Email 3 (survey)
- Trigger: User purchases → 24hr delay → send Email 2 (DIY offer)
- Scheduled: Weekly update to waitlist (progress, sneak peeks)

#### 5. Analytics Tracking
**Add Plausible events:**
```typescript
plausible('DIY Waitlist Viewed')
plausible('DIY Waitlist Signup', { 
  props: { source: 'artwork_page' } 
})
plausible('One-Time Purchase Selected')
plausible('DIY Video Played')
plausible('Survey Completed', { 
  props: { price_preference: '$25_50_credits' } 
})
```

---

## 📊 Smoke Test Dashboard

### Track Daily (Google Sheets or Notion)

| Date | Artwork Views | DIY Clicks | DIY Signups | Purchase Clicks | Conversion Rate |
|------|---------------|------------|-------------|-----------------|-----------------|
| Day 1 | 50 | 15 | 8 | 12 | 30% chose DIY |
| Day 2 | 75 | 22 | 12 | 18 | 29% chose DIY |
| ... | ... | ... | ... | ... | ... |

**Key Metric:** % who click DIY vs Purchase
- **Target:** 20%+ for validation
- **Stretch:** 40%+ for strong signal

---

## 🎁 Early Access Incentive Strategy

### Create FOMO & Urgency

**Landing Page Copy:**
```
Join 500+ creators on the waitlist

🎁 First 100 signups get:
- 50% off first credit pack ($25 → $12.50)
- 100 bonus welcome credits (instead of 20)
- Exclusive "Founder" badge
- Early access (launch before public)

[Join Waitlist]

⏰ We're launching in 6 weeks. Don't miss out.
```

**Email Footer (All Emails):**
```
P.S. - You're #47 on the waitlist. First 100 get 50% off + 
100 bonus credits when we launch. Forward this to a friend 
who'd love it!
```

---

## 🔄 Referral Tracking (Viral Growth)

### Give Unique Referral Codes

When user joins waitlist:
```
Thanks for joining! You're #47.

Want to move up the list? Share your unique link:
pawpop.com/diy-waitlist?ref=KATE247

For every friend who joins:
- They get moved to front of line
- You get 10 bonus credits when we launch

[Copy Link] [Share on Instagram] [Share on Facebook]
```

**Database tracking:**
```sql
-- When someone signs up with ?ref=KATE247
INSERT INTO diy_waitlist (email, referred_by, ...)
VALUES ('friend@email.com', 'KATE247', ...);

-- Give referrer bonus credits on launch
UPDATE diy_waitlist 
SET survey_responses = jsonb_set(
  survey_responses, 
  '{bonus_credits}', 
  (COALESCE((survey_responses->>'bonus_credits')::int, 0) + 10)::text::jsonb
)
WHERE referral_code = 'KATE247';
```

---

## 🎬 Demo Video Production Plan

### Option A: DIY (Free - $100)
**Tools:**
- Figma: Create UI mockups (free)
- Canva: Create storybook mockup (free)
- Screen recording: QuickTime/OBS (free)
- Voiceover: You or Fiverr ($50)
- Editing: CapCut (free)
- Music: Epidemic Sound ($15/month)

**Timeline:** 2-3 days
**Cost:** $50-100

### Option B: Pro Explainer Video ($500-1500)
**Hire on Fiverr/Upwork:**
- Search: "Explainer video SaaS product"
- Provide: Script, brand colors, sample mockups
- Get: 60-second animated video

**Timeline:** 1-2 weeks
**Cost:** $500-1500

**Recommendation for Smoke Test:** Option A
- Faster (launch this week)
- Cheaper (validate first, polish later)
- Good enough to test concept

---

## 📅 2-Week Smoke Test Timeline

### Week 1: Build & Launch

**Day 1-2: Development**
- [ ] Add choice point to artwork page
- [ ] Create waitlist landing page
- [ ] Set up database table
- [ ] Add analytics tracking

**Day 3-4: Content Creation**
- [ ] Create demo video (Option A)
- [ ] Write all email copy
- [ ] Design landing page visuals
- [ ] Set up email automation

**Day 5: Soft Launch**
- [ ] Enable for 10% of traffic (A/B test)
- [ ] Monitor for bugs
- [ ] Adjust copy based on initial data

**Day 6-7: Full Launch**
- [ ] Enable for 100% of traffic
- [ ] Send email to existing customer list
- [ ] Post on social media
- [ ] Monitor metrics daily

### Week 2: Optimize & Gather Data

**Day 8-10: Email Campaign**
- [ ] Send follow-up to purchasers (Email 2)
- [ ] Send survey to waitlist signups (Email 3)
- [ ] A/B test subject lines

**Day 11-12: Content Marketing**
- [ ] Post demo video on TikTok/Instagram
- [ ] Share on Reddit (r/crafts, r/pets, r/gifts)
- [ ] Engage with comments/questions

**Day 13-14: Data Analysis**
- [ ] Review metrics against success criteria
- [ ] Analyze survey results
- [ ] Calculate referral/viral metrics
- [ ] Make GO/NO-GO decision

---

## ✅ Go/No-Go Decision Framework

### After 2-4 Weeks, Evaluate:

**🟢 STRONG GO (Build Full Platform):**
- 500+ waitlist signups
- 30%+ choose DIY over one-time
- Survey shows willingness to pay $25+
- Organic viral sharing happening
- Users emailing asking "when?"

→ **Action:** Proceed with full MVP (12-week roadmap)

**🟡 WEAK GO (Pivot Strategy):**
- 200-500 signups
- 15-30% choose DIY
- Pricing feedback mixed
- Minimal viral sharing

→ **Action:** Adjust model (maybe subscription vs credits, or lower pricing) and re-test

**🔴 NO GO (Don't Build / Major Pivot):**
- <100 signups
- <10% choose DIY
- Survey says "not interested" or "too expensive"
- Zero viral sharing

→ **Action:** Keep current PawPop as-is, explore different product directions

---

## 💰 Smoke Test Budget

| Item | Cost | Notes |
|------|------|-------|
| Demo video (DIY) | $50-100 | Fiverr voiceover + Epidemic Sound |
| Landing page design | $0 | Use existing components |
| Development time | $0 | 2-3 days (you or contractor) |
| Email tool (Resend/ConvertKit) | $0-30 | Existing or free tier |
| Ads (optional) | $200-500 | Facebook/Instagram to waitlist |
| **Total** | **$250-630** | **Minimal investment** |

**ROI Calculation:**
- If 500 people join waitlist
- 20% convert to $25 purchase = 100 customers
- Revenue: $2,500
- Cost of test: $500
- **5x ROI before even building the product**

---

## 🚀 Launch Checklist

### Pre-Launch (Week 0)
- [ ] Demo video created and hosted
- [ ] Waitlist landing page live
- [ ] Database table created
- [ ] Email automation set up
- [ ] Analytics tracking verified
- [ ] A/B test configured (10% traffic)

### Launch Day
- [ ] Enable choice point for 100% of users
- [ ] Send announcement email to customer list
- [ ] Post on social media (Instagram, TikTok, Facebook)
- [ ] Monitor signup rate (target: 20+ per day)

### Post-Launch (Week 1-2)
- [ ] Daily metrics review
- [ ] Respond to all survey responses
- [ ] Send follow-up emails
- [ ] Share user testimonials/excitement
- [ ] Adjust copy if needed

### Decision Point (End of Week 2-4)
- [ ] Analyze all data
- [ ] Make GO/NO-GO decision
- [ ] If GO: Start full MVP development
- [ ] If NO-GO: Keep current PawPop, explore alternatives

---

## 📝 Sample Survey Questions (Email 3)

**Keep it SHORT (1-2 minutes max):**

1. **What would you create first?** (Select all that apply)
   - [ ] More pet portraits (different art styles)
   - [ ] Art of family members
   - [ ] A children's storybook
   - [ ] Gifts for upcoming occasions
   - [ ] Memory/memorial art of loved ones
   - [ ] Just explore and have fun

2. **What pricing sounds most fair?**
   - [ ] $9.99/month subscription (unlimited)
   - [ ] $25 for 50 artworks (credit packs)
   - [ ] $15 for 30 artworks
   - [ ] $50 for 150 artworks

3. **How often would you use this?**
   - [ ] Daily
   - [ ] Weekly
   - [ ] Monthly (special occasions)
   - [ ] A few times per year

4. **What's most important to you?**
   - [ ] Easy to use (guided process)
   - [ ] Lots of creative options
   - [ ] Ability to create projects (storybooks)
   - [ ] Affordable pricing
   - [ ] Print/ship physical products

**Analyze responses to inform:**
- Feature prioritization
- Pricing strategy
- Marketing messaging
- Muse character personality

---

## 🎯 Key Insights This Test Reveals

### 1. Product-Market Fit Signal
**Question:** Do people want this beyond one-time purchase?  
**Measured by:** % choosing DIY vs one-time

### 2. Price Sensitivity
**Question:** Will they pay $25 for 50 credits?  
**Measured by:** Survey responses, signup rate

### 3. Use Case Validation
**Question:** What will they actually create?  
**Measured by:** Survey question 1

### 4. Retention Potential
**Question:** Will they use it repeatedly?  
**Measured by:** Survey question 3, email engagement

### 5. Viral Potential
**Question:** Will they share with friends?  
**Measured by:** Referral clicks, social shares

---

## 🤝 Next Immediate Actions

### This Week:
1. **Create demo video** (2-3 days, $50-100)
2. **Build waitlist landing page** (1 day dev)
3. **Add choice point** to artwork page (4 hours dev)
4. **Set up analytics tracking** (2 hours)
5. **Write all email copy** (2 hours)

### Next Week:
1. **Launch to 10% traffic** (Monday)
2. **Full launch** (Wednesday)
3. **Monitor metrics daily**
4. **Engage with signups**

### Week 3-4:
1. **Analyze data**
2. **Make GO/NO-GO decision**
3. **If GO:** Begin full MVP development
4. **If NO-GO:** Iterate concept or keep current PawPop

---

## 💡 Success Stories to Model

**Companies who validated with smoke tests:**

1. **Dropbox:** Drew Houston made demo video before building product
   - Result: 75,000 waitlist signups overnight
   
2. **Buffer:** Landing page describing product that didn't exist
   - Result: Validated pricing, got first paying customers before writing code

3. **Figma:** Invited designers to "private beta" before finishing product
   - Result: Waited list became customer list on day 1

**You're doing this right. Validate THEN build.**

---

## ⚠️ Risks & Mitigation

### Risk 1: Cannibalization of One-Time Sales
**Concern:** DIY option reduces current revenue

**Mitigation:**
- A/B test: Show choice to 50% of users, not 100%
- Track: Does overall revenue increase or decrease?
- Hypothesis: Total revenue increases because some users buy credits who wouldn't have bought print

### Risk 2: Building Hype, Can't Deliver
**Concern:** 1000 signups but can't build fast enough

**Mitigation:**
- Set expectations: "Launching in 6-8 weeks"
- Beta access: First 100 get early access
- Be transparent: "We're building this based on your feedback"

### Risk 3: Wrong Pricing
**Concern:** Set $25 for 50 credits, but market wants $10

**Mitigation:**
- Survey BEFORE committing
- Test multiple price points in survey
- Adjust before launch based on data

---

## 🎉 What Success Looks Like

**Imagine in 4 weeks:**

- ✅ 800 people on waitlist
- ✅ 35% of artwork viewers chose DIY over one-time
- ✅ Survey shows 70% would pay $25 for 50 credits
- ✅ 50+ referrals (users sharing with friends)
- ✅ 10+ unsolicited emails: "When can I start using this?"

**Then you KNOW you have a winner.**

Start the 12-week MVP build with confidence.

**That's validation. That's how you de-risk a pivot.**

---

**Ready to launch the smoke test?** Start with the demo video and waitlist page this week.
