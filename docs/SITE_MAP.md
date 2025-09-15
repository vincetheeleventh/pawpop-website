# PawPop Site Map - Ultra-Minimal Squeeze Page

**Version**: 2.0 (Squeeze Page)  
**Date**: September 1, 2025  
**Status**: Implemented  

---

## Ultra-Minimal Architecture

### Core User Journey
**Primary Flow**: Hero + CTA → Upload → Result

### Single Page Structure

## 1. **Landing Page** `/` (Squeeze Page)
**Purpose**: Single goal - drive photo uploads  
**Above-the-Fold**:
- Large hero image (pet mom + portrait transformation)
- Headline: "The Unforgettable Gift for Pet Moms"
- Single CTA: "Upload Photo Now" button

**Below-the-Fold**:
- Collapsible "Why PawPop?" section (accordion)
  - Social proof (10,000+ happy customers)
  - Benefits (60-second AI, museum quality, guarantee)

**Components Used**:
- `HeroSection` - Ultra-minimal hero + CTA
- `WhyPawPopSection` - Collapsible reassurance

## 2. **Upload/Create Page** `/create`
**Purpose**: Streamlined upload flow  
**Key Elements**:
- Direct upload interface
- AI processing with progress
- Result display and purchase

---

## Removed Pages (Squeeze Page Strategy)
- ~~Gallery~~ → Moved to collapsible section
- ~~About~~ → Moved to collapsible section  
- ~~Process~~ → Simplified to upload flow
- ~~Contact~~ → Not needed for squeeze page
- ~~Pricing~~ → Handled in upload flow

---

## Navigation Structure (Squeeze Page)
- **Header**: Logo + single CTA only
- **Footer**: Completely removed
- **Mobile**: No hamburger menu

---

## API Endpoints (Essential Only)
- `POST /api/monalisa-complete` - Complete AI pipeline
- `POST /api/checkout` - Payment processing
- `GET /api/order/[id]` - Order status

---

## Conversion Focus
- **Single Goal**: Photo upload
- **Zero Distractions**: No navigation leaks
- **Mobile-First**: Touch-optimized CTA (56px height)
- **Fast Load**: Minimal components only

---

**Squeeze page strategy: One page, one job, one CTA.**
