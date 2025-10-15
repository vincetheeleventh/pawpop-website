# PawPop Product Catalog

This document provides a comprehensive overview of all products offered by PawPop, including specifications, pricing strategies, and technical details for integration with Printify.

## Product Philosophy

PawPop offers emotionally resonant, handcrafted portraits combining pet and owner. Pricing reflects premium positioning, artisanal refinement, and museum-grade materials. Each product is designed to be a timeless keepsake that celebrates the unique bond between pets and their owners.

---

## Product Categories Overview

PawPop offers four main product categories:
1. **Digital Masterpiece** - High-resolution digital artwork delivery
2. **Fine Art Print** - Museum-quality archival paper prints 
3. **Stretched Canvas** - Premium stretched canvas with optional framing
4. **Framed Canvas** - Luxury framed canvas prints

---

## Pricing Strategy Comparison

### Standard Pricing (Product A)
- Digital: $15.00 CAD
- Art Print: $39.00-$59.00 CAD
- Canvas Stretched: $59.00-$99.00 CAD
- Canvas Framed: $99.00-$149.00 CAD

### Premium Pricing (Product B)
- Digital Masterpiece: $45.00 CAD
- Fine Art Print: $79.00-$115.00 CAD
- Stretched Canvas: $95.00-$175.00 CAD
- Framed Canvas: $145.00-$225.00 CAD

**Positioning Notes:**
- Premium pricing positions PawPop above mass-market competitors ($39-$59 range)
- Digital masterpiece at $45 CAD competes with premium digital add-ons ($15-$20 range)
- Framed canvas as luxury tier and ultimate gift option
- Pricing reflects handcrafted journey and museum-grade materials

---

## 1. Digital Masterpiece

### Product Details
- **Product Type**: `digital`
- **Standard Price**: $15.00 CAD
- **Premium Price**: $45.00 CAD
- **Delivery**: Instant email delivery after payment
- **File Format**: High-resolution PNG/JPEG (suitable for printing)
- **Premium Perks**: Unlimited revisions included
- **No Physical Shipping Required**

### Technical Implementation
- No Printify integration required
- Delivered via email using existing email system
- File hosted on secure cloud storage with 30-day access
- High-resolution output optimized for customer printing

### Value Proposition
- Instant gratification with immediate delivery
- Flexibility for customers to print locally
- Premium tier includes unlimited revisions
- Suitable for social media sharing and digital framing

---

## 2. Fine Art Print

Premium museum-grade prints using archival inks and heavyweight fine art paper. Ideal for gifting.

### United States Region (Active)

**Blueprint Configuration:**
- **Blueprint ID**: 1220 (Rolled Posters - Fine Art)
- **Print Provider ID**: 105 (Jondo)
- **Product Type**: `art_print`
- **Region**: `US`
- **Paper Type**: Fine Art (285 g/m²)
- **Quality**: Museum-quality, archival, acid-free, fade-resistant
- **Finish**: Matte
- **Printify URL**: https://printify.com/app/products/1220/jondo/rolled-posters

**Available Sizes & Pricing:**

| Size | Variant ID | Standard Price | Premium Price | Description |
|------|------------|----------------|---------------|-------------|
| 12×18 | 92396 | $39.00 CAD | $79.00 CAD | 12″ × 18″ (Vertical) / Fine Art |
| 18×24 | 92400 | $49.00 CAD | $95.00 CAD | 18″ × 24″ (Vertical) / Fine Art |
| 20×30 | 92402 | $59.00 CAD | $115.00 CAD | 20″ × 30″ (Vertical) / Fine Art |

**Shipping Coverage:**
- ✅ United States: Full coverage
- ❌ Canada: Not supported (requires alternative blueprint)
- ❌ Europe: Not supported (see future implementation)
- ❌ United Kingdom: Not supported

### Europe Region (Future Implementation)

**Blueprint Configuration:**
- **Blueprint ID**: 494 (Giclée Art Print)
- **Print Provider ID**: 36 (Print Pigeons)
- **Product Type**: `art_print`
- **Region**: `EUROPE_FUTURE`
- **Paper Type**: Giclée quality (192 g/m²)
- **Status**: Not implemented - EU shipping only, missing UK/US/CA coverage
- **Printify URL**: https://printify.com/app/products/494/print-pigeons/giclee-art-print

**Planned Sizes & Pricing:**

| Size | Variant ID | Standard Price | Premium Price | Description |
|------|------------|----------------|---------------|-------------|
| 12×18 | TBD | $29.00 CAD | $79.00 CAD | 12″ × 18″ Portrait |
| 18×24 | TBD | $39.00 CAD | $95.00 CAD | 18″ × 24″ Portrait |
| 20×30 | TBD | $48.00 CAD | $115.00 CAD | 20″ × 30″ Portrait |

**Shipping Coverage:**
- ❌ United States: Not supported
- ❌ Canada: Not supported
- ✅ Europe: EU countries only
- ❌ United Kingdom: Not supported

### Quality Comparison

| Aspect | Blueprint 1220 (US) | Blueprint 494 (EU Future) |
|--------|---------------------|---------------------------|
| Paper Weight | 285 g/m² | 192 g/m² |
| Paper Type | Fine Art | Giclée |
| Quality Level | Museum-quality | High-quality |
| Archival | Yes, acid-free | Standard |
| Provider | Jondo | Print Pigeons |
| Shipping | US only | EU only |

---

## 3. Stretched Canvas

Premium stretched matte canvas, artisan-finished, available globally with optional framing upgrade.

### Global Configuration

**Blueprint Configuration:**
- **Blueprint ID**: 1159 (Matte Canvas, Stretched, 1.25")
- **Print Provider ID**: 105 (Jondo)
- **Product Type**: `canvas_stretched`
- **Region**: `GLOBAL`
- **Finish**: Matte, hand-stretched over solid wood frame
- **Canvas Depth**: 1.25" wooden frame
- **Printify URL**: https://printify.com/app/products/1159/generic-brand/matte-canvas-stretched-125

**Available Sizes & Pricing:**

| Size | Variant ID | Standard Price | Premium Price | Description | Frame Upgrade |
|------|------------|----------------|---------------|-------------|---------------|
| 12×18 | 91644 | $59.00 CAD | $95.00 CAD | 12″ × 18″ Portrait | +$40-50 CAD |
| 16×24 | 91647 | $79.00 CAD | $135.00 CAD | 16″ × 24″ Portrait | +$40-50 CAD |
| 20×30 | 91650 | $99.00 CAD | $175.00 CAD | 20″ × 30″ Portrait | +$40-50 CAD |

**Canvas Features:**
- High-quality matte finish
- Stretched on 1.25" solid wooden frame
- Portrait orientation optimized
- Optional framing upgrade available
- Museum-quality materials
- Global shipping available
- Hand-crafted finishing touches

---

## 4. Framed Canvas

Luxury framed canvas prints - premium ready-to-gift statement pieces.

### Global Configuration

**Blueprint Configuration:**
- **Blueprint ID**: 944 (Matte Canvas, Framed Multi-color)
- **Print Provider ID**: 105 (Jondo)
- **Product Type**: `canvas_framed`
- **Region**: `GLOBAL`
- **Finish**: Matte canvas with premium multi-color frame
- **Printify URL**: https://printify.com/app/products/944/generic-brand/matte-canvas-framed-multi-color

**Available Sizes & Pricing:**

| Size | Variant ID | Standard Price | Premium Price | Description |
|------|------------|----------------|---------------|-------------|
| 12×18 | 111829 | $99.00 CAD | $145.00 CAD | 12″ × 18″ Portrait |
| 16×24 | 111837 | $119.00 CAD | $185.00 CAD | 16″ × 24″ Portrait |
| 20×30 | 88295 | $149.00 CAD | $225.00 CAD | 20″ × 30″ Portrait |

**Canvas Features:**
- High-quality matte finish
- Professional multi-color framing
- Vertical orientation optimized
- Ready-to-hang, gift-ready
- Premium packaging
- Global shipping available
- Luxury tier positioning

---

## Product Selection Logic

### Region Determination
```typescript
function determineRegion(productType: ProductType, countryCode: string): string {
  if (productType === ProductType.CANVAS_STRETCHED || productType === ProductType.CANVAS_FRAMED) {
    return 'GLOBAL';
  }
  
  if (productType === ProductType.ART_PRINT) {
    // Currently only US is supported for Fine Art prints (Blueprint 1220)
    if (countryCode === 'US') {
      return 'US';
    }
    
    // Future EU implementation (Blueprint 494) - not active
    // const europeanCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'SE', 'DK', 'NO', 'PL', 'CZ', 'HU', 'SK', 'SI', 'HR', 'BG', 'RO', 'LT', 'LV', 'EE', 'MT', 'CY', 'LU', 'GR'];
    // return europeanCountries.includes(countryCode) ? 'EUROPE_FUTURE' : 'UNSUPPORTED';
    
    // For now, all non-US customers cannot order art prints
    return 'UNSUPPORTED';
  }
  
  return 'GLOBAL';
}
```

### Pricing Structure (Stripe Integration)

**Standard Pricing (CAD cents):**
- Digital: 1500 cents ($15.00 CAD)
- Art Print: 3900-5900 cents ($39.00-$59.00 CAD)
- Canvas Stretched: 5900-9900 cents ($59.00-$99.00 CAD)
- Canvas Framed: 9900-14900 cents ($99.00-$149.00 CAD)
- Frame Upgrade: +4000 cents (+$40.00 CAD)

**Premium Pricing (CAD cents):**
- Digital Masterpiece: 4500 cents ($45.00 CAD)
- Fine Art Print: 7900-11500 cents ($79.00-$115.00 CAD)
- Stretched Canvas: 9500-17500 cents ($95.00-$175.00 CAD)
- Framed Canvas: 14500-22500 cents ($145.00-$225.00 CAD)
- Frame Upgrade: +5000 cents (+$50.00 CAD)

---

## Quality Standards

### Key Quality Standards
- **Archival Materials**: Acid-free, fade-resistant inks and paper
- **Museum Finish**: Hand-crafted framing, professional color management
- **Durability**: Timeless keepsakes designed to last generations
- **Gifting Experience**: Premium packaging and clear communication of the "handcrafted journey"

### Image Requirements
- **Minimum Resolution**: 300 DPI at final print size
- **Color Profile**: sRGB for consistent color reproduction
- **Aspect Ratio**: Optimized for portrait orientation
- **File Size**: Maximum 50MB per image

### Print Quality
- **Art Prints**: Premium paper stock with archival inks
- **Canvas Prints**: Museum-quality canvas with professional framing
- **Color Accuracy**: Professional color management throughout production
- **Durability**: Fade-resistant inks for long-lasting prints

---

## Technical Integration Details

### Printify API Configuration

**Environment Variables Required:**
```bash
PRINTIFY_API_TOKEN=your_printify_api_token
PRINTIFY_SHOP_ID=your_printify_shop_id
PRINTIFY_WEBHOOK_SECRET=your_printify_webhook_secret
```

### Product Creation Flow
1. **Image Upload**: Upload artwork to Printify servers
2. **Product Configuration**: Select blueprint, provider, and variants
3. **Image Positioning**: Calculate optimal placement and scaling
4. **Product Creation**: Create Printify product with specified variants
5. **Order Processing**: Handle customer orders and fulfillment

### Supported File Formats
- **Input**: PNG, JPEG, WebP
- **Output**: High-resolution PNG for print production
- **Dimensions**: Optimized for portrait orientation (vertical)

---

## Shipping & Fulfillment

### Shipping Regions
- **US Only**: Fine Art prints (Blueprint 1220) - Premium quality, limited region
- **Global**: Canvas products (Blueprints 1159, 944) - Worldwide shipping
- **Future EU**: Planned Giclée prints (Blueprint 494) - Pending implementation

### Fulfillment Partners
- **Jondo**: Fine Art print fulfillment (US only) - Blueprint 1220
- **Print Pigeons**: Future Giclée print fulfillment (EU only) - Blueprint 494
- **Jondo**: Canvas fulfillment (Global) - Blueprints 1159, 944

### Delivery Times
- **Digital**: Instant delivery via email
- **Art Prints**: 3-7 business days (regional)
- **Canvas Products**: 5-10 business days (global)

---

## Order Status Tracking

### Status Flow
```
pending → paid → processing → shipped → delivered
```

### Printify Status Mapping
- `pending` → `processing`
- `in-production` → `processing`
- `fulfilled` → `shipped`
- `shipped` → `shipped`
- `delivered` → `delivered`
- `cancelled` → `cancelled`

---

## Future Product Roadmap

### Immediate Priorities
1. **EU Art Print Implementation**: Implement Blueprint 494 (Giclée) for European customers
2. **Global Art Print Solution**: Find blueprint with worldwide shipping + Fine Art quality
3. **Region Detection**: Implement customer location-based product filtering
4. **International Customer Experience**: Clear messaging for shipping limitations
5. **Canadian Market**: Find suitable blueprint for Canadian art print fulfillment

### Planned Additions
1. **Canvas Side Printing**: Research "print on sides" and "mirror sides" options
2. **Additional Sizes**: Explore larger format options (24×36, 30×40)
3. **New Product Types**: Metal prints, acrylic prints
4. **Regional Expansion**: Additional print providers and regions
5. **Custom Framing**: Premium framing options and materials
6. **Paper Options**: Multiple paper types (Semi-Glossy, Matte) for different regions

### Enhancement Opportunities
1. **Inventory Management**: Real-time stock tracking
2. **Shipping Optimization**: Dynamic carrier selection
3. **Quality Control**: Automated quality checks
4. **Customer Portal**: Self-service order management
5. **Analytics Dashboard**: Product performance metrics
6. **Premium Packaging**: Enhanced unboxing experience for luxury tier

---

## Pricing Strategy Recommendations

### Market Positioning
- **Standard Pricing**: Competitive entry point, volume-focused
- **Premium Pricing**: Luxury positioning, emphasizes handcrafted quality and emotional value
- **Recommended Approach**: Test both pricing tiers with A/B testing to optimize conversion and revenue

### Value Communication
- Emphasize "handcrafted journey" and artisanal refinement
- Highlight museum-grade materials and archival quality
- Position as timeless keepsakes and ultimate gifts
- Communicate unlimited revisions for digital masterpiece tier
- Showcase premium packaging and gifting experience

### Conversion Optimization
- Use framed canvas as anchor pricing for luxury tier
- Offer frame upgrade as upsell opportunity
- Bundle digital masterpiece with physical products
- Implement tiered pricing display to guide customers toward premium options
- A/B test pricing strategies across different customer segments

---

## Implementation Notes

### Current Status
- ✅ US Fine Art prints fully operational (Blueprint 1220)
- ✅ Global canvas products operational (Blueprints 1159, 944)
- ✅ Digital delivery system functional
- ⏳ EU Giclée prints pending implementation (Blueprint 494)
- ⏳ Canadian market solution needed
- ⏳ Pricing tier testing required

### Technical Debt
- Need to implement region-based product filtering
- Shipping cost calculation needs refinement
- International tax handling requires implementation
- Multi-currency support for global expansion

### Quality Assurance
- All products tested with sample orders
- Color accuracy verified across print providers
- Shipping times validated for each region
- Customer feedback loop established for continuous improvement
