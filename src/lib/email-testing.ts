// src/lib/email-testing.ts
/**
 * Email Testing Utilities for Domain Reputation Protection
 * 
 * This module provides safe email testing functionality to protect domain reputation
 * during development and testing phases.
 */

export interface EmailTestConfig {
  enabled: boolean
  testRecipient: string
  logEmails: boolean
  saveToFile: boolean
  mockMode: boolean
}

/**
 * Get email testing configuration from environment variables
 */
export function getEmailTestConfig(): EmailTestConfig {
  return {
    enabled: process.env.EMAIL_TEST_MODE === 'true' || process.env.NODE_ENV === 'development',
    testRecipient: process.env.EMAIL_TEST_RECIPIENT || 'pawpopart@gmail.com',
    logEmails: process.env.EMAIL_LOG_MODE === 'true',
    saveToFile: process.env.EMAIL_SAVE_TO_FILE === 'true',
    mockMode: process.env.EMAIL_MOCK_MODE === 'true'
  }
}

/**
 * Mock email service for testing without sending real emails
 */
export class MockEmailService {
  private static emails: Array<{
    to: string
    subject: string
    html: string
    timestamp: string
    id: string
  }> = []

  static async send(data: { to: string; subject: string; html: string }) {
    const emailId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const email = {
      ...data,
      timestamp: new Date().toISOString(),
      id: emailId
    }

    this.emails.push(email)
    
    console.log(`📧 [MOCK] Email would be sent to: ${data.to}`)
    console.log(`📧 [MOCK] Subject: ${data.subject}`)
    console.log(`📧 [MOCK] Email ID: ${emailId}`)
    
    return { success: true, messageId: emailId }
  }

  static getEmails() {
    return [...this.emails]
  }

  static clearEmails() {
    this.emails = []
  }

  static getEmailCount() {
    return this.emails.length
  }
}

/**
 * Rate limiting for email testing to prevent spam
 */
export class EmailRateLimit {
  private static emailCounts = new Map<string, { count: number; resetTime: number }>()
  private static readonly MAX_EMAILS_PER_HOUR = 10
  private static readonly HOUR_IN_MS = 60 * 60 * 1000

  static canSendEmail(recipient: string): boolean {
    const now = Date.now()
    const key = recipient.toLowerCase()
    const record = this.emailCounts.get(key)

    if (!record || now > record.resetTime) {
      this.emailCounts.set(key, { count: 1, resetTime: now + this.HOUR_IN_MS })
      return true
    }

    if (record.count >= this.MAX_EMAILS_PER_HOUR) {
      console.warn(`⚠️ Rate limit exceeded for ${recipient}. Max ${this.MAX_EMAILS_PER_HOUR} emails per hour.`)
      return false
    }

    record.count++
    return true
  }

  static getRemainingEmails(recipient: string): number {
    const record = this.emailCounts.get(recipient.toLowerCase())
    if (!record || Date.now() > record.resetTime) {
      return this.MAX_EMAILS_PER_HOUR
    }
    return Math.max(0, this.MAX_EMAILS_PER_HOUR - record.count)
  }
}

/**
 * Email validation for testing
 */
export function isValidTestEmail(email: string): boolean {
  const testDomains = [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com',
    'test.com',
    'example.com'
  ]
  
  const domain = email.split('@')[1]?.toLowerCase()
  return testDomains.includes(domain)
}

/**
 * Create test email content with safety warnings
 */
export function wrapTestEmailContent(originalHtml: string, originalRecipient: string): string {
  return `
    <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin-bottom: 20px; border-radius: 5px; font-family: Arial, sans-serif;">
      <h3 style="margin: 0 0 10px 0; color: #856404;">🧪 TEST MODE EMAIL</h3>
      <p style="margin: 5px 0;"><strong>Original Recipient:</strong> ${originalRecipient}</p>
      <p style="margin: 5px 0;"><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
      <p style="margin: 5px 0;"><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
      <p style="margin: 5px 0; font-size: 12px; color: #856404;">
        This email was intercepted by the testing system to protect domain reputation.
      </p>
    </div>
    ${originalHtml}
  `
}
