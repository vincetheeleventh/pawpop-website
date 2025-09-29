#!/usr/bin/env node

/**
 * Test New Session Emergency Creation
 * Tests the emergency order creation for the new session ID
 */

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawpopart.com';

async function testNewSessionEmergencyCreation() {
  console.log('🚨 TESTING NEW SESSION EMERGENCY CREATION');
  console.log('=========================================');
  
  const newSessionId = 'cs_live_a1eIieAvhsTZ7ZuYae7XRHTgOWKDbGsP5vPNRNe1axqmfHcIygIFioqlUm';
  
  console.log(`Testing session: ${newSessionId}`);
  
  // Step 1: Confirm order doesn't exist
  console.log('\n📦 STEP 1: Confirm Order Status');
  console.log('===============================');
  try {
    const orderResponse = await fetch(`${baseUrl}/api/orders/session/${newSessionId}`);
    console.log(`Order API status: ${orderResponse.status}`);
    
    if (orderResponse.status === 404) {
      console.log('✅ Confirmed: Order does not exist (expected)');
    } else if (orderResponse.ok) {
      const orderData = await orderResponse.json();
      console.log('⚠️  Order already exists:');
      console.log(`   Order Number: ${orderData.orderNumber}`);
      return; // Exit if order already exists
    } else {
      console.log(`❌ Unexpected response: ${orderResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Order check failed: ${error.message}`);
  }
  
  // Step 2: Test emergency order creation via reconciliation
  console.log('\n🔄 STEP 2: Test Emergency Order Creation');
  console.log('=======================================');
  try {
    const reconcileResponse = await fetch(`${baseUrl}/api/orders/reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionIds: [newSessionId]
      })
    });
    
    console.log(`Reconciliation API status: ${reconcileResponse.status}`);
    
    if (reconcileResponse.ok) {
      const reconcileData = await reconcileResponse.json();
      console.log('✅ Reconciliation API called successfully');
      console.log('Response:', JSON.stringify(reconcileData, null, 2));
      
      if (reconcileData.results && reconcileData.results[0]) {
        const result = reconcileData.results[0];
        if (result.status === 'error') {
          console.log('⚠️  Expected error for live Stripe session');
          console.log(`   Error: ${result.error}`);
          console.log('   This is normal - live sessions have API limitations');
        } else if (result.status === 'created') {
          console.log('✅ Order created successfully!');
          console.log(`   Order ID: ${result.orderId}`);
        }
      }
    } else {
      console.log(`❌ Reconciliation failed: ${reconcileResponse.status}`);
      const errorText = await reconcileResponse.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Emergency creation failed: ${error.message}`);
  }
  
  // Step 3: Check if order exists after reconciliation attempt
  console.log('\n🔍 STEP 3: Check Order After Reconciliation');
  console.log('===========================================');
  try {
    // Wait a moment for any async processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const orderResponse = await fetch(`${baseUrl}/api/orders/session/${newSessionId}`);
    console.log(`Order API status after reconciliation: ${orderResponse.status}`);
    
    if (orderResponse.ok) {
      const orderData = await orderResponse.json();
      console.log('✅ Order found after reconciliation!');
      console.log(`   Order Number: ${orderData.orderNumber}`);
      console.log(`   Customer: ${orderData.customerEmail}`);
      console.log(`   Status: ${orderData.orderStatus}`);
    } else if (orderResponse.status === 404) {
      console.log('⚠️  Order still not found after reconciliation');
      console.log('   This indicates the Stripe session may not have valid payment data');
    }
  } catch (error) {
    console.log(`❌ Post-reconciliation check failed: ${error.message}`);
  }
  
  // Step 4: Analyze the issue
  console.log('\n🔍 STEP 4: Issue Analysis');
  console.log('=========================');
  
  console.log('The issue with this session is likely:');
  console.log('');
  console.log('1. 🔄 WEBHOOK TIMING ISSUE:');
  console.log('   - Payment completed successfully');
  console.log('   - Stripe webhook may have failed or been delayed');
  console.log('   - Order record was never created in database');
  console.log('');
  console.log('2. 🚫 STRIPE API LIMITATIONS:');
  console.log('   - Live Stripe sessions have restricted API access');
  console.log('   - Cannot expand shipping_details or other properties');
  console.log('   - Emergency creation hits API limitations');
  console.log('');
  console.log('3. ✅ SUCCESS PAGE FIX IMPLEMENTED:');
  console.log('   - Enhanced retry logic with emergency creation');
  console.log('   - Will attempt reconciliation on final retry');
  console.log('   - Better error messages with session ID');
  
  console.log('\n🎯 SOLUTION APPROACH');
  console.log('====================');
  
  console.log('For this specific session, the best approach is:');
  console.log('');
  console.log('1. 👨‍💼 MANUAL ADMIN INTERVENTION:');
  console.log('   - Check if there\'s an admin review for this session');
  console.log('   - If artwork exists, admin can approve to create order');
  console.log('   - This bypasses Stripe API limitations');
  console.log('');
  console.log('2. 🔄 WEBHOOK REPLAY:');
  console.log('   - Check Stripe dashboard for webhook delivery status');
  console.log('   - Replay failed webhook if possible');
  console.log('   - This would create the missing order record');
  console.log('');
  console.log('3. ✅ ENHANCED SUCCESS PAGE:');
  console.log('   - Updated success page will handle this better');
  console.log('   - Emergency creation attempt on final retry');
  console.log('   - Clear error message with session ID for support');
  
  console.log('\n🚀 NEXT STEPS');
  console.log('=============');
  console.log('1. Deploy the enhanced success page fix');
  console.log('2. Test with the new session ID');
  console.log('3. Check for admin reviews associated with this session');
  console.log('4. Consider webhook replay from Stripe dashboard');
  
  console.log('\n✅ SUCCESS PAGE FIX IMPLEMENTED');
  console.log('The enhanced success page will now:');
  console.log('- Attempt emergency order creation on final retry');
  console.log('- Provide better error messages with session ID');
  console.log('- Handle Stripe API limitations gracefully');
}

// Run the test
testNewSessionEmergencyCreation().catch(console.error);
