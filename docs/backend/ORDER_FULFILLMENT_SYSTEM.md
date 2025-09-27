# PawPop Order Fulfillment System

## Overview
This document provides comprehensive documentation for PawPop's high-resolution order fulfillment system, including Printify integration with mirror sides configuration, manual approval workflows, and automated order processing.

---

## 🚀 System Architecture

### Core Components
1. **High-Resolution Image Processing** - fal.ai clarity-upscaler integration
2. **Manual Approval System** - Human-in-the-loop quality control
3. **Printify Integration** - Product creation and order fulfillment
4. **Mirror Sides Configuration** - Professional canvas printing on both sides
5. **Order Status Management** - Comprehensive tracking and error handling

### Technology Stack
- **Image Processing:** fal.ai clarity-upscaler (3x resolution enhancement)
- **Print-on-Demand:** Printify API with Jondo print provider
- **Database:** Supabase with JSONB order tracking
- **Payment Processing:** Stripe with enhanced webhook handling
- **Quality Control:** Admin dashboard with manual review capabilities

---

## 📋 Order Processing Pipeline

### 1. Payment Confirmation
**Trigger:** Stripe `checkout.session.completed` webhook
**Duration:** Immediate (< 1 second)

```typescript
// Webhook processing
const session = await stripe.checkout.sessions.retrieve(sessionId, {
  expand: ['shipping_details', 'customer_details']
});

// Order status update
await updateOrderStatus(sessionId, 'paid', {
  shipping_address: session.shipping_details.address,
  customer_details: session.customer_details
});
```

**Key Actions:**
- Extract payment and shipping information
- Update order status from `pending` to `paid`
- Store shipping address in JSONB format
- Trigger next pipeline stage

### 2. Image Upscaling (Physical Products Only)
**Trigger:** Order status change to `paid`
**Duration:** 30-90 seconds
**API:** fal.ai clarity-upscaler

```typescript
// Upscaling configuration
const upscaleRequest = {
  image_url: originalArtworkUrl,
  scale: 3, // 3x resolution increase
  creativity: 0.35, // Oil painting texture optimization
  resemblance: 0.8, // Preserve original artwork details
  hdr: 0.2 // Enhanced dynamic range
};
```

**Quality Improvements:**
- **Input Resolution:** ~1024x1024 pixels
- **Output Resolution:** ~3072x3072 pixels (3x factor)
- **Target Quality:** 300 DPI print quality
- **Texture Optimization:** Oil painting style preservation
- **Fallback:** Original image if upscaling fails

### 3. High-Resolution Quality Control
**Trigger:** Upscaling completion
**Duration:** Variable (minutes to hours)
**System:** Manual Approval Dashboard

#### When Enabled (`ENABLE_HUMAN_REVIEW=true`)
1. **Review Creation:**
   ```typescript
   const review = await createAdminReview({
     artwork_id: artworkId,
     review_type: 'highres_file',
     image_url: upscaledImageUrl,
     customer_email: customerEmail,
     notes: 'High-resolution file ready for review'
   });
   ```

2. **Admin Notification:**
   - Email sent to `pawpopart@gmail.com`
   - Direct link to review dashboard
   - Customer and artwork details included

3. **Review Process:**
   - Admin accesses `/admin/reviews` dashboard
   - Reviews high-resolution artwork quality
   - Approves or rejects with notes
   - On approval: Triggers Printify order creation

#### When Disabled
- Automatic progression to Printify order creation
- No manual intervention required
- Faster processing time

### 4. Printify Product Creation & Order Fulfillment
**Trigger:** Admin approval OR automatic progression
**Duration:** 2-5 minutes
**Provider:** Printify with Jondo print provider

#### Product Configuration

**Framed Canvas (Blueprint 944)**
```typescript
const framedCanvasConfig = {
  blueprint_id: 944, // Matte Canvas, Framed Multi-color
  print_provider_id: 105, // Jondo
  variants: [
    { id: 111829, size: '12x18', price: 9900 }, // $99.00 CAD
    { id: 111837, size: '16x24', price: 11900 }, // $119.00 CAD
    { id: 88295, size: '20x30', price: 14900 }  // $149.00 CAD
  ]
};
```

**Stretched Canvas (Blueprint 1159)**
```typescript
const stretchedCanvasConfig = {
  blueprint_id: 1159, // Matte Canvas, Stretched, 1.25"
  print_provider_id: 105, // Jondo
  variants: [
    { id: 91644, size: '12x18', price: 5900 }, // $59.00 CAD
    { id: 91647, size: '16x24', price: 7900 }, // $79.00 CAD
    { id: 91650, size: '20x30', price: 9900 }  // $99.00 CAD
  ]
};
```

#### Mirror Sides Configuration
```typescript
const printDetails = {
  print_on_side: "mirror", // Mirror image on both sides
  print_on_sides: true     // Enable printing on both sides
};
```

**Benefits:**
- **Professional Finish:** Image appears on both sides of canvas
- **Premium Quality:** Mirrored effect for sophisticated appearance
- **Consistent Branding:** Uniform look across all canvas products

#### Order Creation Process
1. **Image Upload to Printify:**
   ```typescript
   const printifyImageId = await uploadImageToPrintify(
     approvedImageUrl, 
     `${customerName}_${petName}_artwork.png`
   );
   ```

2. **Product Creation:**
   ```typescript
   const product = await createPrintifyProduct(
     blueprintId,
     printProviderId,
     productTitle,
     productDescription,
     printifyImageId,
     productType,
     size,
     shopId
   );
   ```

3. **Order Submission:**
   ```typescript
   const order = await createPrintifyOrder(shopId, {
     external_id: stripeSessionId,
     label: `PawPop Order - ${customerName}`,
     line_items: [{
       product_id: product.id,
       variant_id: variantId,
       quantity: quantity
     }],
     shipping_method: shippingMethodId,
     address_to: shippingAddress
   });
   ```

### 5. Order Status Updates
**Trigger:** Printify order creation success/failure
**Duration:** Immediate

```typescript
// Success path
await updateOrderWithPrintify(
  stripeSessionId, 
  printifyOrder.id, 
  'processing'
);

// Failure path
await addOrderStatusHistory(
  orderId, 
  'failed', 
  `Printify order creation failed: ${error.message}`
);
```

---

## 🔧 Technical Implementation

### Core Files
- **`/src/lib/order-processing.ts`** - Main order processing pipeline
- **`/src/lib/printify.ts`** - Printify API integration with mirror sides
- **`/src/lib/printify-products.ts`** - Product configuration and management
- **`/src/app/api/webhook/route.ts`** - Enhanced Stripe webhook handler
- **`/src/app/api/admin/reviews/[reviewId]/process/route.ts`** - Manual approval API

### Database Schema
```sql
-- Order tracking
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  stripe_session_id TEXT UNIQUE,
  order_status TEXT CHECK (order_status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed')),
  printify_order_id TEXT,
  printify_status TEXT,
  shipping_address JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin reviews for quality control
CREATE TABLE admin_reviews (
  id UUID PRIMARY KEY,
  artwork_id UUID REFERENCES artworks(id),
  review_type TEXT CHECK (review_type IN ('artwork_proof', 'highres_file')),
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')),
  image_url TEXT,
  reviewed_by TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order status history
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY,
  order_id UUID REFERENCES orders(id),
  status TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Environment Configuration
```bash
# Printify Integration
PRINTIFY_API_TOKEN=your_printify_api_token
PRINTIFY_SHOP_ID=your_shop_id
PRINTIFY_WEBHOOK_SECRET=your_webhook_secret

# Quality Control System
ENABLE_HUMAN_REVIEW=true  # Enable manual approval
ADMIN_EMAIL=pawpopart@gmail.com  # Admin notification email

# Image Processing
FAL_AI_API_KEY=your_fal_ai_key

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 📊 Success Metrics & Monitoring

### Key Performance Indicators
- **Order Processing Success Rate:** >95%
- **Upscaling Success Rate:** >90%
- **Printify Order Creation Rate:** >95%
- **Admin Approval Time:** <2 hours (when enabled)
- **End-to-End Processing Time:** <10 minutes (automated)

### Error Handling
```typescript
// Comprehensive error tracking
try {
  await processOrderAfterPayment(sessionId);
} catch (error) {
  await addOrderStatusHistory(orderId, 'failed', error.message);
  await notifyAdminOfFailure(sessionId, error);
  throw error; // Re-throw for webhook retry
}
```

### Monitoring Endpoints
- **`GET /api/orders/cleanup`** - Check stale orders
- **`POST /api/orders/cleanup`** - Clean up abandoned orders
- **`GET /api/monitoring/health`** - System health check
- **`GET /api/admin/reviews`** - Review queue status

---

## 🧪 Testing & Validation

### Successful Test Orders
- **Order ID:** `68d78232029e3c12650ddf2b` - Initial integration test
- **Order ID:** `68d7849879b04aaa87076ef3` - Direct API validation
- **Order ID:** `68d7862be77507206d0ab2fc` - Complete workflow with mirror sides

### Test Product
- **Product ID:** `68d785df810d45ac0e024460` - Canvas with mirror sides enabled
- **Variant ID:** `111837` - 16x24 framed canvas
- **Configuration:** Mirror sides enabled, professional finish

### Validation Checklist
- ✅ **Payment Processing:** Stripe webhook handling
- ✅ **Image Upscaling:** fal.ai integration working
- ✅ **Manual Approval:** Admin dashboard functional
- ✅ **Printify Integration:** Product creation and order submission
- ✅ **Mirror Sides:** Professional canvas printing configuration
- ✅ **Error Handling:** Comprehensive failure recovery
- ✅ **Status Tracking:** Complete order lifecycle management

---

## 🚀 Production Deployment

### Pre-Deployment Checklist
1. **Environment Variables:** All required variables configured
2. **Database Migrations:** Applied with rollback capability
3. **Webhook Endpoints:** Stripe and Printify webhooks configured
4. **Admin Dashboard:** Manual approval system accessible
5. **Monitoring:** Health checks and alerting configured
6. **Testing:** End-to-end workflow validated

### Deployment Steps
1. **Code Deployment:** Push to production branch
2. **Database Migration:** Apply schema changes
3. **Environment Configuration:** Update production variables
4. **Webhook Configuration:** Update Stripe webhook URLs
5. **Health Check:** Verify all systems operational
6. **Admin Training:** Brief team on manual approval process

### Post-Deployment Monitoring
- **Order Processing Rate:** Monitor success/failure rates
- **Admin Review Queue:** Check for pending reviews
- **Printify Integration:** Verify order creation success
- **Customer Communication:** Ensure email delivery
- **System Performance:** Monitor processing times

---

## 🔄 Operational Procedures

### Daily Operations
1. **Review Queue Check:** Monitor `/admin/reviews` for pending items
2. **Order Status Review:** Check for failed or stuck orders
3. **System Health:** Verify all integrations operational
4. **Customer Support:** Address any fulfillment issues

### Weekly Maintenance
1. **Order Cleanup:** Run `/api/orders/cleanup` to remove stale orders
2. **Performance Review:** Analyze success rates and processing times
3. **Error Analysis:** Review failed orders and implement fixes
4. **Capacity Planning:** Monitor order volume and system load

### Emergency Procedures
1. **System Outage:** Disable `ENABLE_HUMAN_REVIEW` for faster processing
2. **Printify Issues:** Manual order creation via Printify dashboard
3. **Payment Failures:** Manual order reconciliation with Stripe
4. **Quality Issues:** Enable manual approval for all orders

---

## 📚 Additional Resources

### API Documentation
- **Printify API:** https://developers.printify.com/
- **fal.ai Documentation:** https://fal.ai/docs
- **Stripe Webhooks:** https://stripe.com/docs/webhooks

### Internal Documentation
- **Admin Dashboard Guide:** `/docs/admin/REVIEW_DASHBOARD.md`
- **Database Schema:** `/docs/backend/SUPABASE_SCHEMA.sql`
- **API Endpoints:** `/docs/api/ORDER_PROCESSING_API.md`

### Support Contacts
- **Technical Issues:** Development team
- **Printify Support:** Printify customer service
- **Payment Issues:** Stripe support
- **Quality Control:** Admin review team

---

*Last Updated: 2025-09-26*
*Version: 1.0 - High-Resolution Order Fulfillment with Mirror Sides*
