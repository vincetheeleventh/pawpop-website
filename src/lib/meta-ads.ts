// Meta (Facebook) Pixel conversion tracking utilities
declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: (...args: any[]) => void;
  }
}

export interface MetaEventData {
  value?: number;
  currency?: string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  contents?: Array<{ id: string; quantity: number }>;
  num_items?: number;
  event_id?: string; // For deduplication with server-side events
  [key: string]: any;
}

// Meta Pixel ID from environment
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

// Initialize Meta Pixel tracking
export const initMetaPixel = (pixelId: string) => {
  if (typeof window === 'undefined') return;

  // Load Meta Pixel base code
  (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
  
  console.log('Meta Pixel: Initialized successfully');
};

// Generate unique event ID for deduplication between client and server
const generateEventId = (eventName: string, uniqueData: string): string => {
  // Simple hash function for client-side
  const str = `${eventName}_${uniqueData}_${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

// Track photo upload completion (Lead event)
export const trackMetaPhotoUpload = (value: number = 2, userData?: { email?: string; name?: string }) => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const eventId = generateEventId('Lead', userData?.email || 'anonymous');
  
  const eventData: MetaEventData = {
    value: value,
    currency: 'CAD',
    content_name: 'Photo Upload',
    content_category: 'engagement',
    event_id: eventId
  };

  window.fbq('track', 'Lead', eventData);
  
  console.log('Meta Pixel: Lead (Photo Upload) tracked', { eventId, ...eventData });
  
  return eventId; // Return for potential server-side deduplication
};

// Track artwork generation completion (ViewContent event)
export const trackMetaArtworkGeneration = (artworkId: string, value: number = 8, userData?: { email?: string }) => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const eventId = generateEventId('ViewContent', artworkId);
  
  const eventData: MetaEventData = {
    value: value,
    currency: 'CAD',
    content_name: 'Artwork Generation',
    content_category: 'artwork',
    content_ids: [artworkId],
    event_id: eventId
  };

  window.fbq('track', 'ViewContent', eventData);
  
  console.log('Meta Pixel: ViewContent (Artwork Generation) tracked', { eventId, ...eventData });
  
  return eventId;
};

// Track artwork page view (high intent)
export const trackMetaArtworkView = (artworkId: string, value: number = 1) => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const eventId = generateEventId('ViewContent', artworkId);
  
  const eventData: MetaEventData = {
    value: value,
    currency: 'CAD',
    content_name: 'Artwork Page View',
    content_category: 'artwork',
    content_ids: [artworkId],
    event_id: eventId
  };

  window.fbq('track', 'ViewContent', eventData);
  
  console.log('Meta Pixel: ViewContent (Artwork Page) tracked', { eventId, ...eventData });
  
  return eventId;
};

// Track add to cart / begin checkout
export const trackMetaBeginCheckout = (productType: string, value: number, currency: string = 'CAD') => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const eventId = generateEventId('InitiateCheckout', productType);
  
  const eventData: MetaEventData = {
    value: value,
    currency: currency,
    content_name: `PawPop ${productType}`,
    content_category: 'pet_art',
    content_ids: [`pawpop_${productType}`],
    num_items: 1,
    event_id: eventId
  };

  window.fbq('track', 'InitiateCheckout', eventData);
  
  console.log('Meta Pixel: InitiateCheckout tracked', { eventId, ...eventData });
  
  return eventId;
};

// Track purchase completion (client-side, will be deduplicated with server-side event)
export const trackMetaPurchase = (
  orderId: string,
  value: number,
  productType: string,
  currency: string = 'CAD',
  userData?: { email?: string; name?: string }
) => {
  if (typeof window === 'undefined' || !window.fbq) return;

  const eventId = generateEventId('Purchase', orderId);
  
  const eventData: MetaEventData = {
    value: value,
    currency: currency,
    content_name: `PawPop ${productType}`,
    content_category: 'pet_art',
    content_ids: [`pawpop_${productType}`],
    content_type: 'product',
    num_items: 1,
    event_id: eventId
  };

  window.fbq('track', 'Purchase', eventData);
  
  console.log('Meta Pixel: Purchase tracked (client-side)', { eventId, ...eventData });
  
  return eventId; // Return for server-side deduplication
};

// Track custom event
export const trackMetaCustomEvent = (eventName: string, data?: MetaEventData) => {
  if (typeof window === 'undefined' || !window.fbq) return;

  window.fbq('trackCustom', eventName, data || {});
  
  console.log(`Meta Pixel: Custom event '${eventName}' tracked`, data);
};

// Advanced matching for better attribution (optional)
export const setMetaAdvancedMatching = (userData: {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}) => {
  // Read pixel ID dynamically to support testing
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || META_PIXEL_ID;
  if (typeof window === 'undefined' || !window.fbq || !pixelId) return;

  // Reinitialize with advanced matching
  const advancedMatchingData: any = {};
  
  if (userData.email) advancedMatchingData.em = userData.email;
  if (userData.phone) advancedMatchingData.ph = userData.phone;
  if (userData.firstName) advancedMatchingData.fn = userData.firstName;
  if (userData.lastName) advancedMatchingData.ln = userData.lastName;
  if (userData.city) advancedMatchingData.ct = userData.city;
  if (userData.state) advancedMatchingData.st = userData.state;
  if (userData.zip) advancedMatchingData.zp = userData.zip;
  if (userData.country) advancedMatchingData.country = userData.country;

  window.fbq('init', pixelId, advancedMatchingData);
  
  console.log('Meta Pixel: Advanced matching data set');
};
