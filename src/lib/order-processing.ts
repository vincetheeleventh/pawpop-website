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
  addOrderStatusHistory,
  updateOrderStatus
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
  console.log('🚀 processOrder called for session:', session.id);
  console.log('📋 Product type:', metadata.productType);
  console.log('📋 Customer:', metadata.customerName);
  
  const { productType, imageUrl, size, customerName, petName, frameUpgrade } = metadata;

  // Update order status to paid in database
  // Try both possible shipping property names with fallback
  const shippingData = (session as any).shipping_details || (session as any).shipping || null;
  console.log('🚚 processOrder - Shipping data check:', {
    sessionId: session.id,
    hasShippingDetails: !!(session as any).shipping_details,
    hasShipping: !!(session as any).shipping,
    usingShippingData: !!shippingData,
    shippingDataKeys: shippingData ? Object.keys(shippingData) : null
  });
  
  await updateOrderAfterPayment(
    session.id,
    session.payment_intent as string,
    shippingData
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
      console.log('🔍 Checking if admin review should be created...');
      try {
        const { createAdminReview, isHumanReviewEnabled } = await import('./admin-review');
        
        const reviewEnabled = isHumanReviewEnabled();
        console.log(`📋 Manual review enabled: ${reviewEnabled}`);
        console.log(`📋 Admin email configured: ${process.env.ADMIN_EMAIL || 'NOT SET'}`);
        
        if (reviewEnabled) {
          console.log('🎯 Creating admin review for high-res file...');
          console.log(`📋 Artwork ID: ${order.artwork_id}`);
          console.log(`📋 Image URL: ${finalImageUrl}`);
          console.log(`📋 Customer: ${customerName}`);
          console.log(`📋 Email: ${session.customer_details?.email || 'NOT PROVIDED'}`);
          
          await createAdminReview({
            artwork_id: order.artwork_id,
            review_type: 'highres_file',
            image_url: finalImageUrl,
            customer_name: customerName,
            customer_email: session.customer_details?.email || '',
            pet_name: petName
          });
          console.log('✅ Admin review created for high-res file - STOPPING order processing until approval');
          
          if (order) {
            await addOrderStatusHistory(order.id, 'pending_review', 'High-res file submitted for admin review - awaiting approval before Printify order creation');
            
            // Update the order status to pending_review
            await updateOrderStatus(order.stripe_session_id, 'pending_review');
          }
          
          // CRITICAL: Stop processing here when manual review is enabled
          // Printify order will be created when admin approves the high-res file
          console.log('🛑 Order processing paused - waiting for high-res file approval');
          return;
        } else {
          console.log('ℹ️  Manual review disabled - continuing with automatic Printify order creation');
        }
      } catch (reviewError) {
        console.error('❌ Failed to create high-res file review:', reviewError);
        console.error('Review error details:', reviewError instanceof Error ? reviewError.stack : String(reviewError));
        // Don't fail the order if review creation fails - continue with Printify order
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

// Create Printify order after high-res file approval
export async function createPrintifyOrderAfterApproval(
  stripeSessionId: string,
  approvedImageUrl: string
): Promise<void> {
  console.log(`🎯 Creating Printify order after high-res approval for session: ${stripeSessionId}`);
  console.log(`📸 Using approved image URL: ${approvedImageUrl}`);
  
  try {
    // Get the order details from database
    console.log(`📋 Fetching order for session: ${stripeSessionId}`);
    const order = await getOrderByStripeSession(stripeSessionId);
    if (!order) {
      throw new Error(`Order not found for Stripe session: ${stripeSessionId}`);
    }
    console.log(`✅ Found order: ${order.id} - ${order.product_type} (${order.product_size})`);

    // For test sessions, create mock metadata from order data
    let metadata;
    if (stripeSessionId.startsWith('cs_test_') || stripeSessionId.startsWith('cs_printify_test_')) {
      console.log('🧪 Using test session - creating mock metadata from order data');
      
      // Map database product type to ProductType enum
      let mappedProductType: ProductType;
      switch (order.product_type) {
        case 'digital':
          mappedProductType = ProductType.DIGITAL;
          break;
        case 'art_print':
          mappedProductType = ProductType.ART_PRINT;
          break;
        case 'framed_canvas':
          mappedProductType = ProductType.CANVAS_FRAMED;
          break;
        default:
          mappedProductType = ProductType.CANVAS_FRAMED; // Default fallback
      }
      
      metadata = {
        productType: mappedProductType,
        imageUrl: approvedImageUrl,
        size: order.product_size,
        customerName: order.customer_name,
        petName: undefined, // Not stored in order
        frameUpgrade: false, // Default for test
        shippingMethodId: 1, // Default shipping method
        quantity: 1 // Default quantity
      };
    } else {
      // Get the original Stripe session to extract metadata
      const stripe = new (await import('stripe')).default(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2025-07-30.basil',
      });
      
      const session = await stripe.checkout.sessions.retrieve(stripeSessionId);

      // Parse the original order metadata from Stripe session
      metadata = parseOrderMetadata(session);
      if (!metadata) {
        throw new Error(`Order metadata not found for session: ${stripeSessionId}`);
      }
    }

    const { productType, size, customerName, petName, frameUpgrade, shippingMethodId, quantity } = metadata;

    // Extract shipping information from the order record (already stored from original checkout)
    const shippingAddress = order.shipping_address;
    if (!shippingAddress) {
      throw new Error('Missing shipping address for physical product');
    }

    console.log('📦 Using stored shipping address:', shippingAddress);

    // Handle frame upgrade for canvas stretched products
    let finalProductType = productType;
    if (productType === ProductType.CANVAS_STRETCHED && frameUpgrade) {
      console.log(`🖼️ Frame upgrade requested for canvas stretched product`);
      finalProductType = ProductType.CANVAS_FRAMED;
      
      await addOrderStatusHistory(order.id, 'processing', 'Frame upgrade applied - using framed canvas product');
    }

    // Validate order data
    console.log(`🔍 Validating order data: ${productType}, ${size}, ${shippingAddress.country}`);
    const validation = validateOrderData(productType, size, shippingAddress.country, approvedImageUrl);
    if (!validation.isValid) {
      throw new Error(`Order validation failed: ${validation.error}`);
    }
    console.log(`✅ Order validation passed`);

    // Create or get Printify product with proper configuration
    console.log(`🏭 Creating Printify product: ${finalProductType}, ${size}`);
    const { productId, variantId } = await getOrCreatePrintifyProduct(
      finalProductType,
      size,
      approvedImageUrl,
      shippingAddress.country,
      customerName,
      petName
    );
    console.log(`✅ Printify product created: ${productId}, variant: ${variantId}`);
    // Get shipping method (use selected method or default)
    const shippingMethod = await getShippingMethod(shippingAddress.country, shippingMethodId);

    // Create Printify order
    console.log(`📦 Creating Printify order with product: ${productId}, variant: ${variantId}`);
    const orderData: PrintifyOrderRequest = {
      external_id: stripeSessionId,
      label: `PawPop Order - ${customerName}${petName ? ` (${petName})` : ''}${frameUpgrade ? ' (Framed)' : ''}`,
      line_items: [
        {
          product_id: productId,
          variant_id: variantId,
          quantity: quantity || 1,
          print_areas: {
            front: approvedImageUrl
          }
        }
      ],
      shipping_method: shippingMethod,
      send_shipping_notification: true,
      address_to: {
        first_name: shippingAddress.first_name,
        last_name: shippingAddress.last_name,
        email: shippingAddress.email,
        phone: shippingAddress.phone,
        country: shippingAddress.country,
        region: shippingAddress.region,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2,
        city: shippingAddress.city,
        zip: shippingAddress.zip
      }
    };
    console.log(`📋 Order data prepared:`, JSON.stringify(orderData, null, 2));
    
    // Create the actual Printify order
    const shopId = process.env.PRINTIFY_SHOP_ID;
    if (!shopId) {
      throw new Error('PRINTIFY_SHOP_ID environment variable is not set');
    }
    
    console.log(`🚀 Calling Printify API to create order...`);
    const printifyOrder = await createPrintifyOrder(shopId, orderData);
    console.log(`✅ Printify order created successfully:`, printifyOrder);
    
    // Update order with Printify details
    await updateOrderWithPrintify(stripeSessionId, printifyOrder.id, printifyOrder.status);
    
    
  } catch (error) {
    console.error('❌ Failed to create Printify order after approval:', error);
    
    // Log the failure for retry later
    const order = await getOrderByStripeSession(stripeSessionId);
    if (order) {
      await addOrderStatusHistory(order.id, 'failed', `Printify order creation failed after approval: ${error}`);
    }
    
    throw error;
  }
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
