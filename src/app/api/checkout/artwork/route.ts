// src/app/api/checkout/artwork/route.ts
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { ProductType, getProductPricing } from '@/lib/printify-products';
import { createOrder } from '@/lib/supabase-orders';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  let requestData: any = {};
  
  try {
    const body = await req.json();
    const { 
      artworkId, 
      productType, 
      size, 
      customerEmail, 
      customerName, 
      petName, 
      imageUrl,
      frameUpgrade = false,
      quantity = 1,
      shippingMethodId,
      testMode = false,
      couponCode,
      originalAmount,
      discountAmount = 0,
      finalAmount
    } = body;

    // Store request data for error logging
    requestData = { artworkId, productType, size, customerEmail, customerName };

    // Test mode - return mock response without hitting Stripe/Printify
    if (testMode || !stripe) {
      console.log('🧪 TEST MODE: Checkout API called with:', {
        artworkId,
        productType,
        size,
        customerEmail,
        customerName,
        petName
      });

      // Simulate successful response
      return NextResponse.json({ 
        sessionId: `test_session_${Date.now()}`,
        testMode: true,
        message: 'Test mode - no actual payment processed',
        productDetails: {
          type: productType,
          size,
          estimatedPrice: getProductPricing(productType as ProductType, size, 'US', frameUpgrade),
          frameUpgrade
        }
      });
    }

    // Validate required fields
    if (!artworkId || !productType || !size || !customerEmail || !customerName || !imageUrl) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    console.log('🔍 Checkout API Debug:', {
      productType,
      size,
      frameUpgrade,
      quantity,
      shippingMethodId
    });

    // Get base pricing (including frame upgrade if applicable)
    const basePriceInCents = getProductPricing(productType as ProductType, size, 'US', frameUpgrade);
    console.log('💰 Base price:', basePriceInCents);
    
    // Handle coupon validation and pricing
    let finalPriceInCents = basePriceInCents * quantity;
    let appliedCouponId: string | null = null;
    
    if (couponCode && finalAmount !== undefined) {
      // Validate coupon one more time server-side
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data: couponValidation, error: couponError } = await supabase.rpc('validate_coupon_code', {
        p_code: couponCode.toUpperCase().trim(),
        p_order_amount: originalAmount || (basePriceInCents * quantity / 100),
        p_product_type: productType
      });
      
      if (couponError) {
        console.error('❌ Coupon validation error:', couponError);
        return new NextResponse('Invalid coupon code', { status: 400 });
      }
      
      if (!couponValidation || couponValidation.length === 0 || !couponValidation[0].is_valid) {
        console.error('❌ Invalid coupon:', couponCode);
        return new NextResponse('Invalid or expired coupon code', { status: 400 });
      }
      
      // Use validated pricing from database
      const validatedCoupon = couponValidation[0];
      finalPriceInCents = Math.round(validatedCoupon.final_amount * 100);
      appliedCouponId = validatedCoupon.coupon_id;
      
      console.log('✅ Coupon applied:', {
        code: couponCode,
        originalAmount: originalAmount,
        discountAmount: validatedCoupon.discount_amount,
        finalAmount: validatedCoupon.final_amount,
        finalPriceInCents
      });
    }
    
    console.log('💰 Final price (with coupon):', finalPriceInCents);
    
    // Create order in database first
    console.log('📝 Creating order in database...');
    let order;
    try {
      order = await createOrder({
        artwork_id: artworkId,
        stripe_session_id: '', // Will be updated after session creation
        product_type: productType as ProductType,
        product_size: size,
        price_cents: finalPriceInCents,
        customer_email: customerEmail,
        customer_name: customerName
      });
      console.log('✅ Order created:', order.id);
    } catch (dbError) {
      console.error('❌ Database error creating order:', dbError);
      // For now, create a mock order to allow checkout to proceed
      order = {
        id: `mock_order_${Date.now()}`,
        artwork_id: artworkId,
        stripe_session_id: '',
        product_type: productType as ProductType,
        product_size: size,
        price_cents: finalPriceInCents,
        customer_email: customerEmail,
        customer_name: customerName,
        order_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('⚠️ Using mock order due to DB error:', order.id);
    }

    // Check Stripe configuration
    if (!stripe) {
      throw new Error('Stripe is not configured - missing STRIPE_SECRET_KEY');
    }

    // Create Stripe checkout session
    console.log('💳 Creating Stripe checkout session...');
    let session;
    try {
      session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'cad',
          product_data: {
            name: `PawPop ${productType === 'digital' ? 'Digital Download' : 
                   productType === 'art_print' ? 'Art Print' :
                   productType === 'canvas_stretched' ? `Canvas (Stretched)${frameUpgrade ? ' + Frame' : ''}` :
                   'Canvas (Framed)'} - ${size}`,
            description: `Custom artwork featuring ${customerName}${petName ? ` & ${petName}` : ''} in the style of the Mona Lisa${frameUpgrade ? ' with professional framing' : ''}`,
            images: [imageUrl]
          },
          unit_amount: Math.round(finalPriceInCents / quantity)
        },
        quantity: quantity
      }],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/artwork/${artworkId}?cancelled=true`,
      customer_email: customerEmail,
      metadata: {
        artworkId,
        productType,
        size,
        customerName,
        petName: petName || '',
        imageUrl,
        frameUpgrade: frameUpgrade.toString(),
        quantity: quantity.toString(),
        shippingMethodId: shippingMethodId?.toString() || '1',
        orderId: order.id,
        couponCode: couponCode || '',
        couponId: appliedCouponId || '',
        originalAmount: originalAmount?.toString() || '',
        discountAmount: discountAmount?.toString() || '0',
        finalAmount: finalAmount?.toString() || ''
      },
      // Collect shipping address for physical products
      shipping_address_collection: productType !== 'digital' ? {
        allowed_countries: ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'SE', 'DK', 'NO', 'PL', 'CZ', 'HU', 'SK', 'SI', 'HR', 'BG', 'RO', 'LT', 'LV', 'EE', 'MT', 'CY', 'LU', 'GR']
      } : undefined
      });
      console.log('✅ Stripe session created:', session.id);

      // Update order with session ID
      await stripe.checkout.sessions.update(session.id, {
        metadata: {
          ...session.metadata,
          stripe_session_id: session.id
        }
      });

    } catch (stripeError) {
      console.error('❌ Stripe error:', stripeError);
      throw new Error(`Stripe session creation failed: ${stripeError instanceof Error ? stripeError.message : 'Unknown Stripe error'}`);
    }

    return NextResponse.json({ sessionId: session.id });

  } catch (error) {
    console.error('Checkout error details:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      requestBody: requestData
    });
    
    // Return more specific error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new NextResponse(`Checkout failed: ${errorMessage}`, { status: 500 });
  }
}
