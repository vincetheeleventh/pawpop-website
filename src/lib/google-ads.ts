// Google Ads conversion tracking utilities
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export interface ConversionEvent {
  send_to: string;
  value?: number;
  currency?: string;
  transaction_id?: string;
  custom_parameters?: Record<string, any>;
}

// Google Ads Conversion IDs (you'll need to replace these with actual values from Google Ads)
export const GOOGLE_ADS_CONVERSIONS = {
  PHOTO_UPLOAD: process.env.NEXT_PUBLIC_GOOGLE_ADS_PHOTO_UPLOAD_ID || 'AW-CONVERSION_ID/CONVERSION_LABEL',
  ARTWORK_GENERATION: process.env.NEXT_PUBLIC_GOOGLE_ADS_ARTWORK_GENERATION_ID || 'AW-CONVERSION_ID/CONVERSION_LABEL',
  PURCHASE: process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_ID || 'AW-CONVERSION_ID/CONVERSION_LABEL',
  ARTWORK_VIEW: process.env.NEXT_PUBLIC_GOOGLE_ADS_ARTWORK_VIEW_ID || 'AW-CONVERSION_ID/CONVERSION_LABEL',
};

// Initialize Google Ads tracking
export const initGoogleAds = (conversionId: string) => {
  if (typeof window === 'undefined') return;

  // Load Google Ads script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${conversionId}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', conversionId);
};

// Track photo upload completion
export const trackPhotoUpload = (value: number = 5) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  const conversionData: ConversionEvent = {
    send_to: GOOGLE_ADS_CONVERSIONS.PHOTO_UPLOAD,
    value: value,
    currency: 'CAD',
    custom_parameters: {
      event_category: 'engagement',
      event_label: 'photo_upload_completed'
    }
  };

  window.gtag('event', 'conversion', conversionData);
  
  // Also send as a custom event for GA4
  window.gtag('event', 'photo_upload_completed', {
    event_category: 'engagement',
    event_label: 'lead_generation',
    value: value,
    currency: 'CAD'
  });

  console.log('Google Ads: Photo upload conversion tracked', conversionData);
};

// Track artwork generation completion
export const trackArtworkGeneration = (artworkId: string, value: number = 15) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  const conversionData: ConversionEvent = {
    send_to: GOOGLE_ADS_CONVERSIONS.ARTWORK_GENERATION,
    value: value,
    currency: 'CAD',
    custom_parameters: {
      event_category: 'engagement',
      event_label: 'artwork_generation_completed',
      artwork_id: artworkId
    }
  };

  window.gtag('event', 'conversion', conversionData);
  
  // Also send as a custom event for GA4
  window.gtag('event', 'artwork_generation_completed', {
    event_category: 'engagement',
    event_label: 'qualified_lead',
    value: value,
    currency: 'CAD',
    artwork_id: artworkId
  });

  console.log('Google Ads: Artwork generation conversion tracked', conversionData);
};

// Track purchase completion
export const trackPurchase = (
  orderId: string, 
  value: number, 
  productType: string,
  currency: string = 'CAD'
) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  const conversionData: ConversionEvent = {
    send_to: GOOGLE_ADS_CONVERSIONS.PURCHASE,
    value: value,
    currency: currency,
    transaction_id: orderId,
    custom_parameters: {
      event_category: 'ecommerce',
      event_label: 'purchase_completed',
      product_type: productType
    }
  };

  window.gtag('event', 'conversion', conversionData);
  
  // Also send as enhanced ecommerce event for GA4
  window.gtag('event', 'purchase', {
    transaction_id: orderId,
    value: value,
    currency: currency,
    items: [{
      item_id: `pawpop_${productType}`,
      item_name: `PawPop ${productType}`,
      category: 'pet_art',
      quantity: 1,
      price: value
    }]
  });

  console.log('Google Ads: Purchase conversion tracked', conversionData);
};

// Track artwork page view
export const trackArtworkView = (artworkId: string, value: number = 2) => {
  if (typeof window === 'undefined' || !window.gtag) return;

  const conversionData: ConversionEvent = {
    send_to: GOOGLE_ADS_CONVERSIONS.ARTWORK_VIEW,
    value: value,
    currency: 'CAD',
    custom_parameters: {
      event_category: 'engagement',
      event_label: 'artwork_page_viewed',
      artwork_id: artworkId
    }
  };

  window.gtag('event', 'conversion', conversionData);
  
  // Also send as a custom event for GA4
  window.gtag('event', 'artwork_viewed', {
    event_category: 'engagement',
    event_label: 'high_intent_user',
    value: value,
    currency: 'CAD',
    artwork_id: artworkId
  });

  console.log('Google Ads: Artwork view conversion tracked', conversionData);
};

// Enhanced ecommerce tracking for add to cart events
export const trackAddToCart = (productType: string, value: number, currency: string = 'CAD') => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'add_to_cart', {
    currency: currency,
    value: value,
    items: [{
      item_id: `pawpop_${productType}`,
      item_name: `PawPop ${productType}`,
      category: 'pet_art',
      quantity: 1,
      price: value
    }]
  });

  console.log('Google Ads: Add to cart tracked', { productType, value, currency });
};

// Track begin checkout
export const trackBeginCheckout = (productType: string, value: number, currency: string = 'CAD') => {
  if (typeof window === 'undefined' || !window.gtag) return;

  window.gtag('event', 'begin_checkout', {
    currency: currency,
    value: value,
    items: [{
      item_id: `pawpop_${productType}`,
      item_name: `PawPop ${productType}`,
      category: 'pet_art',
      quantity: 1,
      price: value
    }]
  });

  console.log('Google Ads: Begin checkout tracked', { productType, value, currency });
};
