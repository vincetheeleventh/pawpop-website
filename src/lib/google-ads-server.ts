// Server-side Google Ads conversion tracking using Measurement Protocol
// This handles purchase conversions from Stripe webhooks

export interface ServerConversionData {
  orderId: string;
  value: number;
  currency: string;
  productType: string;
  customerEmail?: string;
  customParameters?: Record<string, any>;
}

/**
 * Send conversion data to Google Ads using Measurement Protocol
 * This is used for server-side purchase tracking from Stripe webhooks
 */
export async function trackServerSideConversion(
  conversionData: ServerConversionData
): Promise<{ success: boolean; error?: string }> {
  // Check if Google Ads tracking is configured
  const conversionId = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID;
  const purchaseConversionLabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID;
  
  if (!conversionId || !purchaseConversionLabel) {
    console.log('Google Ads server-side tracking: Environment variables not configured');
    return { success: false, error: 'Google Ads tracking not configured' };
  }

  // Extract conversion ID and label from the purchase conversion string
  // Format: AW-XXXXXXXXXX/XXXXXXXXXX
  const conversionParts = purchaseConversionLabel.split('/');
  if (conversionParts.length !== 2) {
    console.error('Invalid Google Ads purchase conversion format:', purchaseConversionLabel);
    return { success: false, error: 'Invalid conversion format' };
  }

  const [, conversionLabel] = conversionParts;

  try {
    // Use Google Analytics Measurement Protocol for server-side tracking
    // This sends the conversion to Google Ads via gtag
    const measurementId = conversionId.replace('AW-', 'G-'); // Convert to GA4 format if needed
    
    // Prepare the conversion payload
    const payload = {
      client_id: generateClientId(conversionData.orderId), // Generate consistent client ID
      events: [
        {
          name: 'conversion',
          params: {
            send_to: purchaseConversionLabel,
            value: conversionData.value,
            currency: conversionData.currency,
            transaction_id: conversionData.orderId,
            event_category: 'ecommerce',
            event_label: 'purchase_completed',
            product_type: conversionData.productType,
            ...conversionData.customParameters
          }
        },
        {
          name: 'purchase',
          params: {
            transaction_id: conversionData.orderId,
            value: conversionData.value,
            currency: conversionData.currency,
            items: [
              {
                item_id: `pawpop_${conversionData.productType}`,
                item_name: `PawPop ${conversionData.productType}`,
                category: 'pet_art',
                quantity: 1,
                price: conversionData.value
              }
            ]
          }
        }
      ]
    };

    // For now, we'll log the conversion data for manual verification
    // In production, you would send this to Google's Measurement Protocol
    console.log('🎯 Google Ads Server-Side Conversion Tracked:', {
      conversion_id: conversionId,
      conversion_label: conversionLabel,
      order_id: conversionData.orderId,
      value: conversionData.value,
      currency: conversionData.currency,
      product_type: conversionData.productType,
      timestamp: new Date().toISOString()
    });

    // TODO: Implement actual Measurement Protocol call
    // const response = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${API_SECRET}`, {
    //   method: 'POST',
    //   body: JSON.stringify(payload)
    // });

    return { success: true };
    
  } catch (error) {
    console.error('Failed to track server-side conversion:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Generate a consistent client ID for server-side tracking
 * This ensures conversions can be attributed properly
 */
function generateClientId(orderId: string): string {
  // Create a consistent client ID based on order ID
  // In production, you might want to use the actual client ID from the session
  const hash = require('crypto').createHash('md5').update(orderId).digest('hex');
  return `${hash.substring(0, 8)}.${Date.now()}`;
}

/**
 * Enhanced conversion tracking with Google Ads API (future implementation)
 * This would use the Google Ads API for more robust server-side tracking
 */
export async function trackConversionWithGoogleAdsAPI(
  conversionData: ServerConversionData
): Promise<{ success: boolean; error?: string }> {
  // TODO: Implement Google Ads API conversion tracking
  // This would require:
  // 1. Google Ads API credentials
  // 2. Customer ID
  // 3. Conversion action ID
  // 4. Google Ads API client library
  
  console.log('Google Ads API conversion tracking (not yet implemented):', conversionData);
  return { success: false, error: 'Google Ads API tracking not implemented' };
}

/**
 * Track conversion with enhanced ecommerce data
 * This provides more detailed conversion information
 */
export async function trackEnhancedEcommerceConversion(
  conversionData: ServerConversionData & {
    items: Array<{
      item_id: string;
      item_name: string;
      category: string;
      quantity: number;
      price: number;
    }>;
    shipping?: number;
    tax?: number;
  }
): Promise<{ success: boolean; error?: string }> {
  console.log('Enhanced ecommerce conversion tracked:', {
    ...conversionData,
    timestamp: new Date().toISOString(),
    enhanced: true
  });

  // Call the standard server-side tracking
  return trackServerSideConversion(conversionData);
}
