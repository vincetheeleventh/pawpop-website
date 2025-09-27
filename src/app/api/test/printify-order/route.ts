import { NextRequest, NextResponse } from 'next/server';
import { createPrintifyOrder } from '@/lib/printify';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Printify order creation directly');
    
    const shopId = process.env.PRINTIFY_SHOP_ID;
    if (!shopId) {
      throw new Error('PRINTIFY_SHOP_ID not configured');
    }

    // Use the successful product from our direct API test
    const testOrderData = {
      external_id: `test_direct_${Date.now()}`,
      label: 'Direct API Test Order - Framed Canvas 16x24',
      line_items: [
        {
          product_id: '68d78230c7fa9d0b180352b3', // From our successful test
          variant_id: 111837, // 16x24 variant
          quantity: 1,
          print_areas: {
            front: 'http://localhost:3000/images/e2e%20testing/test_high_res.png'
          }
        }
      ],
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: {
        first_name: 'Direct',
        last_name: 'Test',
        email: 'test@pawpopart.com',
        phone: '1234567890',
        country: 'US',
        region: 'CA',
        address1: '123 Direct Test Street',
        city: 'San Francisco',
        zip: '94105'
      }
    };

    console.log('📦 Creating Printify order with existing product...');
    const result = await createPrintifyOrder(shopId, testOrderData);
    
    console.log('✅ Direct Printify order test successful:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Printify order created successfully',
      orderId: result.id,
      result: result
    });

  } catch (error) {
    console.error('❌ Direct Printify order test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
