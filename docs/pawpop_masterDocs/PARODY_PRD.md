PawPop Product Requirements Document (PRD)

Version: 5.0 (Digital-First, PLG Pivot)
Author: PawPop Product Team
Date: October 2025
Core Hypothesis: Moving the price point from $79 to $0 will solve Activation. Revenue will be driven by the $5 Parody Pack (Digital Purchase) and subsequent upsells to Physical Goods and DIY Subscription.

1. Vision & Positioning

Vision: To be the leading platform for personalized, high-variety, AI-assisted pet parody art, converting high-volume digital sales into high-margin physical keepsakes and recurring revenue.

Positioning: A fun, zero-friction, digital platform for pet art creation and customization. Value shifts to: "Variety, Instant Fun, and Customization."

Business Model: Freemium $\rightarrow$ Digital Purchase $\rightarrow$ Physical/Subscription Upsell. Parody Pack price point will need to be tested.

2. Target Audience & Problems

Segment

Problem Solved

Monetization

AI-Curious Pet Owner (18-35)

Low-cost methods (Midjourney, etc.) lack guidance and variety, and output is hard to turn into a cohesive pack of gifts/shares.

$5 Parody Pack Purchase

Emotional Gifter (35-55)

Needs a high-quality, physical gift but fears risk/commitment on initial purchase.

Physical Print Upsell ($79+)

Power User / Hobbyist

Wants full control to create multiple versions without paying per pack.

DIY Subscription ($X/month)

3. Critical Path: New Multi-Stage Flow (Digital-First)

The path is designed to maximize the sale of the $5 Parody Pack first, then use the resulting files to drive high-margin upsells.

Step

Action

Success Metric (Goal)

Step 1: Landing Page

FREE Lead Magnet: User lands on the page and clicks to get a "Complimentary Parody Proof."

Email Capture Rate: $\ge 20\%$

Step 2: Proof Generation

Activation: User uploads ONE Photo (Zero-Friction, No Crop). Backend manually/automatically generates one low-res, watermarked proof in their chosen style.

Photo Upload Completion Rate: $\ge 80\%$

Step 3: The Digital Offer (Core Revenue)

Conversion: User receives the proof via email. The email/in-app notification features a strong CTA to purchase the $5 Parody Pack (5 High-Res Digital Styles).

Free-to-Paid Conversion (FTP): Target $\ge 5\%$ for the $5 Pack.

Step 4: The Physical/DIY Upsell

Monetization: Post-pack purchase, user is immediately presented with: 1) Physical Keepsakes (mug, shirt, print) using the newly purchased art, OR 2) A DIY Subscription Trial to generate and refine their own packs.

Average Order Value (AOV): Must be driven by Physical/Subscription add-ons to ensure LTV > CAC.

4. Feature Requirements (MVP)

Priority

Feature / User Story

Implementation

Rationale (Moat)

MUST HAVE

Zero-Friction Upload: Remove all user-side cropping/editing; use Worry-Free Guarantee copy.

Landing Page/Modal Refactor.

Fixes the #1 Activation crisis.

MUST HAVE

$5 Parody Pack Purchase Funnel: The core digital purchase flow. Must be instantaneous download delivery.

Dedicated checkout page (Stripe) for the $5 product; automated email delivery of 5 high-res files post-purchase.

Validates the low-price business model.

MUST HAVE

Physical Upsell Flow: Display all 5 purchased images on a dedicated upsell page featuring mockups (Prints, Mugs, T-shirts).

Dedicated Upsell Page with links to Printify-connected checkouts.

Drives high-margin AOV/LTV.

SHOULD HAVE

DIY Subscription Presale: A landing page describing the future $X/month AI tools (editing, generating). CTA: Letter of Intent/Pre-Register (no code needed yet).

Simple HTML Presale Page.

Smoke test the subscription model without building the complex feature.

NICE TO HAVE

User Photo Gallery: Simple, private gallery to store purchased art for easy re-ordering of physical goods.

Simple database structure linked to user ID/Email.

Builds LTV/Retention over time.

5. Success Metrics

Metric

Target

Rationale

Photo Upload Completion Rate (Activation)

$\mathbf{\ge 80\%}$

The core friction fix must work.

Free-to-Paid (FTP) CVR ($5 Pack)

$\mathbf{\ge 5\%}$

Required to validate the digital commodity business model.

Average Order Value (AOV)

$\mathbf{\ge \$15}$

Must exceed $5 to show success in the upsell phase.

CAC (Paid Social)

$\mathbf{< \$2.50}$

Must be low enough to allow the $5 pack to cover acquisition costs.

6. Scope Exclusion (What We Will NOT Build Now)

Subscription Management System: The actual recurring billing or user access control for DIY tools. (Only the LOI page will be built).

In-App AI Editor: The complex UI/UX for refining art. The $5 pack is delivered as final files.

Dedicated Mobile App: All experiences will be optimized for a mobile web browser first.