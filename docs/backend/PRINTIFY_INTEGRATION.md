# PawPop Printify Integration Technical Documentation

## Overview

This document outlines the complete technical pipeline for PawPop's Printify integration, from image generation to order fulfillment. The system handles three product types: digital downloads, art prints, and framed canvas prints.

## Architecture Overview

```
User Upload → Image Generation → Payment → Order Processing → Printify Fulfillment
     ↓              ↓              ↓            ↓                    ↓
  Supabase      FAL.ai API     Stripe      Webhook Handler      Physical Product
```

## Product Configuration

### Supported Products

1. **Digital Download** (`ProductType.DIGITAL`)
   - Price: $9.99
   - No Printify integration required
   - Delivered via email after payment

2. **Art Print** (`ProductType.ART_PRINT`)
   - **US/Canada**: Photo Art Paper Posters (Blueprint ID: 1191)
     - 12x18: $29.99
     - 16x20: $39.99
     - 18x24: $49.99
   - **Europe**: Giclee Art Print (Blueprint ID: 494)
     - 12x18: $34.99
     - 16x20: $44.99
     - 18x24: $54.99

3. **Framed Canvas** (`ProductType.FRAMED_CANVAS`)
   - **Global**: Matte Canvas Framed Multi-Color (Blueprint ID: 944)
     - 12x16: $79.99
     - 16x20: $99.99
     - 20x24: $129.99

## Database Schema (Supabase)

### Required Tables

```sql
-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Generated artworks table
CREATE TABLE artworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  original_image_url TEXT NOT NULL,
  generated_image_url TEXT NOT NULL,
  pet_name TEXT,
  customer_name TEXT NOT NULL,
  generation_status TEXT DEFAULT 'pending', -- pending, completed, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artwork_id UUID REFERENCES artworks(id),
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  product_type TEXT NOT NULL, -- digital, art_print, framed_canvas
  product_size TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  shipping_address JSONB, -- For physical products
  order_status TEXT DEFAULT 'pending', -- pending, paid, processing, shipped, delivered, cancelled
  printify_order_id TEXT, -- Null for digital products
  printify_status TEXT, -- Printify order status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order status history
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_artworks_user ON artworks(user_id);
```

## Technical Pipeline

### 1. Image Generation Phase

```typescript
// When user uploads image and selects product
const artwork = await supabase
  .from('artworks')
  .insert({
    user_id: userId,
    original_image_url: uploadedImageUrl,
    pet_name: petName,
    customer_name: customerName,
    generation_status: 'pending'
  })
  .select()
  .single();

// Generate MonaLisa artwork using existing pipeline
const generatedImageUrl = await generateMonaLisaArtwork(uploadedImageUrl);

// Update artwork with generated image
await supabase
  .from('artworks')
  .update({ 
    generated_image_url: generatedImageUrl,
    generation_status: 'completed'
  })
  .eq('id', artwork.id);
```

### 2. Checkout Phase

```typescript
// Create Stripe checkout session with metadata
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: {
        name: `PawPop ${productType} - ${size}`,
        images: [generatedImageUrl]
      },
      unit_amount: getProductPricing(productType, size, countryCode)
    },
    quantity: 1
  }],
  mode: 'payment',
  success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
  metadata: {
    artworkId: artwork.id,
    productType,
    size,
    customerName,
    petName,
    imageUrl: generatedImageUrl
  },
  shipping_address_collection: productType !== 'digital' ? {
    allowed_countries: ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT']
  } : undefined
});

// Create order record
await supabase
  .from('orders')
  .insert({
    artwork_id: artwork.id,
    stripe_session_id: session.id,
    product_type: productType,
    product_size: size,
    price_cents: getProductPricing(productType, size, countryCode),
    customer_email: customerEmail,
    customer_name: customerName,
    order_status: 'pending'
  });
```

### 3. Payment Webhook Processing

```typescript
// /api/webhook/route.ts
case 'checkout.session.completed':
  const session = event.data.object;
  
  // Update order status
  await supabase
    .from('orders')
    .update({ 
      order_status: 'paid',
      stripe_payment_intent_id: session.payment_intent,
      shipping_address: session.shipping_details
    })
    .eq('stripe_session_id', session.id);

  // Process order (create Printify order for physical products)
  const metadata = parseOrderMetadata(session);
  if (metadata) {
    await processOrder({ session, metadata });
  }
```

### 4. Printify Order Creation

```typescript
// For physical products only
if (productType !== ProductType.DIGITAL) {
  // Create Printify product
  const { productId, variantId } = await getOrCreatePrintifyProduct(
    productType,
    size,
    generatedImageUrl,
    shippingCountry,
    customerName,
    petName
  );

  // Create Printify order
  const printifyOrder = await createPrintifyOrder(shopId, {
    external_id: session.id,
    label: `PawPop Order - ${customerName}`,
    line_items: [{
      product_id: productId,
      variant_id: variantId,
      quantity: 1,
      print_areas: { front: generatedImageUrl }
    }],
    shipping_method: 1, // Standard shipping
    send_shipping_notification: true,
    address_to: shippingAddress
  });

  // Update order with Printify details
  await supabase
    .from('orders')
    .update({
      printify_order_id: printifyOrder.id,
      printify_status: printifyOrder.status,
      order_status: 'processing'
    })
    .eq('stripe_session_id', session.id);
}
```

### 5. Order Status Tracking

```typescript
// /api/webhook/printify/route.ts
case 'order:updated':
  const orderData = body.data;
  
  // Update order status in database
  await supabase
    .from('orders')
    .update({
      printify_status: orderData.status,
      order_status: mapPrintifyStatusToOrderStatus(orderData.status)
    })
    .eq('printify_order_id', orderData.id);

  // Add to status history
  await supabase
    .from('order_status_history')
    .insert({
      order_id: order.id,
      status: orderData.status,
      notes: `Printify status update: ${orderData.status}`
    });

  // Send customer notification
  await sendOrderStatusEmail(order, orderData.status);
```

## Environment Variables Required

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Printify
PRINTIFY_API_TOKEN=your_printify_api_token
PRINTIFY_SHOP_ID=your_printify_shop_id
PRINTIFY_WEBHOOK_SECRET=your_printify_webhook_secret

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## API Endpoints

### Webhook Endpoints

1. **Stripe Webhooks**: `/api/webhook`
   - Handles: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`

2. **Printify Webhooks**: `/api/webhook/printify`
   - Handles: `order:updated`, `order:sent-to-production`, `order:shipment:created`, `order:shipment:delivered`

### Order Management

1. **Get Order Status**: `/api/orders/[orderId]`
2. **Get User Orders**: `/api/orders/user/[userId]`
3. **Retry Failed Orders**: `/api/orders/retry/[orderId]`

## Status Mapping

### Order Status Flow
```
pending → paid → processing → shipped → delivered
                     ↓
                 cancelled (if issues)
```

### Printify Status Mapping
```javascript
function mapPrintifyStatusToOrderStatus(printifyStatus) {
  switch (printifyStatus) {
    case 'pending': return 'processing';
    case 'in-production': return 'processing';
    case 'fulfilled': return 'shipped';
    case 'shipped': return 'shipped';
    case 'delivered': return 'delivered';
    case 'cancelled': return 'cancelled';
    default: return 'processing';
  }
}
```

## Error Handling & Retry Logic

### Failed Order Processing
```typescript
// Implement retry logic for failed Printify orders
async function retryFailedOrder(orderId: string) {
  const order = await supabase
    .from('orders')
    .select('*, artworks(*)')
    .eq('id', orderId)
    .single();

  if (order.order_status === 'paid' && !order.printify_order_id) {
    // Retry Printify order creation
    await processOrder({
      session: { id: order.stripe_session_id },
      metadata: {
        productType: order.product_type,
        imageUrl: order.artworks.generated_image_url,
        size: order.product_size,
        customerName: order.customer_name,
        petName: order.artworks.pet_name
      }
    });
  }
}
```

## Testing Checklist

- [ ] Digital product order (no Printify integration)
- [ ] Art print order (US/Canada region)
- [ ] Art print order (Europe region)
- [ ] Framed canvas order (Global)
- [ ] Stripe webhook processing
- [ ] Printify webhook processing
- [ ] Order status updates
- [ ] Failed order retry logic
- [ ] Email notifications
- [ ] Database consistency

## Monitoring & Logging

### Key Metrics to Track
- Order completion rate
- Printify order success rate
- Average fulfillment time
- Customer satisfaction scores
- Failed order reasons

### Log Events
- Order created
- Payment completed
- Printify order created
- Order status changes
- Failed operations with error details

## Future Enhancements

1. **Inventory Management**: Track Printify product availability
2. **Shipping Optimization**: Dynamic shipping method selection
3. **International Expansion**: Add more regions and print providers
4. **Order Tracking**: Real-time tracking integration
5. **Customer Portal**: Self-service order management
6. **Analytics Dashboard**: Order and revenue analytics
