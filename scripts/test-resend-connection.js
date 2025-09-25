#!/usr/bin/env node

/**
 * Test script to verify Resend email connection and domain setup
 */

const { Resend } = require('resend')
require('dotenv').config({ path: '.env.local' })

async function testResendConnection() {
  console.log('🧪 Testing Resend Email Connection...\n')
  
  // Check environment variables
  console.log('📋 Environment Check:')
  console.log(`RESEND_API_KEY: ${process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log(`NODE_ENV: ${process.env.NODE_ENV || 'development'}`)
  console.log(`EMAIL_TEST_MODE: ${process.env.EMAIL_TEST_MODE || 'not set'}\n`)
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not found in environment variables')
    process.exit(1)
  }
  
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  try {
    // Test 1: Send a simple test email
    console.log('📧 Test 1: Sending test email...')
    const result = await resend.emails.send({
      from: 'PawPop Test <hello@updates.pawpopart.com>',
      replyTo: 'hello@pawpopart.com',
      to: 'pawpopart@gmail.com',
      subject: '[TEST] Resend Connection Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF70A6;">🧪 Resend Connection Test</h2>
          <p>This is a test email to verify your Resend integration is working.</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Test Details:</strong><br>
            Sender: hello@updates.pawpopart.com<br>
            Reply-To: hello@pawpopart.com<br>
            Timestamp: ${new Date().toISOString()}<br>
            Domain: updates.pawpopart.com
          </div>
          <p>If you received this email, your Resend connection is working! 🎉</p>
        </div>
      `
    })
    
    if (result.error) {
      console.error('❌ Email send failed:', result.error)
      
      // Provide specific guidance based on error type
      if (result.error.message?.includes('domain')) {
        console.log('\n💡 Domain Issue Detected:')
        console.log('1. Verify updates.pawpopart.com is added to your Resend dashboard')
        console.log('2. Check that DNS records are properly configured')
        console.log('3. Ensure domain verification is complete')
      }
      
      if (result.error.message?.includes('authentication')) {
        console.log('\n💡 Authentication Issue Detected:')
        console.log('1. Check your RESEND_API_KEY is correct')
        console.log('2. Verify API key has send permissions')
        console.log('3. Check if API key is for the correct Resend account')
      }
      
    } else {
      console.log('✅ Email sent successfully!')
      console.log(`Message ID: ${result.data?.id}`)
    }
    
    // Test 2: Check domain status (if available)
    console.log('\n📋 Test 2: Domain verification status...')
    console.log('💡 Check your Resend dashboard at https://resend.com/domains')
    console.log('   - Verify updates.pawpopart.com is listed and verified')
    console.log('   - Check DNS record status')
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    
    if (error.message?.includes('401')) {
      console.log('\n💡 API Key Issue:')
      console.log('1. Check your RESEND_API_KEY in .env.local')
      console.log('2. Verify the API key is active in your Resend dashboard')
    }
  }
  
  console.log('\n🔍 Next Steps:')
  console.log('1. Update DMARC policy: p=reject → p=quarantine')
  console.log('2. Add Resend DNS records from dashboard')
  console.log('3. Wait for DNS propagation (up to 24 hours)')
  console.log('4. Re-run this test')
}

// Run the test
testResendConnection().catch(console.error)
