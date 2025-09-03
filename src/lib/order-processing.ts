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

export interface OrderMetadata {
  productType: ProductType;
  imageUrl: string;
  size: string;
  customerName: string;
  petName?: string;
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

// Process a completed Stripe checkout session
export async function processOrder({ session, metadata }: ProcessOrderParams): Promise<void> {
  const { productType, imageUrl, size, customerName, petName } = metadata;

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
    // TODO: Send digital download email
    return;
  }

  // Extract shipping information
  const shippingAddress = extractShippingAddress(session);
  if (!shippingAddress) {
    throw new Error('Missing shipping address for physical product');
  }

  // Validate order data
  const validation = validateOrderData(productType, size, shippingAddress.country, imageUrl);
  if (!validation.isValid) {
    throw new Error(`Order validation failed: ${validation.error}`);
  }

  // Create or get Printify product
  const { productId, variantId } = await getOrCreatePrintifyProduct(
    productType,
    size,
    imageUrl,
    shippingAddress.country,
    customerName,
    petName
  );

  // Get shipping method
  const shippingMethod = await getShippingMethod(shippingAddress.country);

  // Create Printify order
  const orderData: PrintifyOrderRequest = {
    external_id: session.id,
    label: `PawPop Order - ${customerName}${petName ? ` (${petName})` : ''}`,
    line_items: [
      {
        product_id: productId,
        variant_id: variantId,
        quantity: 1,
        print_areas: {
          front: imageUrl
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
    petName: metadata.petName || undefined
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
