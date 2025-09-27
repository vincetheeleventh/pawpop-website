import { NextRequest, NextResponse } from 'next/server';
import { createPrintifyOrder } from '@/lib/printify';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing COMPLETE Printify workflow with mirror sides product');
    
    const shopId = process.env.PRINTIFY_SHOP_ID;
    if (!shopId) {
      throw new Error('PRINTIFY_SHOP_ID not configured');
    }

    // Use our newly created product with mirror sides
    const productId = '68d785df810d45ac0e024460'; // Product with mirror sides
    const variantId = 111837; // 16x24 variant

    const testOrderData = {
      external_id: `complete_workflow_${Date.now()}`,
      label: 'Complete Workflow Test - Canvas with Mirror Sides',
      line_items: [
        {
          product_id: productId,
          variant_id: variantId,
          quantity: 1,
          print_areas: {
            front: 'http://localhost:3000/images/e2e%20testing/test_high_res.png'
          }
        }
      ],
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: {
        first_name: 'Complete',
        last_name: 'Workflow',
        email: 'test@pawpopart.com',
        phone: '1234567890',
        country: 'US',
        region: 'CA',
        address1: '123 Complete Workflow Street',
        city: 'San Francisco',
        zip: '94105'
      }
    };

    console.log('📦 Creating Printify order with mirror sides product...');
    console.log(`   Product ID: ${productId} (with mirror sides enabled)`);
    console.log(`   Variant ID: ${variantId} (16x24 framed canvas)`);
    console.log(`   Print on sides: enabled`);
    console.log(`   Mirror sides: enabled`);

    const result = await createPrintifyOrder(shopId, testOrderData);
    
    console.log('✅ Complete workflow test successful with mirror sides:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Complete Printify workflow successful with mirror sides',
      orderId: result.id,
      productId: productId,
      variantId: variantId,
      features: {
        printOnSides: true,
        mirrorSides: true,
        canvasFramed: true
      },
      result: result
    });

  } catch (error) {
    console.error('❌ Complete workflow test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
