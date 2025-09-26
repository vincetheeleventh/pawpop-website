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
  shippingMethodId?: number;
  quantity?: number;
  artworkId?: string;
  couponCode?: string;
  couponId?: string;
  originalAmount?: string;
  discountAmount?: string;
  finalAmount?: string;
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

// Shipping method interface
export interface ShippingOption {
  id: number;
  name: string;
  cost: number;
  estimatedDays: string;
  isDefault?: boolean;
}

// Get available shipping methods for a product and country
export async function getAvailableShippingMethods(
  productType: ProductType,
  countryCode: string
): Promise<ShippingOption[]> {
  try {
    const productConfig = getProductConfig(productType, countryCode);
    if (!productConfig) {
      throw new Error(`No product configuration found for ${productType} in ${countryCode}`);
    }

    const shopId = process.env.PRINTIFY_SHOP_ID;
    if (!shopId) {
      throw new Error('PRINTIFY_SHOP_ID environment variable is not set');
    }

    // Import getShippingMethods from printify.ts
    const { getShippingMethods } = await import('./printify');
    
    const shippingMethods = await getShippingMethods(
      shopId,
      productConfig.blueprint_id,
      productConfig.print_provider_id,
      countryCode
    );

    // Transform Printify response to our ShippingOption format
    const options: ShippingOption[] = shippingMethods.map((method: any, index: number) => ({
      id: method.id,
      name: method.name || `Shipping Option ${index + 1}`,
      cost: method.cost || 0,
      estimatedDays: getEstimatedDeliveryTime(method.name, countryCode),
      isDefault: index === 0 // First option as default
    }));

    return options;
  } catch (error) {
    console.error('Failed to fetch shipping methods, using fallback:', error);
    
    // Fallback shipping options if Printify API fails
    return getFallbackShippingOptions(countryCode);
  }
}

// Get estimated delivery time based on shipping method and country
function getEstimatedDeliveryTime(methodName: string, countryCode: string): string {
  const isInternational = !['US', 'CA'].includes(countryCode);
  const methodLower = methodName.toLowerCase();

  if (methodLower.includes('express') || methodLower.includes('priority')) {
    return isInternational ? '3-5 business days' : '2-3 business days';
  } else if (methodLower.includes('standard') || methodLower.includes('regular')) {
    return isInternational ? '7-14 business days' : '5-7 business days';
  } else {
    // Default estimate
    return isInternational ? '7-14 business days' : '5-7 business days';
  }
}

// Fallback shipping options when Printify API is unavailable
function getFallbackShippingOptions(countryCode: string): ShippingOption[] {
  const isInternational = !['US', 'CA'].includes(countryCode);
  
  return [
    {
      id: 1,
      name: 'Standard Shipping',
      cost: 0, // Free shipping
      estimatedDays: isInternational ? '7-14 business days' : '5-7 business days',
      isDefault: true
    },
    {
      id: 2,
      name: 'Express Shipping',
      cost: isInternational ? 1500 : 1000, // $15 international, $10 domestic (in cents)
      estimatedDays: isInternational ? '3-5 business days' : '2-3 business days',
      isDefault: false
    }
  ];
}

// Get the appropriate shipping method (now supports method selection)
async function getShippingMethod(countryCode: string, selectedMethodId?: number): Promise<number> {
  if (selectedMethodId) {
    return selectedMethodId;
  }
  
  // Default to standard shipping (method ID 1)
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

      // Create admin review for high-res file (if enabled)
      try {
        const { createAdminReview } = await import('./admin-review');
        await createAdminReview({
          artwork_id: order.artwork_id,
          review_type: 'highres_file',
          image_url: finalImageUrl,
          customer_name: customerName,
          customer_email: session.customer_details?.email || '',
          pet_name: petName
        });
        console.log('✅ Admin review created for high-res file');
        
        if (order) {
          await addOrderStatusHistory(order.id, 'processing', 'High-res file submitted for admin review');
        }
      } catch (reviewError) {
        console.error('Failed to create high-res file review:', reviewError);
        // Don't fail the order if review creation fails
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

  // Get shipping method (use selected method or default)
  const shippingMethod = await getShippingMethod(shippingAddress.country, metadata.shippingMethodId);

  // Create Printify order
  const orderData: PrintifyOrderRequest = {
    external_id: session.id,
    label: `PawPop Order - ${customerName}${petName ? ` (${petName})` : ''}${frameUpgrade ? ' (Framed)' : ''}`,
    line_items: [
      {
        product_id: productId,
        variant_id: variantId,
        quantity: metadata.quantity || 1,
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
    frameUpgrade: metadata.frameUpgrade === 'true',
    shippingMethodId: metadata.shippingMethodId ? parseInt(metadata.shippingMethodId) : undefined,
    quantity: metadata.quantity ? parseInt(metadata.quantity) : undefined
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
