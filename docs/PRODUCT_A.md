# PawPop Product Catalog

This document provides a comprehensive overview of all products offered by PawPop, including specifications, pricing, and technical details for integration with Printify.

## Product Types Overview

PawPop offers four main product categories:
1. **Digital Download** - Instant digital artwork delivery
2. **Art Print** - High-quality paper prints 
3. **Matte Canvas (Stretched)** - Premium stretched canvas with optional framing
4. **Matte Canvas (Framed)** - Premium framed canvas prints

---

## 1. Digital Download

### Product Details
- **Product Type**: `digital`
- **Price**: $15.00 CAD
- **Delivery**: Instant email delivery after payment
- **File Format**: High-resolution PNG/JPEG
- **No Physical Shipping Required**

### Technical Implementation
- No Printify integration required
- Delivered via email using existing email system
- File hosted on secure cloud storage with 30-day access

---

## 2. Art Print

Premium Fine Art paper prints with museum-quality materials and archival inks.

### United States Region (Active)

**Blueprint Configuration:**
- **Blueprint ID**: 1220 (Rolled Posters - Fine Art)
- **Print Provider ID**: 105 (Jondo)
- **Product Type**: `art_print`
- **Region**: `US`
- **Paper Type**: Fine Art (285 g/m²)
- **Quality**: Museum-quality, archival, acid-free
- **Finish**: Matte
- **Printify URL**: https://printify.com/app/products/1220/jondo/rolled-posters

**Available Sizes & Pricing:**
| Size | Variant ID | Price (CAD) | Description |
|------|------------|-------------|-------------|
| 12x18 | 92396 | $39.00 | 12″ × 18″ (Vertical) / Fine Art |
| 18x24 | 92400 | $49.00 | 18″ × 24″ (Vertical) / Fine Art |
| 20x30 | 92402 | $59.00 | 20″ × 30″ (Vertical) / Fine Art |

**Shipping Coverage:**
- ✅ United States: Full coverage
- ❌ Canada: Not supported
- ❌ Europe: Not supported
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
| Size | Variant ID | Price (CAD) | Description |
|------|------------|-------------|-------------|
| 12x18 | TBD | $29.00 | 12″ × 18″ Portrait |
| 18x24 | TBD | $39.00 | 18″ × 24″ Portrait |
| 20x30 | TBD | $48.00 | 20″ × 30″ Portrait |

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

## 3. Matte Canvas (Stretched)

Premium stretched canvas prints with optional framing upgrade.

### Global Configuration

**Blueprint Configuration:**
- **Blueprint ID**: 1159 (Matte Canvas, Stretched, 1.25")
- **Print Provider ID**: 105 (Jondo)
- **Product Type**: `canvas_stretched`
- **Region**: `GLOBAL`
- **Printify URL**: https://printify.com/app/products/1159/generic-brand/matte-canvas-stretched-125

**Available Sizes & Pricing:**
| Size | Variant ID | Price (CAD) | Description | Frame Upgrade |
|------|------------|-------------|-------------|---------------|
| 12x18 | 91644 | $59.00 | 12″ × 18″ Portrait | +$40.00 CAD |
| 16x24 | 91647 | $79.00 | 16″ × 24″ Portrait | +$40.00 CAD |
| 20x30 | 91650 | $99.00 | 20″ × 30″ Portrait | +$40.00 CAD |

**Canvas Features:**
- High-quality matte finish
- Stretched on 1.25" wooden frame
- Portrait orientation optimized
- Optional framing upgrade available
- Global shipping available

---

## 4. Matte Canvas (Framed)

Premium framed canvas prints - sold as upsell option.

### Global Configuration

**Blueprint Configuration:**
- **Blueprint ID**: 944 (Matte Canvas, Framed Multi-color)
- **Print Provider ID**: 105 (Jondo)
- **Product Type**: `canvas_framed`
- **Region**: `GLOBAL`
- **Printify URL**: https://printify.com/app/products/944/generic-brand/matte-canvas-framed-multi-color

**Available Sizes & Pricing:**
| Size | Variant ID | Price (CAD) | Description |
|------|------------|-------------|-------------|
| 12x18 | 111829 | $99.00 | 12″ × 18″ Portrait |
| 16x24 | 111837 | $119.00 | 16″ × 24″ Portrait |
| 20x30 | 88295 | $149.00 | 20″ × 30″ Portrait |

**Canvas Features:**
- High-quality matte finish
- Professional multi-color framing
- Vertical orientation optimized
- Global shipping available

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

### Pricing Structure
All prices are in CAD cents for Stripe integration:
- Digital: 1500 cents ($15.00 CAD)
- Art Print (All Regions): 2900-4800 cents ($29.00-$48.00 CAD)
- Canvas Stretched: 5900-9900 cents ($59.00-$99.00 CAD)
- Canvas Framed: 9900-14900 cents ($99.00-$149.00 CAD)
- Frame Upgrade: +4000 cents (+$40.00 CAD)

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

## Quality Standards

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
- **Framed Canvas**: 5-10 business days (global)

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

### Planned Additions
1. **Canvas Side Printing**: Research "print on sides" and "mirror sides" options
2. **Additional Sizes**: Explore larger format options (24x36, 30x40)
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
