#!/usr/bin/env node

/**
 * Test Printify API directly to see what's failing
 */

require('dotenv').config({ path: '.env.local' });

const PRINTIFY_API_URL = 'https://api.printify.com/v1';

async function testPrintifyDirectly() {
  console.log('🔍 TESTING PRINTIFY API DIRECTLY\n');

  if (!process.env.PRINTIFY_API_TOKEN || !process.env.PRINTIFY_SHOP_ID) {
    console.error('❌ Missing Printify environment variables');
    console.log('Required: PRINTIFY_API_TOKEN, PRINTIFY_SHOP_ID');
    process.exit(1);
  }

  const shopId = process.env.PRINTIFY_SHOP_ID;
  const testImageUrl = 'http://localhost:3000/images/e2e%20testing/test_high_res.png';

  try {
    // Step 1: Test image upload
    console.log('1️⃣ TESTING IMAGE UPLOAD TO PRINTIFY');
    console.log('=' .repeat(60));
    console.log(`📸 Image URL: ${testImageUrl}`);

    // Fetch the image first
    console.log('📥 Fetching image...');
    const imageResponse = await fetch(testImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    console.log(`✅ Image fetched: ${Math.round(imageBuffer.byteLength / 1024)}KB`);

    // Upload to Printify
    console.log('📤 Uploading to Printify...');
    const uploadResponse = await fetch(`${PRINTIFY_API_URL}/uploads/images.json`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        file_name: 'test_high_res.png',
        contents: base64Image
      })
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`❌ Image upload failed: ${uploadResponse.status} - ${errorText}`);
      return false;
    }

    const uploadResult = await uploadResponse.json();
    console.log(`✅ Image uploaded successfully: ${uploadResult.id}`);

    // Step 2: Test product creation
    console.log('\n2️⃣ TESTING PRODUCT CREATION');
    console.log('=' .repeat(60));

    const productData = {
      title: 'PawPop Test Product - Framed Canvas',
      description: 'Test product for Printify integration',
      blueprint_id: 944, // Matte Canvas, Framed Multi-color
      print_provider_id: 105, // Jondo
      variants: [
        {
          id: 111837, // 16x24 variant
          price: 11900, // $119.00 CAD
          is_enabled: true
        }
      ],
      print_areas: [
        {
          variant_ids: [111837],
          placeholders: [
            {
              position: "front",
              images: [
                {
                  id: uploadResult.id,
                  x: 0.5,
                  y: 0.5,
                  scale: 1,
                  angle: 0
                }
              ]
            }
          ]
        }
      ]
    };

    console.log('🏭 Creating Printify product...');
    console.log(`   Blueprint: 944 (Matte Canvas, Framed Multi-color)`);
    console.log(`   Provider: 105 (Jondo)`);
    console.log(`   Variant: 111837 (16x24)`);

    const productResponse = await fetch(`${PRINTIFY_API_URL}/shops/${shopId}/products.json`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(productData)
    });

    if (!productResponse.ok) {
      const errorText = await productResponse.text();
      console.error(`❌ Product creation failed: ${productResponse.status}`);
      console.error(`Error details: ${errorText}`);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Parsed error:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error('Raw error text:', errorText);
      }
      return false;
    }

    const productResult = await productResponse.json();
    console.log(`✅ Product created successfully: ${productResult.id}`);

    // Step 3: Test order creation
    console.log('\n3️⃣ TESTING ORDER CREATION');
    console.log('=' .repeat(60));

    const orderData = {
      external_id: `test_order_${Date.now()}`,
      label: 'PawPop Test Order - Framed Canvas 16x24',
      line_items: [
        {
          product_id: productResult.id,
          variant_id: 111837,
          quantity: 1
        }
      ],
      shipping_method: 1,
      send_shipping_notification: true,
      address_to: {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@pawpopart.com',
        phone: '1234567890',
        country: 'US',
        region: 'CA',
        address1: '123 Test Street',
        city: 'San Francisco',
        zip: '94105'
      }
    };

    console.log('📦 Creating Printify order...');
    console.log(`   Product ID: ${productResult.id}`);
    console.log(`   Variant ID: 111837`);
    console.log(`   Quantity: 1`);

    const orderResponse = await fetch(`${PRINTIFY_API_URL}/shops/${shopId}/orders.json`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(orderData)
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error(`❌ Order creation failed: ${orderResponse.status}`);
      console.error(`Error details: ${errorText}`);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Parsed error:', JSON.stringify(errorJson, null, 2));
      } catch (e) {
        console.error('Raw error text:', errorText);
      }
      return false;
    }

    const orderResult = await orderResponse.json();
    console.log(`✅ Order created successfully: ${orderResult.id}`);

    console.log('\n🎉 PRINTIFY INTEGRATION TEST SUCCESSFUL!');
    console.log('=' .repeat(60));
    console.log(`✅ Image uploaded: ${uploadResult.id}`);
    console.log(`✅ Product created: ${productResult.id}`);
    console.log(`✅ Order created: ${orderResult.id}`);
    console.log('\n📋 CHECK YOUR PRINTIFY DASHBOARD:');
    console.log('   1. Go to https://printify.com/app/orders');
    console.log(`   2. Look for order: ${orderResult.id}`);
    console.log(`   3. External ID: ${orderData.external_id}`);

    return true;

  } catch (error) {
    console.error('💥 Test failed:', error);
    return false;
  }
}

// Run the test
testPrintifyDirectly()
  .then((success) => {
    console.log(`\n✨ Direct Printify test: ${success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Test crashed:', error);
    process.exit(1);
  });
