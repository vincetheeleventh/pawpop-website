import { NextRequest, NextResponse } from 'next/server';
import { createPrintifyProduct, ProductType } from '@/lib/printify';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing Printify product creation with print on sides and mirror sides');
    
    const shopId = process.env.PRINTIFY_SHOP_ID;
    if (!shopId) {
      throw new Error('PRINTIFY_SHOP_ID not configured');
    }

    const testImageUrl = 'http://localhost:3000/images/e2e%20testing/test_high_res.png';
    const blueprintId = 944; // Matte Canvas, Framed Multi-color
    const printProviderId = 105; // Jondo
    const title = 'Test Canvas with Mirror Sides';
    const description = 'Testing canvas product creation with print on sides and mirror sides enabled';
    const productType = ProductType.CANVAS_FRAMED;
    const size = '16x24';

    console.log('🏭 Creating Printify product with mirror sides configuration...');
    console.log(`   Blueprint: ${blueprintId} (Matte Canvas, Framed Multi-color)`);
    console.log(`   Provider: ${printProviderId} (Jondo)`);
    console.log(`   Size: ${size}`);
    console.log(`   Print on sides: enabled`);
    console.log(`   Mirror sides: enabled`);

    const result = await createPrintifyProduct(
      blueprintId,
      printProviderId,
      title,
      description,
      testImageUrl,
      productType,
      size,
      shopId
    );
    
    console.log('✅ Printify product created successfully with mirror sides:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Printify product created successfully with mirror sides',
      productId: result.id,
      result: result
    });

  } catch (error) {
    console.error('❌ Printify product creation test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error
    }, { status: 500 });
  }
}
