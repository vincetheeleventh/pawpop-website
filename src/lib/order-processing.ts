// src/lib/order-processing.ts
import Stripe from 'stripe';
import { 
  createPrintifyOrder, 
  getProductConfig, 
  ProductType, 
  PrintifyOrderRequest,
  PrintifyShippingAddress 
} from './printify';
import { 
  getOrCreatePrintifyProduct, 
  validateOrderData 
} from './printify-products';
import {
  updateOrderAfterPayment,
  updateOrderWithPrintify,
  updateOrderFromPrintify,
  getOrderByStripeSession,
  addOrderStatusHistory
} from './supabase-orders';
import {
  getArtworkById,
  updateArtworkUpscaleStatus
} from './supabase-artworks';

export interface OrderMetadata {
  productType: ProductType;
  imageUrl: string;
  size: string;
  customerName: string;
  petName?: string;
  frameUpgrade?: boolean;
}

export interface ProcessOrderParams {
  session: Stripe.Checkout.Session;
  metadata: OrderMetadata;
}

// Extract shipping address from Stripe session
function extractShippingAddress(session: Stripe.Checkout.Session): PrintifyShippingAddress | null {
  const shipping = (session as any).shipping_details;
  if (!shipping?.address || !session.customer_details?.email) {
    return null;
  }

  const address = shipping.address;
  const [firstName, ...lastNameParts] = (shipping.name || '').split(' ');
  const lastName = lastNameParts.join(' ') || '';

  return {
    first_name: firstName || 'Customer',
    last_name: lastName || '',
    email: session.customer_details.email,
    phone: session.customer_details.phone || undefined,
    country: address.country || '',
    region: address.state || undefined,
    address1: address.line1 || '',
    address2: address.line2 || undefined,
    city: address.city || '',
    zip: address.postal_code || ''
  };
}

// Get the appropriate shipping method (simplified - returns standard shipping)
async function getShippingMethod(countryCode: string): Promise<number> {
  // In a real implementation, you'd call getShippingMethods from printify.ts
  // and select the appropriate method based on customer preference or default
  // For now, return a standard shipping method ID (1 is typically standard)
  return 1;
}

// Trigger upscaling for physical products
async function triggerUpscaling(artworkId: string): Promise<string> {
  console.log(`🔍 Triggering upscaling for artwork ${artworkId}`);
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/upscale`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ artworkId }),
    });

    if (!response.ok) {
      throw new Error(`Upscaling API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Upscaling failed');
    }

    console.log(`✅ Upscaling completed for artwork ${artworkId}: ${result.upscaled_image_url}`);
    return result.upscaled_image_url;
    
  } catch (error) {
    console.error(`❌ Upscaling failed for artwork ${artworkId}:`, error);
    
    // Mark as failed in database
    await updateArtworkUpscaleStatus(artworkId, 'failed');
    
    // Re-throw to let caller handle fallback
    throw error;
  }
}

// Process a completed Stripe checkout session
export async function processOrder({ session, metadata }: ProcessOrderParams): Promise<void> {
  const { productType, imageUrl, size, customerName, petName, frameUpgrade } = metadata;

  // Update order status to paid in database
  await updateOrderAfterPayment(
    session.id,
    session.payment_intent as string,
    (session as any).shipping_details
  );

  // Add status history
  const order = await getOrderByStripeSession(session.id);
  if (order) {
    await addOrderStatusHistory(order.id, 'paid', 'Payment completed via Stripe');
  }

  // Skip Printify for digital products
  if (productType === ProductType.DIGITAL) {
    console.log(`Digital product order processed for session: ${session.id}`);
    // For digital products, mark upscaling as not required
    if (order?.artwork_id) {
      await updateArtworkUpscaleStatus(order.artwork_id, 'not_required');
    }
    // TODO: Send digital download email
    return;
  }

  // For physical products, trigger upscaling before Printify order creation
  let finalImageUrl = imageUrl;
  if (order?.artwork_id) {
    try {
      console.log(`🎨 Starting upscaling process for physical product order ${session.id}`);
      finalImageUrl = await triggerUpscaling(order.artwork_id);
      console.log(`✅ Using upscaled image for Printify: ${finalImageUrl}`);
      
      if (order) {
        await addOrderStatusHistory(order.id, 'processing', 'Image upscaled successfully, creating Printify order');
      }
    } catch (upscaleError) {
      console.warn(`⚠️ Upscaling failed for order ${session.id}, using original image:`, upscaleError);
      
      if (order) {
        await addOrderStatusHistory(order.id, 'processing', 'Upscaling failed, using original image for Printify order');
      }
      
      // Continue with original image - don't fail the entire order
      finalImageUrl = imageUrl;
    }
  }

  // Handle frame upgrade for canvas stretched products
  let finalProductType = productType;
  if (productType === ProductType.CANVAS_STRETCHED && frameUpgrade) {
    console.log(`🖼️ Frame upgrade requested for canvas stretched product`);
    finalProductType = ProductType.CANVAS_FRAMED;
    
    if (order) {
      await addOrderStatusHistory(order.id, 'processing', 'Frame upgrade applied - using framed canvas product');
    }
  }

  // Extract shipping information
  const shippingAddress = extractShippingAddress(session);
  if (!shippingAddress) {
    throw new Error('Missing shipping address for physical product');
  }

  // Validate order data
  const validation = validateOrderData(productType, size, shippingAddress.country, finalImageUrl);
  if (!validation.isValid) {
    throw new Error(`Order validation failed: ${validation.error}`);
  }

  // Create or get Printify product
  const { productId, variantId } = await getOrCreatePrintifyProduct(
    finalProductType,
    size,
    finalImageUrl,
    shippingAddress.country,
    customerName,
    petName
  );

  // Get shipping method
  const shippingMethod = await getShippingMethod(shippingAddress.country);

  // Create Printify order
  const orderData: PrintifyOrderRequest = {
    external_id: session.id,
    label: `PawPop Order - ${customerName}${petName ? ` (${petName})` : ''}${frameUpgrade ? ' (Framed)' : ''}`,
    line_items: [
      {
        product_id: productId,
        variant_id: variantId,
        quantity: 1,
        print_areas: {
          front: finalImageUrl
        }
      }
    ],
    shipping_method: shippingMethod,
    send_shipping_notification: true,
    address_to: shippingAddress
  };

  // Get shop ID from environment
  const shopId = process.env.PRINTIFY_SHOP_ID;
  if (!shopId) {
    throw new Error('PRINTIFY_SHOP_ID environment variable is not set');
  }

  try {
    const printifyOrder = await createPrintifyOrder(shopId, orderData);
    console.log(`Printify order created successfully:`, printifyOrder);
    
    // Update order with Printify details
    await updateOrderWithPrintify(session.id, printifyOrder.id, printifyOrder.status);
    
    if (order) {
      await addOrderStatusHistory(order.id, 'processing', `Printify order created: ${printifyOrder.id}`);
    }
    
  } catch (error) {
    console.error('Failed to create Printify order:', error);
    
    // Log the failure for retry later
    if (order) {
      await addOrderStatusHistory(order.id, 'failed', `Printify order creation failed: ${error}`);
    }
    
    throw error;
  }
}

// Parse order metadata from Stripe session
export function parseOrderMetadata(session: Stripe.Checkout.Session): OrderMetadata | null {
  const metadata = session.metadata;
  if (!metadata) return null;

  return {
    productType: metadata.productType as ProductType,
    imageUrl: metadata.imageUrl,
    size: metadata.size,
    customerName: metadata.customerName,
    petName: metadata.petName || undefined,
    frameUpgrade: metadata.frameUpgrade === 'true'
  };
}

// Handle order fulfillment status updates
export async function handleOrderStatusUpdate(orderId: string, status: string): Promise<void> {
  console.log(`Order ${orderId} status updated to: ${status}`);
  
  // TODO: Update order status in database
  // TODO: Send status update email to customer
  
  switch (status) {
    case 'fulfilled':
      console.log(`Order ${orderId} has been fulfilled and shipped`);
      break;
    case 'cancelled':
      console.log(`Order ${orderId} has been cancelled`);
      break;
    case 'on-hold':
      console.log(`Order ${orderId} is on hold`);
      break;
    default:
      console.log(`Order ${orderId} status: ${status}`);
  }
}
