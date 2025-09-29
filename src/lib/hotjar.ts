// src/lib/hotjar.ts

/**
 * Hotjar Analytics Integration
 * 
 * Provides helper functions for Hotjar tracking including:
 * - Custom event tracking
 * - User attribute setting
 * - Session tagging
 * - Trigger surveys/polls
 */

// Hotjar window interface
declare global {
  interface Window {
    hj?: (command: string, ...args: any[]) => void;
  }
}

/**
 * Check if Hotjar is loaded and available
 */
export function isHotjarAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.hj === 'function';
}

/**
 * Track a custom Hotjar event
 * @param eventName - Name of the event to track
 */
export function trackHotjarEvent(eventName: string): void {
  if (!isHotjarAvailable()) {
    console.warn('[Hotjar] Not available, event not tracked:', eventName);
    return;
  }

  try {
    window.hj?.('event', eventName);
    console.log('[Hotjar] Event tracked:', eventName);
  } catch (error) {
    console.error('[Hotjar] Error tracking event:', error);
  }
}

/**
 * Set user attributes for Hotjar session identification
 * @param attributes - Object containing user attributes
 */
export function setHotjarUserAttributes(attributes: Record<string, any>): void {
  if (!isHotjarAvailable()) {
    console.warn('[Hotjar] Not available, attributes not set');
    return;
  }

  try {
    window.hj?.('identify', null, attributes);
    console.log('[Hotjar] User attributes set:', attributes);
  } catch (error) {
    console.error('[Hotjar] Error setting user attributes:', error);
  }
}

/**
 * Trigger a Hotjar survey/poll by ID
 * @param surveyId - The ID of the survey to trigger
 */
export function triggerHotjarSurvey(surveyId: string): void {
  if (!isHotjarAvailable()) {
    console.warn('[Hotjar] Not available, survey not triggered');
    return;
  }

  try {
    window.hj?.('trigger', surveyId);
    console.log('[Hotjar] Survey triggered:', surveyId);
  } catch (error) {
    console.error('[Hotjar] Error triggering survey:', error);
  }
}

/**
 * Add tags to the current Hotjar session for filtering
 * @param tags - Array of tags to add
 */
export function tagHotjarSession(tags: string[]): void {
  if (!isHotjarAvailable()) {
    console.warn('[Hotjar] Not available, tags not added');
    return;
  }

  try {
    tags.forEach(tag => {
      window.hj?.('tagRecording', [tag]);
    });
    console.log('[Hotjar] Session tagged with:', tags);
  } catch (error) {
    console.error('[Hotjar] Error tagging session:', error);
  }
}

/**
 * Hotjar tracking helper object with common PawPop events
 */
export const hotjar = {
  // Check availability
  isAvailable: isHotjarAvailable,

  // Landing page events
  landingPage: {
    viewed: () => trackHotjarEvent('landing_page_viewed'),
    ctaClicked: () => trackHotjarEvent('landing_cta_clicked'),
    whyPawPopOpened: () => trackHotjarEvent('why_pawpop_opened'),
  },

  // Upload flow events
  upload: {
    modalOpened: () => trackHotjarEvent('upload_modal_opened'),
    photoUploaded: () => trackHotjarEvent('photo_uploaded'),
    formSubmitted: () => trackHotjarEvent('upload_form_submitted'),
    generationStarted: () => trackHotjarEvent('generation_started'),
    generationCompleted: () => trackHotjarEvent('generation_completed'),
    error: (errorType: string) => trackHotjarEvent(`upload_error_${errorType}`),
  },

  // Artwork page events
  artwork: {
    pageViewed: () => trackHotjarEvent('artwork_page_viewed'),
    imageLoaded: () => trackHotjarEvent('artwork_image_loaded'),
    ctaClicked: () => trackHotjarEvent('artwork_cta_clicked'),
  },

  // Purchase flow events
  purchase: {
    modalOpened: () => trackHotjarEvent('purchase_modal_opened'),
    productSelected: (productType: string) => trackHotjarEvent(`product_selected_${productType}`),
    checkoutStarted: () => trackHotjarEvent('checkout_started'),
    checkoutCompleted: () => trackHotjarEvent('checkout_completed'),
    error: () => trackHotjarEvent('checkout_error'),
  },

  // User attributes
  setUser: (attributes: {
    priceVariant?: string;
    customerEmail?: string;
    hasCompletedGeneration?: boolean;
    hasPurchased?: boolean;
  }) => setHotjarUserAttributes(attributes),

  // Session tagging
  tagSession: (tags: string[]) => tagHotjarSession(tags),

  // Survey triggering
  triggerSurvey: (surveyId: string) => triggerHotjarSurvey(surveyId),
};
