# PawPop Product Catalog

This document provides a comprehensive overview of all products offered by PawPop, including specifications, pricing, and technical details for integration with Printify.

## Product Types Overview

PawPop offers three main product categories:
1. **Digital Download** - Instant digital artwork delivery
2. **Art Print** - High-quality paper prints 
3. **Framed Canvas** - Premium framed canvas prints

---

## 1. Digital Download

### Product Details
- **Product Type**: `digital`
- **Price**: $9.99
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

### US/Canada Region

**Blueprint Configuration:**
- **Blueprint ID**: 1191 (Photo Art Paper Posters)
- **Print Provider ID**: 1 (Generic Brand)
- **Product Type**: `art_print`
- **Region**: `US_CA`

**Available Sizes & Pricing:**
| Size | Variant ID | Price | Description |
|------|------------|-------|-------------|
| 12x18 | poster_12x18 | $29.99 | 12″ × 18″ Portrait |
| 18x24 | poster_18x24 | $39.99 | 18″ × 24″ Portrait |
| 20x30 | poster_20x30 | $49.99 | 20″ × 30″ Portrait |

### Europe Region

**Blueprint Configuration:**
- **Blueprint ID**: 494 (Giclee Art Print)
- **Print Provider ID**: 1 (Generic Brand)
- **Product Type**: `art_print`
- **Region**: `EUROPE`

**Available Sizes & Pricing:**
| Size | Variant ID | Price | Description |
|------|------------|-------|-------------|
| 12x18 | giclee_12x18 | $34.99 | 12″ × 18″ Portrait |
| 18x24 | giclee_18x24 | $44.99 | 18″ × 24″ Portrait |
| 20x30 | giclee_20x30 | $54.99 | 20″ × 30″ Portrait |

**European Countries Supported:**
Germany (DE), France (FR), Italy (IT), Spain (ES), Netherlands (NL), Belgium (BE), Austria (AT), Portugal (PT), Ireland (IE), Finland (FI), Sweden (SE), Denmark (DK), Norway (NO), Poland (PL), Czech Republic (CZ), Hungary (HU), Slovakia (SK), Slovenia (SI), Croatia (HR), Bulgaria (BG), Romania (RO), Lithuania (LT), Latvia (LV), Estonia (EE), Malta (MT), Cyprus (CY), Luxembourg (LU), Greece (GR)

---

## 3. Framed Canvas

Premium framed canvas prints available globally.

### Global Configuration

**Blueprint Configuration:**
- **Blueprint ID**: 1191 (Photo Art Paper Posters)
- **Print Provider ID**: 27 (Print Geek)
- **Product Type**: `framed_canvas`
- **Region**: `GLOBAL`

**Available Sizes & Pricing:**
| Size | Variant ID | Price | Description | Printify Specification |
|------|------------|-------|-------------|----------------------|
| 12x18 | 91677 | $79.99 | 12″ × 18″ Portrait | 12″ × 18″ (Vertical) / Satin |
| 18x24 | 91693 | $99.99 | 18″ × 24″ Portrait | 18″ × 24″ (Vertical) / Satin |
| 20x30 | 91695 | $129.99 | 20″ × 30″ Portrait | 20″ × 30″ (Vertical) / Satin |

**Canvas Features:**
- High-quality satin finish
- Professional framing
- Vertical orientation optimized
- Global shipping available

---

## Product Selection Logic

### Region Determination
```typescript
function determineRegion(productType: ProductType, countryCode: string): string {
  if (productType === ProductType.FRAMED_CANVAS) {
    return 'GLOBAL';
  }
  
  if (productType === ProductType.ART_PRINT) {
    const europeanCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'SE', 'DK', 'NO', 'PL', 'CZ', 'HU', 'SK', 'SI', 'HR', 'BG', 'RO', 'LT', 'LV', 'EE', 'MT', 'CY', 'LU', 'GR'];
    return europeanCountries.includes(countryCode) ? 'EUROPE' : 'US_CA';
  }
  
  return 'GLOBAL';
}
```

### Pricing Structure
All prices are in USD cents for Stripe integration:
- Digital: 999 cents ($9.99)
- Art Print US/CA: 2999-4999 cents ($29.99-$49.99)
- Art Print Europe: 3499-5499 cents ($34.99-$54.99)
- Framed Canvas: 7999-12999 cents ($79.99-$129.99)

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
