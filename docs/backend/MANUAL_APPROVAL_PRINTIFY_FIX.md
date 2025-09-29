# Manual Approval → Printify Integration Fix

## Current Schema: UUID-Based Architecture

**IMPORTANT**: This documentation reflects the current UUID-based schema where:
- **Artwork IDs**: UUID format (e.g., `12345678-1234-1234-1234-123456789012`)
- **Access Tokens**: 64-character hex strings for artwork page URLs
- **Database**: JSONB structure for images and metadata
- **APIs**: Expect UUID format for artwork operations

## Problem Identified

The manual approval workflow for high-resolution files was **NOT properly integrated** with Printify order creation. Here's what was happening:

### **Broken Flow (Before Fix):**
1. ✅ Customer purchases → Payment processed
2. ✅ Order processing begins → Image upscaled  
3. ✅ High-res admin review created
4. ❌ **Printify order created IMMEDIATELY** - **WITHOUT waiting for approval**
5. ❌ Admin approval happened later but **didn't trigger Printify order creation**

### **Result:**
- Printify orders were created with unreviewed high-res images
- Admin approval had no effect on the actual order fulfillment
- Manual quality control was bypassed

## Solution Implemented

### **Fixed Flow (After Fix):**
1. ✅ Customer purchases → Payment processed
2. ✅ Order processing begins → Image upscaled
3. ✅ High-res admin review created → **ORDER PROCESSING STOPS HERE**
4. ✅ Order status set to `pending_review`
5. ✅ Admin approves high-res file → **TRIGGERS Printify order creation**
6. ✅ Printify order uses approved high-res image with correct shipping address

## Files Modified

### 1. **Order Processing Logic** (`/src/lib/order-processing.ts`)

**Key Changes:**
- Added conditional check for `isHumanReviewEnabled()`
- Order processing **stops** after creating high-res review (when manual review enabled)
- Order status set to `pending_review` instead of continuing to Printify
- Created new `createPrintifyOrderAfterApproval()` function

**Code Changes:**
```typescript
// NEW: Stop processing when manual review is enabled
if (isHumanReviewEnabled()) {
  await createAdminReview({
    artwork_id: order.artwork_id,
    review_type: 'highres_file',
    image_url: finalImageUrl,
    customer_name: customerName,
    customer_email: session.customer_details?.email || '',
    pet_name: petName
  });
  
  await addOrderStatusHistory(order.id, 'pending_review', 'High-res file submitted for admin review - awaiting approval before Printify order creation');
  await updateOrderStatus(order.stripe_session_id, 'pending_review');
  
  // CRITICAL: Stop processing here
  console.log('🛑 Order processing paused - waiting for high-res file approval');
  return;
}
```

### 2. **Admin Approval Process** (`/src/app/api/admin/reviews/[reviewId]/process/route.ts`)

**Key Changes:**
- Enhanced approval process to handle different review types
- Added Printify order creation trigger for `highres_file` approvals
- Maintains existing completion email for `artwork_proof` approvals

**Code Changes:**
```typescript
// NEW: Handle high-res file approval
else if (review.review_type === 'highres_file') {
  console.log('🎯 High-res file approved! Triggering Printify order creation...')
  
  // Find the associated order
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('stripe_session_id')
    .eq('artwork_id', review.artwork_id)
    .eq('order_status', 'pending_review')
    
  if (orders && orders.length > 0) {
    const stripeSessionId = orders[0].stripe_session_id
    
    // Trigger Printify order creation
    const { createPrintifyOrderAfterApproval } = await import('@/lib/order-processing')
    await createPrintifyOrderAfterApproval(stripeSessionId, review.image_url)
  }
}
```

### 3. **Database Operations** (`/src/lib/supabase-orders.ts`)

**Key Changes:**
- Added generic `updateOrderStatus()` function
- Enhanced order status management

**Code Changes:**
```typescript
// NEW: Generic order status update function
export async function updateOrderStatus(
  stripeSessionId: string,
  status: string
): Promise<void> {
  const { error } = await ensureSupabaseAdmin()
    .from('orders')
    .update({
      order_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_session_id', stripeSessionId);

  if (error) {
    console.error('Error updating order status:', error);
    throw new Error(`Failed to update order status: ${error.message}`);
  }
}
```

### 4. **New Printify Order Creation Function**

**Key Features:**
- Retrieves original Stripe session for shipping address
- Uses approved high-res image URL
- Maintains all original order metadata (quantity, frame upgrade, etc.)
- Proper error handling and order status updates

**Function:**
```typescript
export async function createPrintifyOrderAfterApproval(
  stripeSessionId: string,
  approvedImageUrl: string
): Promise<void>
```

## Workflow Verification

### **Environment Configuration Required:**
```env
ENABLE_HUMAN_REVIEW=true    # Enable manual approval system
ADMIN_EMAIL=pawpopart@gmail.com  # Admin notification recipient
```

### **Complete Workflow:**
1. **Customer Purchase** → Stripe checkout with shipping address collection
2. **Order Processing** → Image upscaling → High-res review creation → **STOP**
3. **Admin Notification** → Email sent to `pawpopart@gmail.com`
4. **Admin Review** → Access `/admin/reviews` dashboard
5. **Admin Approval** → Triggers Printify order creation with:
   - ✅ Approved high-resolution image
   - ✅ Original shipping address from Stripe
   - ✅ All original order metadata (quantity, size, frame upgrade)
   - ✅ Correct product configuration

### **Quality Control Benefits:**
- **Manual Review**: Admin can reject poor quality upscaled images
- **Image Replacement**: Admin can upload replacement images if needed
- **Order Accuracy**: Printify orders only created after approval
- **Customer Experience**: No defective products shipped
## Testing

### **Test Script Created:**
`/scripts/test-manual-approval-printify.js`

### **Schema Compatibility:**
- **UUID Artwork IDs**: Required for all API operations (upscaling, admin reviews)
- **Access Tokens**: Used only for artwork page URLs (`/artwork/[token]`)
- **Database Structure**: JSONB fields for `source_images`, `generated_images`, `processing_status`
- **API Endpoints**: All expect UUID format artwork IDs

### **Test Data Format:**
- **Artwork ID**: UUID format (e.g., `2010158d-b508-4aca-ad73-9c96131d22fe`)
- **Access Token**: 64-char hex (e.g., `a37817b3e3b6072902813af2fc3b5ec07a185da41a9858c0f1d2df54b3ddfe0c`)
- **Product**: Framed Canvas (16x24) - $79.99
- **Customer**: test / vxi@Live.ca
- **Shipping**: US address (123 Test Street, San Francisco, CA 94105)

### **Manual Testing Steps:**
1. Set `ENABLE_HUMAN_REVIEW=true`
2. Purchase a physical product (framed canvas/art print)
4. Check admin dashboard for high-res review
5. Approve the review
6. Verify Printify order creation with correct details

## Production Deployment

### **Schema Requirements:**
- [ ] Database uses UUID artwork IDs for all operations
- [ ] APIs expect UUID format (36 characters with dashes)
- [ ] Access tokens (64-char hex) used only for artwork page URLs
- [ ] JSONB structure for image and metadata storage

### **Deployment Checklist:**
- [ ] Environment variable `ENABLE_HUMAN_REVIEW=true` set
- [ ] Admin email configured: `ADMIN_EMAIL=pawpopart@gmail.com`
- [ ] All Printify API credentials configured
- [ ] UUID-based artwork creation working
- [ ] Test the complete workflow end-to-end with UUID artwork IDs
- [ ] Monitor order status progression

### **Rollback Plan:**
- Set `ENABLE_HUMAN_REVIEW=false` to disable manual approval
- Orders will process automatically without review stops
- Existing pending orders can be manually processed

## Impact

### **Before Fix:**
- ❌ Manual approval was ineffective
- ❌ Unreviewed images sent to Printify
- ❌ Quality control bypassed

### **After Fix:**
- ✅ True manual quality control
- ✅ Only approved images sent to Printify
- ✅ Proper shipping address handling
- ✅ Complete audit trail
- ✅ Easy enable/disable toggle

The manual approval system now provides **genuine quality control** for high-resolution files before they are sent to Printify for physical product creation, ensuring customer satisfaction and reducing defective orders.
