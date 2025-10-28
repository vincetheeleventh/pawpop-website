# PawPop Product Requirements Document (PRD)

Version: 3.0 (Updated)
Author: PM Helper (updated by Cascade)
Date: October 2025

This PRD defines the current product vision, scope, critical path, and technical requirements for PawPop’s conversion funnel, updated to reflect the implemented "handcrafted, human-in-the-loop" experience and backend integrations.

---

## 1. Vision & Positioning
- Offer a unique, emotionally resonant gift for pet moms by transforming two photos (pet mom + pet) into a Renaissance-style portrait.
- Conversion-first, ultra-minimal squeeze page with a single primary action.

## 2. Target Audience
- **Primary**: Pet Moms who value a one-of-a-kind, heartfelt keepsake.
- **Secondary**: Thoughtful Gifters buying for Pet Moms (birthdays, holidays, Mother’s Day).
- Motivation: Emotional impact and quality of the final artwork, not the tech behind it.

---

## 3. Critical Path (Arrival → Upload → Generation → Artwork → Purchase)
Source of truth: `docs/pawpop_masterDocs/CRITICAL_PATH_USER_FLOW.md`

1) Landing page (squeeze page) → Open `UploadModal`
2) UploadModal 3-step flow → Create artwork record, start background generation
3) Background generation pipeline (MonaLisa → Pet Integration → Optional Manual Approval → Upscale → Mockups)
4) Artwork page (pending) → Completion email → Artwork page (completed)
5) Purchase flow (physical-first) → Stripe checkout → Post-purchase processing → Fulfillment

---

## 4. Landing Page Requirements
- Single CTA: "Upload Photo Now" (mobile-optimized 56px height).
- Hero image that shows transformation concept (pet mom + Mona Lisa style).
- Optional reassurance: collapsible "Why PawPop?" (hidden by default).
- Gallery carousel: smooth, non-jarring transitions; optimized image loading (eager first items, lazy rest; blur placeholders).
- Styling aligns with design system colors:
  - Site Background (#F5EED7), Card Surface (#FFFFFF), Text Primary (#2C2C2C)
  - Accents: Atomic Tangerine (#FF9770) for primary CTAs, Cyclamen (#FF70A6) secondary, etc.

---

## 5. Upload Modal (3-Step) Requirements
Component: `src/components/forms/UploadModal.tsx`

- Step 1: Pet mom photo upload (drag/drop, HEIC→JPEG conversion, compression, security/magic number checks).
- Step 2: Pet photo upload (same features, guidance on pose/expression).
- Step 3: Contact info (name + email). Copy conditional on whether photos were uploaded or deferred.
  - If photos uploaded: "Almost Ready!" and clear expectation email.
  - If deferred: urgency + value anchoring using Plausible variant pricing (FREE proof worth $15 or $45), 48-hour reservation window.
- On submit:
  - Create artwork record, store price variant for cross-device consistency, generate upload token when deferred.
  - Start background generation, then send "creating" email only after pipeline starts successfully.

Success metrics: modal completion rate 60–80%; low upload errors.

---

## 6. Background Generation Pipeline
- MonaLisa base generation (fal.ai Flux Pro) → Pet Integration.
- Optional manual approval checkpoint (config via `ENABLE_HUMAN_REVIEW`).
  - Creates admin review, blocks customer completion email until approved.
  - Admin dashboard at `/admin/reviews` with approve/reject + manual image upload replacement.
- Upscaling: fal.ai clarity-upscaler 3x with oil painting optimization.
- Mockups: Generate real Printify mockups automatically; store URLs for Artwork page.

Success metrics: 95%+ generation success; average generation 2–5 minutes.

---

## 7. Artwork Page
Route: `/artwork/[token]`

- Pending state: "Artwork Confirmed", expectation setting, and status polling button.
- Completed state: 2-column layout
  - Left: full artwork (no crop), primary CTA "Make it Real".
  - Right: product mockups (Printify), thumbnail navigation, graceful fallbacks.

Goal: 40–60% click-through to purchase modal.

---

## 8. Purchase Flow (Physical-First)
Components: `PurchaseModalPhysicalFirst.tsx`, `ProductPurchaseModal.tsx`

- Stage A: Category selection prioritizes physical products (Framed Canvas, Stretched Canvas, Art Print) with Digital Download as secondary.
- Stage B: Product modal with size selection, quantity (1–10), shipping speed selection (Printify methods), and mockups.
- Stripe Checkout
  - Endpoint: `/api/checkout/artwork`
  - Automatic shipping address collection for physical items; supports international shipping.
  - Metadata includes shipping method and quantity.

Goal: 25–40% of modal opens convert to purchases.

---

## 9. Post-Purchase Processing
- Stripe webhook `checkout.session.completed` → order record updates (paid → processing).
- Upscaling step runs for physical orders; optional high-res admin approval before Printify.
- Printify order creation with correct variant IDs and mirror sides configuration.
- Customer emails: order confirmation, shipping updates.

Success metrics: >95% processing success, accurate shipping info, stable webhook handling.

---

## 10. Error Handling & Edge Cases
- Upload validation with magic number security checks; Blob/File handling for HEIC and large JPGs.
- Resilient network calls with timeouts and retries.
- Graceful fallbacks for Printify mockups.
- Clear error messaging across steps.

---

## 11. Analytics & Experimentation
- Plausible Analytics integrated with persistent A/B testing for pricing variants.
  - Variant A digital: $15; Variant B digital: $45 (and corresponding print tiers).
  - Variant assignment persists 30 days via localStorage with expiry.
  - Events: funnel steps, performance timings, interactions, revenue.
- Google Ads tracking supported alongside Plausible.

Success metrics (examples):
- Landing → Upload modal CTR: 15–25%
- Modal completion: 60–80%
- Artwork → Purchase modal CTR: 40–60%
- Purchase modal → Stripe checkout: 40%
- Checkout → Payment: 85%
- Target overall: 1.5–2% visitors → fulfilled customers

---

## 12. Tech Stack (Updated)
- Frontend: Next.js (App Router) + React + TailwindCSS (custom design system). No Chakra UI.
- Storage/DB: Supabase with JSONB schema and RLS policies.
- Uploads: UploadThing integrated into artwork flow.
- Payments: Stripe Checkout + webhooks.
- Fulfillment: Printify API (product variants validated; mirror sides for canvases).
- Image gen: fal.ai (MonaLisa base, pet integration, clarity-upscaler 3x).
- Email: Resend templates aligned to design system.
- Monitoring: Internal monitoring service, alerts, and usage tracking.

---

## 13. Non-Goals
- No face swap step (disabled and rolled back from schema).
- No multi-theme website or multi-page marketing site; squeeze page pattern is intentional.
- No AI-first messaging in copy.

---

## 14. Open Questions
- Do we expand product catalog beyond current framed/stretched canvas and art prints?
- Do we introduce time-limited promotions tied to price variants?
- When to automatically disable manual approval for high trust scenarios?

---

## 15. Acceptance Criteria (High-Level)
- Landing page renders within acceptable Core Web Vitals thresholds; gallery transition is smooth without blank flashes.
- Upload flow robust across major browsers and HEIC/JPG cases; Step 3 copy reflects uploaded vs deferred states with correct A/B price anchoring.
- Emails send at correct checkpoints; admin review gating respected when enabled.
- Artwork page shows real Printify mockups or fallbacks; purchase modal opens and functions end-to-end.
- Stripe checkout completes; post-purchase pipeline runs (upscale → optional review → Printify order).
- Analytics events recorded with variant context; funnels visible in Plausible.

---

## 16. References
- Critical Path: `docs/pawpop_masterDocs/CRITICAL_PATH_USER_FLOW.md`
- Design System Colors: Tailwind configuration (project root)
- Pricing & A/B: `src/lib/plausible.ts`, `src/hooks/usePlausibleTracking.ts`
- Upload & Validation: `src/components/forms/UploadModal.tsx`, `src/lib/upload-validation.ts`
- Order Processing & Printify: `src/lib/order-processing.ts`, `src/lib/printify*.ts`
- Admin Review: `src/app/admin/reviews/*`, `src/lib/admin-review.ts`
