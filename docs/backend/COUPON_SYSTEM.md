# PawPop Coupon System

## Overview

The PawPop coupon system provides comprehensive discount functionality for both testing purposes (Stripe $1 transactions) and production use cases. The system includes database-backed validation, real-time UI integration, and complete order processing integration.

## Features

### Core Functionality
- **Percentage Discounts**: e.g., 10% off, 99% off
- **Fixed Amount Discounts**: e.g., $5 off, $28 off (for $1 final price)
- **Usage Limits**: Per-coupon usage tracking and limits
- **Validity Periods**: Start and end dates for coupon availability
- **Minimum Order Requirements**: Set minimum order amounts for coupon eligibility
- **Product Restrictions**: Apply coupons to specific product types (future enhancement)

### Testing Support
- **TEST99**: 99% off coupon for $1 Stripe testing
- **DOLLAR1**: Fixed $28 off coupon for $1 final price
- Development hints in UI for easy testing

### Production Features
- **Real-time Validation**: Debounced API validation with loading states
- **Usage Tracking**: Complete audit trail of coupon applications
- **Stripe Integration**: Automatic price adjustment in checkout
- **Analytics Integration**: Coupon usage tracking with Plausible Analytics

## Database Schema

### Tables

#### `coupon_codes`
```sql
CREATE TABLE coupon_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    
    -- Discount configuration
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    
    -- Usage limits
    usage_limit INTEGER, -- NULL = unlimited
    usage_count INTEGER DEFAULT 0 NOT NULL,
    
    -- Validity period
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Product restrictions
    applicable_products JSONB DEFAULT '[]'::jsonb,
    minimum_order_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255)
);
```

#### `coupon_usage`
```sql
CREATE TABLE coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_id UUID NOT NULL REFERENCES coupon_codes(id) ON DELETE CASCADE,
    order_id VARCHAR(255), -- Stripe session ID
    artwork_id UUID REFERENCES artworks(id),
    
    -- Usage details
    original_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,
    
    -- Metadata
    user_email VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Database Functions

#### `validate_coupon_code()`
Validates coupon codes and calculates discounts:
```sql
SELECT * FROM validate_coupon_code('TEST99', 29.00, 'art_print');
```

Returns:
- `is_valid`: Boolean validation result
- `coupon_id`: UUID of the coupon
- `discount_type`: 'percentage' or 'fixed_amount'
- `discount_value`: Discount percentage or amount
- `discount_amount`: Calculated discount in dollars
- `final_amount`: Final price after discount
- `error_message`: Validation error if any

#### `apply_coupon_code()`
Records coupon usage and increments counter:
```sql
SELECT apply_coupon_code(
    'coupon-uuid',
    'stripe-session-id',
    'artwork-uuid',
    29.00,  -- original amount
    28.71,  -- discount amount
    1.00,   -- final amount
    'customer@email.com',
    '192.168.1.1'::inet,
    'Mozilla/5.0...'
);
```

## API Endpoints

### POST `/api/coupons/validate`

Validates coupon codes and calculates pricing.

**Request:**
```json
{
  "code": "TEST99",
  "orderAmount": 29.00,
  "productType": "art_print"
}
```

**Response:**
```json
{
  "isValid": true,
  "couponId": "coupon-uuid",
  "discountType": "percentage",
  "discountValue": 99.00,
  "discountAmount": 28.71,
  "finalAmount": 1.00,
  "savings": 28.71
}
```

**Error Response:**
```json
{
  "isValid": false,
  "errorMessage": "Coupon has expired"
}
```

### GET `/api/coupons/validate`

Alternative GET endpoint for simple validation:
```
GET /api/coupons/validate?code=TEST99&orderAmount=29.00
```

## Frontend Integration

### ProductPurchaseModal

The coupon system is integrated into the purchase modal with:

1. **Collapsible Input**: "Have a coupon code?" button reveals input field
2. **Real-time Validation**: Debounced validation with loading indicators
3. **Visual Feedback**: Success/error states with discount display
4. **Price Summary**: Shows original price, discount, and final total
5. **Development Hints**: Test coupon suggestions in development mode

### Key Components

```typescript
// Coupon state management
const [coupon, setCoupon] = useState<CouponState>(initialCouponState);
const [showCouponInput, setShowCouponInput] = useState(false);

// Validation with debouncing
useEffect(() => {
  const timeoutId = setTimeout(() => {
    if (coupon.code) {
      validateCoupon(coupon.code);
    }
  }, 500);
  return () => clearTimeout(timeoutId);
}, [coupon.code, baseAmount]);
```

### Pricing Calculation

```typescript
// Calculate final pricing with coupon
const finalPricing = coupon.isValid 
  ? calculateCouponPricing(baseAmount, {
      isValid: coupon.isValid,
      discountAmount: coupon.discountAmount,
      finalAmount: coupon.finalAmount
    })
  : {
      originalAmount: baseAmount,
      discountAmount: 0,
      finalAmount: baseAmount,
      savings: 0,
      discountPercentage: 0
    };
```

## Stripe Integration

### Checkout API Enhancement

The checkout API validates coupons server-side and applies pricing:

```typescript
// Server-side coupon validation
if (couponCode && finalAmount !== undefined) {
  const { data: couponValidation } = await supabase.rpc('validate_coupon_code', {
    p_code: couponCode.toUpperCase().trim(),
    p_order_amount: originalAmount || (basePriceInCents * quantity / 100),
    p_product_type: productType
  });
  
  if (couponValidation?.[0]?.is_valid) {
    finalPriceInCents = Math.round(couponValidation[0].final_amount * 100);
    appliedCouponId = couponValidation[0].coupon_id;
  }
}
```

### Metadata Storage

Coupon information is stored in Stripe session metadata:

```typescript
metadata: {
  // ... other fields
  couponCode: couponCode || '',
  couponId: appliedCouponId || '',
  originalAmount: originalAmount?.toString() || '',
  discountAmount: discountAmount?.toString() || '0',
  finalAmount: finalAmount?.toString() || ''
}
```

### Webhook Processing

The Stripe webhook records coupon usage:

```typescript
// Process coupon usage in webhook
if (metadata.couponCode && metadata.couponId) {
  await supabase.rpc('apply_coupon_code', {
    p_coupon_id: metadata.couponId,
    p_order_id: session.id,
    p_artwork_id: metadata.artworkId,
    p_original_amount: parseFloat(metadata.originalAmount || '0'),
    p_discount_amount: parseFloat(metadata.discountAmount || '0'),
    p_final_amount: parseFloat(metadata.finalAmount || '0'),
    p_user_email: session.customer_details?.email || null
  });
}
```

## Test Coupons

### For Stripe Testing ($1 Transactions)

1. **TEST99**: 99% off coupon
   - Reduces $29 order to ~$1
   - Perfect for Stripe test transactions
   - Usage limit: 1000 uses

2. **DOLLAR1**: Fixed $28 off coupon
   - Reduces $29 order to $1 exactly
   - Alternative approach for $1 testing
   - Usage limit: 1000 uses

3. **SAVE44**: Fixed $44 off coupon
   - Reduces $79 order to $35
   - For testing larger discounts
   - Usage limit: 1000 uses

### Production Examples

1. **WELCOME10**: 10% off for new customers
2. **SAVE5**: $5 off any order
3. **HOLIDAY25**: 25% off holiday special (limited uses)

## Usage Examples

### Creating New Coupons

```sql
-- 20% off coupon valid for 3 months
INSERT INTO coupon_codes (code, description, discount_type, discount_value, valid_until, created_by) 
VALUES ('SPRING20', '20% off spring sale', 'percentage', 20.00, NOW() + INTERVAL '3 months', 'admin');

-- $10 off with minimum $50 order
INSERT INTO coupon_codes (code, description, discount_type, discount_value, minimum_order_amount, created_by) 
VALUES ('BIG10', '$10 off orders over $50', 'fixed_amount', 10.00, 50.00, 'admin');

-- Limited use VIP coupon
INSERT INTO coupon_codes (code, description, discount_type, discount_value, usage_limit, created_by) 
VALUES ('VIP50', 'VIP 50% off', 'percentage', 50.00, 100, 'admin');
```

### Frontend Usage

```typescript
import { validateCouponCode, formatDiscountText } from '@/lib/coupons';

// Validate coupon
const result = await validateCouponCode('TEST99', 29.00, 'art_print');

if (result.isValid) {
  console.log(`Discount: ${formatDiscountText(result)}`);
  console.log(`Final price: $${result.finalAmount}`);
}
```

## Analytics Integration

Coupon usage is tracked with Plausible Analytics:

```typescript
// Track coupon application
trackInteraction.couponApplied(couponCode, discountAmount);
```

Events tracked:
- `Coupon Applied`: When valid coupon is entered
- Includes coupon code and discount amount
- Integrated with price variant A/B testing

## Security Features

1. **Server-side Validation**: All coupon validation happens server-side
2. **Usage Limits**: Prevents abuse with configurable limits
3. **Expiration Dates**: Automatic expiration handling
4. **Audit Trail**: Complete usage tracking with timestamps
5. **RLS Policies**: Row-level security for database access
6. **Input Sanitization**: Proper validation and sanitization

## Testing

### Unit Tests
- `/tests/lib/coupons.test.ts`: Core library functions (15 tests)
- `/tests/api/coupons.test.ts`: API endpoint validation (12 tests)

### Test Coverage
- Coupon validation logic
- Pricing calculations
- Error handling
- API endpoint responses
- Database integration
- Edge cases and security

### Running Tests
```bash
# Run coupon-specific tests
npm test -- coupons

# Run all tests
npm test
```

## Deployment

### Database Migration

1. Apply the coupon system migration:
```bash
# Apply migration 015
npm run migration:apply 015_add_coupon_system.sql
```

2. Verify test coupons are created:
```sql
SELECT code, description, discount_type, discount_value 
FROM coupon_codes 
WHERE code IN ('TEST99', 'DOLLAR1', 'WELCOME10');
```

### Environment Variables

No additional environment variables required - uses existing Supabase configuration.

### Production Checklist

- [ ] Database migration applied
- [ ] Test coupons created and validated
- [ ] Stripe integration tested with $1 transactions
- [ ] Analytics tracking verified
- [ ] Error handling tested
- [ ] Security policies verified

## Monitoring

### Key Metrics
- Coupon usage rates by code
- Average discount amounts
- Conversion impact of coupons
- Failed validation attempts

### Database Queries

```sql
-- Coupon usage summary
SELECT 
  cc.code,
  cc.description,
  cc.usage_count,
  cc.usage_limit,
  COUNT(cu.id) as actual_usage,
  AVG(cu.discount_amount) as avg_discount
FROM coupon_codes cc
LEFT JOIN coupon_usage cu ON cc.id = cu.coupon_id
WHERE cc.is_active = true
GROUP BY cc.id, cc.code, cc.description, cc.usage_count, cc.usage_limit;

-- Recent coupon usage
SELECT 
  cc.code,
  cu.original_amount,
  cu.discount_amount,
  cu.final_amount,
  cu.user_email,
  cu.used_at
FROM coupon_usage cu
JOIN coupon_codes cc ON cu.coupon_id = cc.id
ORDER BY cu.used_at DESC
LIMIT 50;
```

## Future Enhancements

1. **Product-Specific Coupons**: Restrict coupons to specific product types
2. **User-Specific Coupons**: One-time use per customer
3. **Bulk Coupon Generation**: Generate multiple unique codes
4. **Admin Dashboard**: UI for coupon management
5. **A/B Testing**: Test different discount strategies
6. **Referral Coupons**: Automatic coupon generation for referrals

## Support

For issues or questions about the coupon system:

1. Check test coverage in `/tests/lib/coupons.test.ts`
2. Verify database functions are working
3. Test with provided test coupons (TEST99, DOLLAR1)
4. Check Stripe webhook logs for coupon processing
5. Monitor Plausible Analytics for coupon events

The coupon system is production-ready and provides comprehensive discount functionality for both testing and real-world use cases.
