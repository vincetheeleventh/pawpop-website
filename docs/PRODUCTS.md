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

Premium paper prints available in multiple regions with different specifications.

### North America Region

**Blueprint Configuration:**
- **Blueprint ID**: 1191 (Photo Art Paper Posters)
- **Print Provider ID**: 1 (Generic Brand)
- **Product Type**: `art_print`
- **Region**: `NORTH_AMERICA`
- **Printify URL**: https://printify.com/app/products/1191/generic-brand/photo-art-paper-posters

**Available Sizes & Pricing:**
| Size | Variant ID | Price (CAD) | Description |
|------|------------|-------------|-------------|
| 12x18 | poster_12x18 | $29.00 | 12″ × 18″ Portrait |
| 18x24 | poster_18x24 | $36.00 | 18″ × 24″ Portrait |
| 20x30 | poster_20x30 | $48.00 | 20″ × 30″ Portrait |

### Europe Region

**Blueprint Configuration:**
- **Blueprint ID**: 494 (Giclee Art Print)
- **Print Provider ID**: 1 (Generic Brand)
- **Product Type**: `art_print`
- **Region**: `EUROPE`
- **Printify URL**: https://printify.com/app/products/494/generic-brand/giclee-art-print

**Available Sizes & Pricing:**
| Size | Variant ID | Price (CAD) | Description |
|------|------------|-------------|-------------|
| 12x18 | giclee_12x18 | $29.00 | 12″ × 18″ Portrait |
| 18x24 | giclee_18x24 | $36.00 | 18″ × 24″ Portrait |
| 20x30 | giclee_20x30 | $48.00 | 20″ × 30″ Portrait |

**European Countries Supported:**
Germany (DE), France (FR), Italy (IT), Spain (ES), Netherlands (NL), Belgium (BE), Austria (AT), Portugal (PT), Ireland (IE), Finland (FI), Sweden (SE), Denmark (DK), Norway (NO), Poland (PL), Czech Republic (CZ), Hungary (HU), Slovakia (SK), Slovenia (SI), Croatia (HR), Bulgaria (BG), Romania (RO), Lithuania (LT), Latvia (LV), Estonia (EE), Malta (MT), Cyprus (CY), Luxembourg (LU), Greece (GR)

---

## 3. Matte Canvas (Stretched)

Premium stretched canvas prints with optional framing upgrade.

### Global Configuration

**Blueprint Configuration:**
- **Blueprint ID**: 1159 (Matte Canvas, Stretched, 1.25")
- **Print Provider ID**: 1 (Generic Brand)
- **Product Type**: `canvas_stretched`
- **Region**: `GLOBAL`
- **Printify URL**: https://printify.com/app/products/1159/generic-brand/matte-canvas-stretched-125

**Available Sizes & Pricing:**
| Size | Variant ID | Price (CAD) | Description | Frame Upgrade |
|------|------------|-------------|-------------|---------------|
| 12x18 | canvas_12x18 | $59.00 | 12″ × 18″ Portrait | +$40.00 CAD |
| 18x24 | canvas_18x24 | $79.00 | 18″ × 24″ Portrait | +$40.00 CAD |
| 20x30 | canvas_20x30 | $99.00 | 20″ × 30″ Portrait | +$40.00 CAD |

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
- **Print Provider ID**: 1 (Generic Brand)
- **Product Type**: `canvas_framed`
- **Region**: `GLOBAL`
- **Printify URL**: https://printify.com/app/products/944/generic-brand/matte-canvas-framed-multi-color

**Available Sizes & Pricing:**
| Size | Variant ID | Price (CAD) | Description |
|------|------------|-------------|-------------|
| 12x18 | framed_12x18 | $99.00 | 12″ × 18″ Portrait |
| 18x24 | framed_18x24 | $119.00 | 18″ × 24″ Portrait |
| 20x30 | framed_20x30 | $149.00 | 20″ × 30″ Portrait |

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
    const europeanCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'SE', 'DK', 'NO', 'PL', 'CZ', 'HU', 'SK', 'SI', 'HR', 'BG', 'RO', 'LT', 'LV', 'EE', 'MT', 'CY', 'LU', 'GR'];
    return europeanCountries.includes(countryCode) ? 'EUROPE' : 'NORTH_AMERICA';
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
- **US/Canada**: Standard and expedited shipping available
- **Europe**: Regional fulfillment centers for faster delivery
- **Global**: International shipping for framed canvas products

### Fulfillment Partners
- **Generic Brand**: Art print fulfillment (US/CA and Europe)
- **Print Geek**: Framed canvas fulfillment (Global)

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

### Planned Additions
1. **Canvas Side Printing**: Research "print on sides" and "mirror sides" options
2. **Additional Sizes**: Explore larger format options
3. **New Product Types**: Metal prints, acrylic prints
4. **Regional Expansion**: Additional print providers and regions
5. **Custom Framing**: Premium framing options and materials

### Enhancement Opportunities
1. **Inventory Management**: Real-time stock tracking
2. **Shipping Optimization**: Dynamic carrier selection
3. **Quality Control**: Automated quality checks
4. **Customer Portal**: Self-service order management
5. **Analytics Dashboard**: Product performance metrics
