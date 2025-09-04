// src/app/api/test/printify-info/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    if (!process.env.PRINTIFY_API_TOKEN) {
      return NextResponse.json({ 
        error: 'PRINTIFY_API_TOKEN is not set in environment variables' 
      }, { status: 400 });
    }

    console.log('🏪 Fetching Printify account info...');

    // Fetch shops from Printify API
    const response = await fetch('https://api.printify.com/v1/shops.json', {
      headers: {
        'Authorization': `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Printify API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const shopsData = await response.json();
    console.log('✅ Printify shops fetched:', shopsData);

    // Extract shop information
    const shops = shopsData.data || shopsData || [];
    
    if (shops.length === 0) {
      return NextResponse.json({
        error: 'No shops found in your Printify account',
        message: 'You may need to create a shop in your Printify dashboard first',
        shops: [],
        instructions: [
          '1. Go to https://printify.com/app/stores',
          '2. Connect a sales channel (like Etsy, Shopify, or Manual Orders)',
          '3. Come back and try again'
        ]
      });
    }

    // Get the first (usually default) shop
    const defaultShop = shops[0];

    return NextResponse.json({
      success: true,
      message: 'Printify account info retrieved successfully',
      defaultShop: {
        id: defaultShop.id,
        title: defaultShop.title,
        sales_channel: defaultShop.sales_channel
      },
      allShops: shops.map((shop: any) => ({
        id: shop.id,
        title: shop.title,
        sales_channel: shop.sales_channel
      })),
      envVariableToAdd: `PRINTIFY_SHOP_ID=${defaultShop.id}`,
      nextSteps: [
        `Add PRINTIFY_SHOP_ID=${defaultShop.id} to your .env.local file`,
        'Restart your development server',
        'Test the Printify mockup generator'
      ]
    });

  } catch (error) {
    console.error('Printify info fetch error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch Printify info',
      details: 'Check server logs for more information',
      troubleshooting: [
        'Verify your PRINTIFY_API_TOKEN is correct',
        'Check if you have shops connected in your Printify dashboard',
        'Ensure your API token has the correct permissions'
      ]
    }, { status: 500 });
  }
}
