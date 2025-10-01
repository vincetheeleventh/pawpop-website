// src/lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Email testing configuration
// Only use test mode if explicitly enabled via EMAIL_TEST_MODE
const isTestMode = process.env.EMAIL_TEST_MODE === 'true'
const testEmailRecipient = process.env.EMAIL_TEST_RECIPIENT || 'pawpopart@gmail.com'

export interface EmailData {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export interface MasterpieceCreatingEmailData {
  customerName?: string
  customerEmail: string
  petName?: string
  artworkUrl: string
}

export interface MasterpieceReadyEmailData {
  customerName?: string
  customerEmail: string
  petName?: string
  artworkUrl: string
  imageUrl: string
}

export interface OrderConfirmationEmailData {
  customerName?: string
  customerEmail: string
  orderNumber: string
  productType: string
  productSize: string
  price: number
  amount: number // Price in cents
  currency: string
  petName?: string
  shippingAddress?: any
}

export interface ShippingNotificationEmailData {
  customerName?: string
  customerEmail: string
  orderNumber: string
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
  productType: string
}

export interface AdminReviewNotificationData {
  reviewId: string
  reviewType: 'artwork_proof' | 'highres_file' | 'edit_request'
  customerName?: string
  petName?: string
  imageUrl: string
  falGenerationUrl?: string
  customerEmail: string
  editRequestText?: string // For edit_request type
}

/**
 * Send email using Resend with domain reputation protection
 */
export async function sendEmail(data: EmailData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log(`📧 Attempting to send email to: ${data.to}`)
    console.log(`📧 Test mode: ${isTestMode}`)
    console.log(`📧 EMAIL_TEST_MODE env var: ${process.env.EMAIL_TEST_MODE}`)
    
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY not configured')
      return { success: false, error: 'Email service not configured' }
    }

    // In test mode, redirect all emails to test recipient and add prefix to subject
    const emailData = isTestMode ? {
      from: data.from || 'PawPop <hello@updates.pawpopart.com>',
      replyTo: data.replyTo || 'hello@pawpopart.com',
      to: testEmailRecipient,
      subject: `[TEST] ${data.subject} (Original: ${data.to})`,
      html: `
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin-bottom: 20px; border-radius: 5px;">
          <strong>🧪 TEST MODE EMAIL</strong><br>
          <strong>Original Recipient:</strong> ${data.to}<br>
          <strong>Test Environment:</strong> ${process.env.NODE_ENV || 'development'}<br>
          <strong>Timestamp:</strong> ${new Date().toISOString()}
        </div>
        ${data.html}
      `,
    } : {
      from: data.from || 'PawPop <hello@updates.pawpopart.com>',
      replyTo: data.replyTo || 'hello@pawpopart.com',
      to: data.to,
      subject: data.subject,
      html: data.html,
    }

    const result = await resend.emails.send(emailData)

    if (result.error) {
      console.error('Resend error:', result.error)
      return { success: false, error: result.error.message }
    }

    const logMessage = isTestMode 
      ? `Test email sent successfully to ${testEmailRecipient} (original: ${data.to}): ${result.data?.id}`
      : `Email sent successfully: ${result.data?.id}`
    
    console.log(logMessage)
    return { success: true, messageId: result.data?.id }

  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Send "masterpiece being created" email after photo upload
 */
export async function sendMasterpieceCreatingEmail(data: MasterpieceCreatingEmailData): Promise<{ success: boolean; error?: string }> {
  const petNameText = data.petName ? ` for ${data.petName}` : ''
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your masterpiece is being created</title>
      <style>
        body { font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #2C2C2C; margin: 0; padding: 0; background-color: #F5EED7; }
        .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: #FF9770; color: #FFFFFF; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; font-family: 'Arvo', serif; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content h2 { color: #2C2C2C; margin-top: 0; font-family: 'Arvo', serif; font-weight: 700; }
        .cta-button { display: inline-block; background: #FF9770 !important; color: #FFFFFF !important; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 20px 0; border: none; font-family: 'Fredoka One', cursive; }
        .footer { background-color: #F5EED7; padding: 30px; text-align: center; color: #2C2C2C; font-size: 14px; }
        .divider { height: 1px; background: #FFD670; margin: 30px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎨 Your Masterpiece is Being Created</h1>
        </div>
        
        <div class="content">
          <h2>${data.customerName ? `Hi ${data.customerName}!` : 'Hello there! 👋'}</h2>
          
          <p>Thank you for choosing PawPop! We've received your beautiful photo${petNameText} and our artists are now working their magic to create your handcrafted, one-of-a-kind Mona Lisa masterpiece.</p>
          
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>🎨 We are transforming your photo into a stunning Mona Lisa-style masterpiece</li>
            <li>⏱️ This process will take 24-48 hours.</li>
            <li>📧 You'll receive another email as soon as your masterpiece is ready</li>
            <li>🖼️ You can then choose to purchase beautiful canvas prints or keep it digital</li>
          </ul>
          
          <div class="divider"></div>
          
          <p>You can check the status of your artwork anytime:</p>
          <a href="${data.artworkUrl}" class="cta-button" style="display: inline-block; background: #FF9770 !important; color: #FFFFFF !important; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 20px 0; border: none; font-family: 'Fredoka One', cursive;">View Your Artwork Status</a>
          
          <p>We're excited to show you the incredible transformation!</p>
          
          <p>Best regards,<br>The PawPop Team</p>
        </div>
        
        <div class="footer">
          <p>PawPop - The Unforgettable Gift for Pet Moms</p>
          <p>2006-1323 Homer St, Vancouver BC Canada V6B 5T1</p>
          <p>Questions? Reply to this email or contact us at hello@updates.pawpopart.com</p>
        </div>
      </div>
    </body>
    </html>
  `

  const result = await sendEmail({
    to: data.customerEmail,
    subject: 'Your masterpiece is being created! 🎨',
    html
  })

  return result
}

/**
 * Send "masterpiece ready" email when artwork generation is complete
 */
export async function sendMasterpieceReadyEmail(data: MasterpieceReadyEmailData): Promise<{ success: boolean; error?: string }> {
  const petNameText = data.petName ? ` ${data.petName}'s` : ' your'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your masterpiece is ready!</title>
      <style>
        body { font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #2C2C2C; margin: 0; padding: 0; background-color: #F5EED7; }
        .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: #FF70A6; color: #FFFFFF; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; font-family: 'Arvo', serif; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content h2 { color: #2C2C2C; margin-top: 0; font-family: 'Arvo', serif; font-weight: 700; }
        .artwork-preview { text-align: center; margin: 30px 0; }
        .artwork-preview img { max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.1); border: 4px solid #FFD670; }
        .cta-button { display: inline-block; background: #FF9770 !important; color: #FFFFFF !important; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 20px 10px; border: none; font-family: 'Fredoka One', cursive; }
        .secondary-button { display: inline-block; border: 2px solid #FF70A6; color: #FF70A6 !important; background: #FFFFFF !important; padding: 13px 28px; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 20px 10px; }
        .footer { background-color: #F5EED7; padding: 30px; text-align: center; color: #2C2C2C; font-size: 14px; }
        .divider { height: 1px; background: #FFD670; margin: 30px 0; }
        .buttons-container { text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Your Masterpiece is Ready!</h1>
        </div>
        
        <div class="content">
          <h2>${data.customerName ? `Hi ${data.customerName}!` : 'Amazing news! 🎉'}</h2>
          
          <p>${data.customerName ? 'We\'ve' : 'Your'} completed${petNameText} stunning Mona Lisa transformation${data.customerName ? '' : ' is ready'}. The result is absolutely beautiful!</p>
          
          <div class="artwork-preview">
            <img src="${data.imageUrl}" alt="Your PawPop Masterpiece" style="max-width: 200px; height: auto; border-radius: 8px;" />
          </div>
          
          <p><strong>Your unique masterpiece is ready to view!</strong></p>
          <p>We've created a special page just for you where you can see your artwork in full detail and decide how to make it real.</p>
          
          <div class="buttons-container">
            <a href="${data.artworkUrl}" class="cta-button" style="display: inline-block; background: #FF9770 !important; color: #FFFFFF !important; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 20px 10px; border: none; font-family: 'Fredoka One', cursive;">View Your Masterpiece</a>
          </div>
          
          <div class="divider"></div>
          
          <p><strong>Print Options Available:</strong></p>
          <ul>
            <li>🖼️ <strong>Fine Art Prints</strong> - Museum-quality fine art paper (285 g/m²), multiple sizes</li>
            <li>🎨 <strong>Framed Canvas</strong> - Ready to hang, gallery-wrapped</li>
            <li>📱 <strong>Digital Download</strong> - High-resolution file for personal use</li>
          </ul>
          
          <p>Your artwork link will remain active for 30 days, so you can share it with friends and family or come back to order prints anytime.</p>
          
          <p>We hope you love your unique PawPop masterpiece!</p>
          
          <p>Best regards,<br>The PawPop Team</p>
        </div>
        
        <div class="footer">
          <p>PawPop - The Unforgettable Gift for Pet Moms</p>
          <p>2006-1323 Homer St, Vancouver BC Canada V6B 5T1</p>
          <p>Questions? Reply to this email or contact us at hello@updates.pawpopart.com</p>
        </div>
      </div>
    </body>
    </html>
  `

  const result = await sendEmail({
    to: data.customerEmail,
    subject: 'Your masterpiece is ready! 🎉',
    html
  })

  return result
}

/**
 * Send order confirmation email after successful purchase
 */
export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<{ success: boolean; error?: string }> {
  const petNameText = data.petName ? ` for ${data.petName}` : ''
  const formattedAmount = (data.amount / 100).toFixed(2)
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - PawPop</title>
      <style>
        body { font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #2C2C2C; margin: 0; padding: 0; background-color: #F5EED7; }
        .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: #70D6FF; color: #FFFFFF; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; font-family: 'Arvo', serif; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content h2 { color: #2C2C2C; margin-top: 0; font-family: 'Arvo', serif; font-weight: 700; }
        .order-details { background-color: #F5EED7; padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #FFD670; }
        .order-row { display: flex; justify-content: space-between; margin: 10px 0; }
        .order-row strong { font-weight: 600; }
        .total-row { border-top: 2px solid #FFD670; padding-top: 15px; margin-top: 15px; font-size: 18px; font-weight: 600; }
        .footer { background-color: #F5EED7; padding: 30px; text-align: center; color: #2C2C2C; font-size: 14px; }
        .divider { height: 1px; background: #FFD670; margin: 30px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Order Confirmed!</h1>
        </div>
        
        <div class="content">
          <h2>${data.customerName ? `Thank you for your order, ${data.customerName}!` : 'Thank you for your order! 🎨'}</h2>
          
          <p>We've received your order${petNameText} and are excited to create your beautiful PawPop print!</p>
          
          <div class="order-details">
            <h3 style="margin-top: 0; color: #667eea;">Order Details</h3>
            <div class="order-row">
              <span>Order Number:</span>
              <strong>${data.orderNumber}</strong>
            </div>
            <div class="order-row">
              <span>Product:</span>
              <strong>${data.productType}${data.productSize ? ` (${data.productSize})` : ''}</strong>
            </div>
            <div class="order-row total-row">
              <span>Total:</span>
              <strong>${data.currency.toUpperCase()} $${formattedAmount}</strong>
            </div>
          </div>
          
          <p><strong>What happens next:</strong></p>
          <ul>
            <li>🎨 We'll prepare your artwork for printing with the highest quality standards</li>
            <li>🖨️ Your order will be sent to our premium printing partner</li>
            <li>📦 You'll receive a shipping notification with tracking information</li>
            <li>🚚 Delivery typically takes 5-7 business days</li>
          </ul>
          
          <div class="divider"></div>
          
          <p>We'll keep you updated throughout the process. If you have any questions about your order, please don't hesitate to reach out!</p>
          
          <p>Thank you for choosing PawPop!</p>
          
          <p>Best regards,<br>The PawPop Team</p>
        </div>
        
        <div class="footer">
          <p>PawPop - The Unforgettable Gift for Pet Moms</p>
          <p>2006-1323 Homer St, Vancouver BC Canada V6B 5T1</p>
          <p>Questions? Reply to this email or contact us at hello@updates.pawpopart.com</p>
        </div>
      </div>
    </body>
    </html>
  `

  const result = await sendEmail({
    to: data.customerEmail,
    subject: `Order Confirmed: Your PawPop Masterpiece`,
    html
  })

  return result
}

/**
 * Send shipping notification email when order ships
 */
export async function sendShippingNotificationEmail(data: ShippingNotificationEmailData): Promise<{ success: boolean; error?: string }> {
  const trackingInfo = data.trackingNumber ? `
    <div class="tracking-info">
      <h3 style="color: #667eea;">Tracking Information</h3>
      <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
      ${data.carrier ? `<p><strong>Carrier:</strong> ${data.carrier}</p>` : ''}
      ${data.trackingUrl ? `<p><a href="${data.trackingUrl}" style="color: #667eea; text-decoration: none; font-weight: 600;">Track Your Package →</a></p>` : ''}
    </div>
  ` : ''
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your PawPop order has shipped!</title>
      <style>
        body { font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #2C2C2C; margin: 0; padding: 0; background-color: #F5EED7; }
        .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: #E9FF70; color: #2C2C2C; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; font-family: 'Arvo', serif; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content h2 { color: #2C2C2C; margin-top: 0; font-family: 'Arvo', serif; font-weight: 700; }
        .tracking-info { background-color: #F5EED7; padding: 25px; border-radius: 12px; margin: 25px 0; border: 2px solid #FFD670; }
        .footer { background-color: #F5EED7; padding: 30px; text-align: center; color: #2C2C2C; font-size: 14px; }
        .divider { height: 1px; background: #FFD670; margin: 30px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📦 Your Order Has Shipped!</h1>
        </div>
        
        <div class="content">
          <h2>${data.customerName ? `Great news, ${data.customerName}!` : 'Great news! 📦'}</h2>
          
          <p>Your PawPop ${data.productType} (Order #${data.orderNumber}) has been carefully packaged and is now on its way to you!</p>
          
          ${trackingInfo}
          
          <p><strong>Delivery Information:</strong></p>
          <ul>
            <li>📅 Estimated delivery: 3-5 business days</li>
            <li>📦 Your artwork is professionally packaged to ensure it arrives in perfect condition</li>
            <li>🏠 Delivery will be made to the address provided during checkout</li>
          </ul>
          
          <div class="divider"></div>
          
          <p>We can't wait for you to see your beautiful PawPop masterpiece in person! The quality and attention to detail will truly amaze you.</p>
          
          <p>If you have any questions about your shipment or need to make any changes, please contact us as soon as possible.</p>
          
          <p>Thank you for choosing PawPop!</p>
          
          <p>Best regards,<br>The PawPop Team</p>
        </div>
        
        <div class="footer">
          <p>PawPop - The Unforgettable Gift for Pet Moms</p>
          <p>2006-1323 Homer St, Vancouver BC Canada V6B 5T1</p>
          <p>Questions? Reply to this email or contact us at hello@updates.pawpopart.com</p>
        </div>
      </div>
    </body>
    </html>
  `

  const result = await sendEmail({
    to: data.customerEmail,
    subject: `Your PawPop order #${data.orderNumber} has shipped! 📦`,
    html
  })

  return result
}

// System Alert Email Interface
export interface SystemAlertEmailData {
  alertId: string
  service: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details: Record<string, any>
  timestamp: Date
}

export async function sendSystemAlertEmail(data: SystemAlertEmailData) {
  const severityColors = {
    low: '#10B981',      // green
    medium: '#F59E0B',   // yellow
    high: '#EF4444',     // red
    critical: '#DC2626'  // dark red
  }

  const severityEmojis = {
    low: '💡',
    medium: '⚠️',
    high: '🚨',
    critical: '🔥'
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>PawPop System Alert</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">
          ${severityEmojis[data.severity]} System Alert
        </h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">
          PawPop Monitoring System
        </p>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: ${severityColors[data.severity]}; color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; font-size: 20px; text-transform: uppercase;">
            ${data.severity} Alert
          </h2>
          <p style="margin: 5px 0 0 0; font-size: 16px;">
            Service: <strong>${data.service}</strong>
          </p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #333; margin-bottom: 10px;">Alert Message</h3>
          <p style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 0; font-size: 16px;">
            ${data.message}
          </p>
        </div>
        
        <div style="margin-bottom: 25px;">
          <h3 style="color: #333; margin-bottom: 10px;">Alert Details</h3>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; font-weight: bold; width: 30%;">Alert ID:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; font-family: monospace;">${data.alertId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; font-weight: bold;">Timestamp:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">${data.timestamp.toISOString()}</td>
              </tr>
              ${Object.entries(data.details).map(([key, value]) => `
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef; font-weight: bold;">${key}:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e9ecef;">${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</td>
                </tr>
              `).join('')}
            </table>
          </div>
        </div>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; border-left: 4px solid #2196f3;">
          <h3 style="color: #1976d2; margin: 0 0 10px 0;">Next Steps</h3>
          <ul style="margin: 0; padding-left: 20px; color: #333;">
            <li>Check the monitoring dashboard for current system status</li>
            <li>Review service logs for additional context</li>
            <li>Take appropriate action based on the alert severity</li>
            <li>Mark the alert as resolved once the issue is fixed</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
          <p style="color: #666; font-size: 14px; margin: 0;">
            This alert was generated automatically by the PawPop monitoring system.<br>
            For questions, contact the development team.
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  // Always send monitoring alerts to pawpopart@gmail.com
  const recipient = 'pawpopart@gmail.com'

  const result = await sendEmail({
    from: 'PawPop Alerts <hello@updates.pawpopart.com>',
    to: recipient,
    subject: `[${data.severity.toUpperCase()}] ${data.service} Alert: ${data.message}`,
    html
  })

  return result
}

/**
 * Send admin review notification email
 */
export async function sendAdminReviewNotification(data: AdminReviewNotificationData): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const reviewTypeDisplay = data.reviewType === 'artwork_proof' ? 'Artwork Proof' : 
                           data.reviewType === 'highres_file' ? 'High-Res File' : 
                           'Edit Request'
  const petNameDisplay = data.petName ? ` for ${data.petName}` : ''
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ADMIN: ${reviewTypeDisplay} Review Required</title>
    </head>
    <body style="font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #2C2C2C; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #F5EED7;">
      <div style="background: #FFFFFF; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: #FF70A6; color: #FFFFFF; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700; font-family: 'Arvo', serif;">🔍 ADMIN REVIEW REQUIRED</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${reviewTypeDisplay} needs your approval</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          
          <!-- Customer Info -->
          <div style="background: #F5EED7; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #FFD670;">
            <h3 style="color: #2C2C2C; margin: 0 0 15px 0; font-family: 'Arvo', serif; font-weight: 700;">Customer Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; width: 30%;">Customer:</td>
                <td style="padding: 8px 0;">${data.customerName}</td>
              </tr>
              ${data.petName ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Pet Name:</td>
                <td style="padding: 8px 0;">${data.petName}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Review Type:</td>
                <td style="padding: 8px 0;">${reviewTypeDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Review ID:</td>
                <td style="padding: 8px 0; font-family: monospace;">${data.reviewId}</td>
              </tr>
            </table>
          </div>
          
          <!-- Image Preview -->
          <div style="text-align: center; margin-bottom: 25px;">
            <h3 style="color: #2C2C2C; margin-bottom: 15px; font-family: 'Arvo', serif; font-weight: 700;">Image for Review</h3>
            <div style="background: #F5EED7; padding: 20px; border-radius: 12px; display: inline-block; border: 2px solid #FFD670;">
              <img src="${data.imageUrl}" alt="Artwork for review" style="max-width: 400px; max-height: 400px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            </div>
          </div>
          
          ${data.editRequestText ? `
          <!-- Edit Request -->
          <div style="background: #fff3cd; padding: 20px; border-radius: 12px; margin-bottom: 25px; border: 2px solid #ffc107;">
            <h3 style="color: #856404; margin: 0 0 15px 0; font-family: 'Arvo', serif; font-weight: 700;">📝 Customer's Edit Request</h3>
            <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #2C2C2C; white-space: pre-wrap;">${data.editRequestText}</p>
          </div>
          ` : ''}
          
          ${data.falGenerationUrl ? `
          <!-- FAL.ai Reference -->
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 25px;">
            <h4 style="color: #1976d2; margin: 0 0 10px 0;">🔗 FAL.ai Generation Reference</h4>
            <p style="margin: 0; font-family: monospace; font-size: 14px; word-break: break-all;">
              <a href="${data.falGenerationUrl}" style="color: #1976d2; text-decoration: none;">${data.falGenerationUrl}</a>
            </p>
          </div>
          ` : ''}
          
          <!-- Action Buttons -->
          <div style="text-align: center; margin-bottom: 25px;">
            <h3 style="color: #2C2C2C; margin-bottom: 20px; font-family: 'Arvo', serif; font-weight: 700;">Review Actions</h3>
            <div style="display: inline-block;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/reviews/${data.reviewId}" 
                 style="display: inline-block; background: #FF9770 !important; color: #FFFFFF !important; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; margin: 0 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: none; font-family: 'Fredoka One', cursive;">
                📋 Review in Dashboard
              </a>
            </div>
          </div>
          
          <!-- Instructions -->
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px;">
            <h4 style="color: #856404; margin: 0 0 10px 0;">⚠️ Review Instructions</h4>
            <ul style="margin: 0; padding-left: 20px; color: #856404;">
              <li>Click "Review in Dashboard" to access the admin review interface</li>
              <li>Carefully examine the ${reviewTypeDisplay.toLowerCase()} for quality and accuracy</li>
              <li>Use the approve/reject buttons in the dashboard</li>
              <li>Add notes if rejecting to help improve future generations</li>
              <li>Customer orders are on hold until approval</li>
            </ul>
          </div>
          
        </div>
        
        <!-- Footer -->
        <div style="background: #F5EED7; padding: 20px; text-align: center; border-top: 1px solid #FFD670;">
          <p style="color: #2C2C2C; font-size: 14px; margin: 0;">
            This is an automated admin notification from PawPop Quality Control System.<br>
            Review ID: ${data.reviewId} | Generated at ${new Date().toISOString()}
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `

  // Always send to pawpopart@gmail.com for admin reviews (tagged ADMIN in subject)
  const result = await sendEmail({
    from: 'PawPop Admin <hello@updates.pawpopart.com>',
    to: 'pawpopart@gmail.com',
    subject: `[ADMIN] ${reviewTypeDisplay} Review Required${petNameDisplay} - ${data.customerName}`,
    html
  })

  return result
}

/**
 * Send email confirmation after email capture (before photo upload)
 */
export interface EmailCaptureConfirmationData {
  customerName?: string
  customerEmail: string
  uploadUrl: string
}

export async function sendEmailCaptureConfirmation(data: EmailCaptureConfirmationData): Promise<{ success: boolean; error?: string }> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Thanks for your interest!</title>
      <style>
        body { font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #2C2C2C; margin: 0; padding: 0; background-color: #F5EED7; }
        .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: #FF70A6; color: #FFFFFF; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; font-family: 'Arvo', serif; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content h2 { color: #2C2C2C; margin-top: 0; font-family: 'Arvo', serif; font-weight: 700; }
        .cta-button { display: inline-block; background: #FF9770 !important; color: #FFFFFF !important; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 20px 0; border: none; font-family: 'Fredoka One', cursive; }
        .footer { background-color: #F5EED7; padding: 30px; text-align: center; color: #2C2C2C; font-size: 14px; }
        .divider { height: 1px; background: #FFD670; margin: 30px 0; }
        .highlight-box { background: #FFF9E6; border-left: 4px solid #FFD670; padding: 20px; margin: 20px 0; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✨ Your Spot is Reserved!</h1>
        </div>
        
        <div class="content">
          <h2>${data.customerName ? `Hi ${data.customerName}! 👋` : 'Welcome to PawPop! 👋'}</h2>
          
          <p style="font-size: 16px; line-height: 1.8;">
            Thanks for your interest in creating a Renaissance masterpiece! We've saved your spot and you can upload your photos whenever you're ready.
          </p>
          
          <div class="highlight-box">
            <p style="margin: 0; font-size: 16px; font-weight: 600; color: #2C2C2C;">
              🎨 <strong>What happens next?</strong>
            </p>
            <p style="margin: 10px 0 0 0; font-size: 15px;">
              When you're ready, just upload your photos and we'll transform them into a stunning Renaissance-style portrait in about 3 minutes!
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.uploadUrl}" class="cta-button" style="display: inline-block; background: #FF9770 !important; color: #FFFFFF !important; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: 600; border: none; font-family: 'Fredoka One', cursive;">
              Upload Photos Now
            </a>
          </div>
          
          <div class="divider"></div>
          
          <h3 style="color: #2C2C2C; font-family: 'Arvo', serif; font-weight: 700;">📸 What You'll Need:</h3>
          <ul style="font-size: 15px; line-height: 1.8;">
            <li><strong>Pet Mom Photo:</strong> A clear photo of the pet mom's face</li>
            <li><strong>Pet Photo:</strong> A photo of their beloved pet</li>
            <li><strong>3 Minutes:</strong> That's all it takes to create magic!</li>
          </ul>
          
          <div class="highlight-box">
            <p style="margin: 0; font-size: 14px; color: #666;">
              💡 <strong>Pro Tip:</strong> Have your photos ready on your device before you start. This makes the process super quick and easy!
            </p>
          </div>
          
          <p style="font-size: 15px; margin-top: 30px;">
            Questions? Just reply to this email - we're here to help! 💕
          </p>
          
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 10px 0;">
            <strong>PawPop</strong><br>
            Where pet moms become Renaissance masterpieces
          </p>
          <p style="margin: 0; font-size: 13px; color: #666;">
            2006-1323 Homer St, Vancouver BC Canada V6B 5T1
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `

  const result = await sendEmail({
    to: data.customerEmail,
    subject: `Action Required: Complete Your PawPop Order`,
    html,
    replyTo: 'pawpopart@gmail.com'
  })

  return result
}

/**
 * Send upload reminder email (24h, 72h, 7d)
 */
export interface UploadReminderData {
  customerName?: string
  customerEmail: string
  uploadUrl: string
  reminderNumber: number // 1, 2, or 3
}

export async function sendUploadReminder(data: UploadReminderData): Promise<{ success: boolean; error?: string }> {
  // Different messaging based on reminder number
  const messages = {
    1: {
      subject: `Reminder: Complete Your PawPop Order`,
      emoji: '',
      headline: 'Order Status: Awaiting Photos',
      message: `You started creating a custom Renaissance portrait but haven't uploaded your photos yet. Your order is ready to process as soon as you upload.`,
      urgency: '',
      orderNote: '<p style="background: #F5F5F5; padding: 15px; margin: 20px 0; border-radius: 8px; font-size: 14px; color: #666;"><strong>Order Status:</strong> Awaiting photo upload<br><strong>Time to Complete:</strong> 3 minutes<br><strong>Processing Time:</strong> 2-5 minutes after upload</p>'
    },
    2: {
      subject: `Action Required: Upload Photos to Complete Order`,
      emoji: '',
      headline: 'Order Incomplete: Photos Needed',
      message: `Your PawPop order is on hold pending photo upload. To complete your order and receive your Renaissance portrait, please upload your photos.`,
      urgency: '',
      orderNote: '<p style="background: #F5F5F5; padding: 15px; margin: 20px 0; border-radius: 8px; font-size: 14px; color: #666;"><strong>Order Status:</strong> Incomplete<br><strong>Action Needed:</strong> Upload 2 photos<br><strong>Link Expires:</strong> 7 days from registration</p>'
    },
    3: {
      subject: `Final Notice: Complete Your PawPop Order`,
      emoji: '',
      headline: 'Order Expiring: Action Required',
      message: `This is a final reminder that your PawPop order will expire soon. Upload your photos now to complete your order and receive your custom Renaissance portrait.`,
      urgency: '',
      orderNote: '<p style="background: #FFF3E0; border-left: 3px solid #FF9770; padding: 15px; margin: 20px 0; border-radius: 8px; font-size: 14px;"><strong>⚠️ Order Expiring:</strong> Your upload link will expire in 48 hours. Complete your order now to avoid cancellation.</p>'
    }
  }

  const msg = messages[data.reminderNumber as keyof typeof messages] || messages[1]

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${msg.subject}</title>
      <style>
        body { font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #2C2C2C; margin: 0; padding: 0; background-color: #F5EED7; }
        .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #FF9770 0%, #FF70A6 100%); color: #FFFFFF; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; font-family: 'Arvo', serif; }
        .content { padding: 40px 30px; background-color: #FFFFFF; }
        .content h2 { color: #2C2C2C; margin-top: 0; font-family: 'Arvo', serif; font-weight: 700; }
        .cta-button { display: inline-block; background: #FF9770 !important; color: #FFFFFF !important; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; margin: 20px 0; border: none; font-family: 'Fredoka One', cursive; font-size: 18px; }
        .footer { background-color: #F5EED7; padding: 30px; text-align: center; color: #2C2C2C; font-size: 14px; }
        .example-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 25px 0; }
        .example-item { text-align: center; }
        .example-item img { width: 100%; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${msg.headline}</h1>
        </div>
        
        <div class="content">
          <h2>${data.customerName ? `Hi ${data.customerName}!` : msg.headline}</h2>
          
          <p style="font-size: 16px; line-height: 1.8;">
            ${msg.message}
          </p>
          
          ${msg.orderNote || msg.urgency}
          
          <div style="text-align: center; margin: 35px 0;">
            <a href="${data.uploadUrl}" class="cta-button" style="display: inline-block; background: #FF9770 !important; color: #FFFFFF !important; padding: 18px 40px; text-decoration: none; border-radius: 12px; font-weight: 600; border: none; font-family: 'Fredoka One', cursive; font-size: 18px;">
              Upload Photos Now
            </a>
          </div>
          
          <h3 style="color: #2C2C2C; font-family: 'Arvo', serif; font-weight: 700;">What You'll Receive:</h3>
          <ul style="font-size: 15px; line-height: 1.8;">
            <li>Custom Renaissance-style portrait</li>
            <li>High-resolution digital file</li>
            <li>Ready in 2-5 minutes after upload</li>
          </ul>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            Questions about your order? Reply to this email for support.
          </p>
          
          <div style="display: none;" class="example-grid">
            <div class="example-item">
              <img src="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/images/hero_1.jpeg" alt="Example transformation" />
              <p style="font-size: 13px; margin: 8px 0 0 0; color: #666;">Sarah & Bella</p>
            </div>
            <div class="example-item">
              <img src="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/images/pet-integration-output.jpg" alt="Example transformation" />
              <p style="font-size: 13px; margin: 8px 0 0 0; color: #666;">Jennifer & Muffin</p>
            </div>
          </div>
          
          <p style="font-size: 15px; text-align: center; margin-top: 30px; color: #666;">
            <strong>It only takes 3 minutes</strong> to create your masterpiece! 🎨
          </p>
          
          <p style="font-size: 14px; margin-top: 30px; color: #999; text-align: center;">
            Not interested? <a href="#" style="color: #999; text-decoration: underline;">Unsubscribe</a>
          </p>
          
        </div>
        
        <div class="footer">
          <p style="margin: 0 0 10px 0;">
            <strong>PawPop</strong><br>
            Where pet moms become Renaissance masterpieces
          </p>
          <p style="margin: 0; font-size: 13px; color: #666;">
            2006-1323 Homer St, Vancouver BC Canada V6B 5T1
          </p>
        </div>
        
      </div>
    </body>
    </html>
  `

  // Plain text version for better deliverability
  const text = `
${msg.headline}

${data.customerName ? `Hi ${data.customerName}!` : 'Hello!'}

${msg.message}

Upload Photos Now: ${data.uploadUrl}

What You'll Receive:
- Custom Renaissance-style portrait
- High-resolution digital file  
- Ready in 2-5 minutes after upload

Questions about your order? Reply to this email for support.

---
PawPop
Where pet moms become Renaissance masterpieces
2006-1323 Homer St, Vancouver BC Canada V6B 5T1
  `.trim()

  const result = await sendEmail({
    to: data.customerEmail,
    subject: msg.subject,
    html,
    replyTo: 'pawpopart@gmail.com'
  })

  return result
}
