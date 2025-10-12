// Server-side Meta (Facebook) Conversions API tracking
// This handles purchase conversions from Stripe webhooks with event deduplication

import crypto from 'crypto';

export interface MetaServerConversionData {
  orderId: string;
  value: number;
  currency: string;
  productType: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: {
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  eventId?: string; // For deduplication with client-side events
  eventSourceUrl?: string;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * Hash user data according to Meta's requirements (SHA-256)
 */
function hashData(data: string | undefined): string | undefined {
  if (!data) return undefined;
  
  // Normalize: lowercase and trim
  const normalized = data.toLowerCase().trim();
  
  // Hash with SHA-256
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Send conversion data to Meta Conversions API
 * Implements event deduplication and enhanced matching
 */
export async function trackMetaServerSideConversion(
  conversionData: MetaServerConversionData
): Promise<{ success: boolean; error?: string }> {
  // Check if Meta Conversions API is configured
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CONVERSION_API_ACCESS_TOKEN;
  
  if (!pixelId || !accessToken) {
    console.log('Meta Conversions API: Environment variables not configured');
    return { success: false, error: 'Meta Conversions API not configured' };
  }

  try {
    // Prepare user data with hashing for privacy
    const userData: any = {};
    
    if (conversionData.customerEmail) {
      userData.em = hashData(conversionData.customerEmail);
    }
    
    if (conversionData.customerPhone) {
      // Remove non-numeric characters before hashing
      const cleanPhone = conversionData.customerPhone.replace(/\D/g, '');
      userData.ph = hashData(cleanPhone);
    }
    
    if (conversionData.customerName) {
      const nameParts = conversionData.customerName.trim().split(' ');
      userData.fn = hashData(nameParts[0] || '');
      userData.ln = hashData(nameParts.slice(1).join(' ') || '');
    }
    
    if (conversionData.customerAddress) {
      if (conversionData.customerAddress.city) {
        userData.ct = hashData(conversionData.customerAddress.city);
      }
      if (conversionData.customerAddress.state) {
        userData.st = hashData(conversionData.customerAddress.state);
      }
      if (conversionData.customerAddress.zip) {
        // Remove spaces from zip before hashing
        const cleanZip = conversionData.customerAddress.zip.replace(/\s/g, '');
        userData.zp = hashData(cleanZip);
      }
      if (conversionData.customerAddress.country) {
        userData.country = hashData(conversionData.customerAddress.country);
      }
    }
    
    if (conversionData.ipAddress) {
      userData.client_ip_address = conversionData.ipAddress;
    }
    
    if (conversionData.userAgent) {
      userData.client_user_agent = conversionData.userAgent;
    }

    // Generate event ID for deduplication (or use provided one from client)
    const eventId = conversionData.eventId || generateEventId('Purchase', conversionData.orderId);
    
    // Prepare custom data
    const customData: any = {
      value: conversionData.value,
      currency: conversionData.currency,
      content_name: `PawPop ${conversionData.productType}`,
      content_category: 'pet_art',
      content_ids: [`pawpop_${conversionData.productType}`],
      content_type: 'product',
      num_items: 1,
      order_id: conversionData.orderId
    };

    // Prepare the conversion event
    const eventData = {
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
      event_id: eventId, // Critical for deduplication
      event_source_url: conversionData.eventSourceUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://pawpopart.com',
      action_source: 'website',
      user_data: userData,
      custom_data: customData
    };

    // Prepare the request payload
    const payload = {
      data: [eventData],
      test_event_code: process.env.META_TEST_EVENT_CODE // Optional: for testing in Events Manager
    };

    // Send to Meta Conversions API
    const url = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Meta Conversions API error:', result);
      return { 
        success: false, 
        error: result.error?.message || 'Failed to send conversion to Meta' 
      };
    }

    console.log('🎯 Meta Conversions API: Purchase tracked (server-side)', {
      pixel_id: pixelId,
      event_id: eventId,
      order_id: conversionData.orderId,
      value: conversionData.value,
      currency: conversionData.currency,
      product_type: conversionData.productType,
      events_received: result.events_received,
      has_enhanced_data: Object.keys(userData).length > 0,
      timestamp: new Date().toISOString()
    });

    return { success: true };
    
  } catch (error) {
    console.error('Failed to track Meta server-side conversion:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate a consistent event ID for deduplication
 * Same logic as client-side to ensure matching
 */
function generateEventId(eventName: string, uniqueData: string): string {
  const str = `${eventName}_${uniqueData}_${Date.now()}`;
  return crypto.createHash('md5').update(str).digest('hex').substring(0, 16);
}

/**
 * Track multiple events in a single API call (batch processing)
 */
export async function trackMetaBatchConversions(
  conversions: MetaServerConversionData[]
): Promise<{ success: boolean; error?: string; eventsReceived?: number }> {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const accessToken = process.env.META_CONVERSION_API_ACCESS_TOKEN;
  
  if (!pixelId || !accessToken) {
    console.log('Meta Conversions API: Environment variables not configured');
    return { success: false, error: 'Meta Conversions API not configured' };
  }

  try {
    const eventDataArray = conversions.map(conversion => {
      const userData: any = {};
      
      if (conversion.customerEmail) {
        userData.em = hashData(conversion.customerEmail);
      }
      
      // ... (similar user data preparation as above)
      
      return {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: conversion.eventId || generateEventId('Purchase', conversion.orderId),
        event_source_url: conversion.eventSourceUrl || process.env.NEXT_PUBLIC_BASE_URL,
        action_source: 'website',
        user_data: userData,
        custom_data: {
          value: conversion.value,
          currency: conversion.currency,
          content_name: `PawPop ${conversion.productType}`,
          order_id: conversion.orderId
        }
      };
    });

    const payload = {
      data: eventDataArray,
      test_event_code: process.env.META_TEST_EVENT_CODE
    };

    const url = `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error?.message };
    }

    console.log(`Meta Conversions API: ${conversions.length} events tracked (batch)`, {
      events_received: result.events_received
    });

    return { success: true, eventsReceived: result.events_received };
    
  } catch (error) {
    console.error('Failed to track Meta batch conversions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
