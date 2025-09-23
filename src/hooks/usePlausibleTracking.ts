// src/hooks/usePlausibleTracking.ts

'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { 
  trackEvent, 
  trackRevenue, 
  trackFunnelStep, 
  trackConversion,
  trackVariantExposure,
  getPriceVariant,
  getPriceConfig 
} from '@/lib/plausible';

/**
 * Custom hook for Plausible Analytics tracking with A/B testing support
 */
export function usePlausibleTracking() {
  const pathname = usePathname();

  // Track page changes
  useEffect(() => {
    trackEvent('Page View', {
      path: pathname,
      timestamp: new Date().toISOString()
    });
  }, [pathname]);

  // Funnel tracking functions
  const trackFunnel = useCallback(() => ({
    // Step 1: Landing page visit
    landingPageView: () => trackFunnelStep('Landing Page View', 1, { path: pathname }),
    
    // Step 2: Upload modal opened
    uploadModalOpened: () => trackFunnelStep('Upload Modal Opened', 2),
    
    // Step 3: Photo uploaded
    photoUploaded: (fileSize?: number, fileType?: string) => {
      const props: Record<string, string | number | boolean> = {};
      if (fileSize !== undefined) props.file_size = fileSize;
      if (fileType !== undefined) props.file_type = fileType;
      trackFunnelStep('Photo Uploaded', 3, props);
    },
    
    // Step 4: Artwork generation started
    artworkGenerationStarted: () => trackFunnelStep('Artwork Generation Started', 4),
    
    // Step 5: Artwork completed
    artworkCompleted: (generationTime?: number) => {
      const props: Record<string, string | number | boolean> = {};
      if (generationTime !== undefined) props.generation_time_seconds = generationTime;
      trackFunnelStep('Artwork Completed', 5, props);
    },
    
    // Step 6: Artwork page viewed
    artworkPageViewed: (artworkId?: string) => {
      const props: Record<string, string | number | boolean> = {};
      if (artworkId !== undefined) props.artwork_id = artworkId;
      trackFunnelStep('Artwork Page Viewed', 6, props);
    },
    
    // Step 7: Purchase modal opened
    purchaseModalOpened: (productType?: string) => {
      const props: Record<string, string | number | boolean> = {};
      if (productType !== undefined) props.product_type = productType;
      trackFunnelStep('Purchase Modal Opened', 7, props);
    },
    
    // Step 8: Product selected
    productSelected: (productType: string, price: number) => trackFunnelStep('Product Selected', 8, {
      product_type: productType,
      price: price
    }),
    
    // Step 9: Checkout initiated
    checkoutInitiated: (productType: string, price: number, quantity?: number) => trackFunnelStep('Checkout Initiated', 9, {
      product_type: productType,
      price: price,
      quantity: quantity || 1
    }),
    
    // Step 10: Purchase completed
    purchaseCompleted: (productType: string, price: number, orderId?: string) => {
      const props: Record<string, string | number | boolean> = {
        product_type: productType,
        price: price
      };
      if (orderId !== undefined) props.order_id = orderId;
      
      trackFunnelStep('Purchase Completed', 10, props);
      
      // Also track as conversion with revenue
      trackConversion('Purchase', price, props);
    }
  }), [pathname]);

  // Price variant exposure tracking
  const trackPriceExposure = useCallback((element: string, productType?: string, price?: number) => {
    const config = getPriceConfig();
    const props: Record<string, string | number | boolean> = {
      variant_digital_price: config.digital,
      variant_print_price: config.print,
      variant_canvas_price: config.canvas
    };
    if (productType !== undefined) props.product_type = productType;
    if (price !== undefined) props.displayed_price = price;
    
    trackVariantExposure(element, props);
  }, []);

  // User interaction tracking
  const trackInteraction = useCallback(() => ({
    // Button clicks
    buttonClick: (buttonName: string, location: string) => trackEvent('Button Click', {
      button_name: buttonName,
      location: location,
      path: pathname
    }),
    
    // Form interactions
    formStart: (formName: string) => trackEvent('Form Started', {
      form_name: formName,
      path: pathname
    }),
    
    formComplete: (formName: string, timeSpent?: number) => {
      const props: Record<string, string | number | boolean> = {
        form_name: formName,
        path: pathname
      };
      if (timeSpent !== undefined) props.time_spent_seconds = timeSpent;
      trackEvent('Form Completed', props);
    },
    
    // Modal interactions
    modalOpen: (modalName: string) => trackEvent('Modal Opened', {
      modal_name: modalName,
      path: pathname
    }),
    
    modalClose: (modalName: string, timeSpent?: number) => {
      const props: Record<string, string | number | boolean> = {
        modal_name: modalName,
        path: pathname
      };
      if (timeSpent !== undefined) props.time_spent_seconds = timeSpent;
      trackEvent('Modal Closed', props);
    },
    
    // Error tracking
    error: (errorType: string, errorMessage?: string) => {
      const props: Record<string, string | number | boolean> = {
        error_type: errorType,
        path: pathname
      };
      if (errorMessage !== undefined) props.error_message = errorMessage;
      trackEvent('Error Occurred', props);
    },
    
    // Feature usage
    featureUsed: (featureName: string, details?: Record<string, string | number | boolean>) => trackEvent('Feature Used', {
      feature_name: featureName,
      path: pathname,
      ...details
    })
  }), [pathname]);

  // Performance tracking
  const trackPerformance = useCallback(() => ({
    // Page load time
    pageLoad: (loadTime: number) => trackEvent('Page Load Performance', {
      load_time_ms: loadTime,
      path: pathname
    }),
    
    // API response time
    apiCall: (endpoint: string, responseTime: number, success: boolean) => trackEvent('API Performance', {
      endpoint: endpoint,
      response_time_ms: responseTime,
      success: success,
      path: pathname
    }),
    
    // Image generation time
    imageGeneration: (generationType: string, generationTime: number, success: boolean) => trackEvent('Image Generation Performance', {
      generation_type: generationType,
      generation_time_seconds: generationTime,
      success: success
    })
  }), [pathname]);

  // A/B test specific tracking
  const trackABTest = useCallback(() => ({
    // Variant assignment
    variantAssigned: (testName: string, variant: string) => trackEvent('AB Test Variant Assigned', {
      test_name: testName,
      variant: variant
    }),
    
    // Variant exposure
    variantExposed: (testName: string, variant: string, element: string) => trackEvent('AB Test Variant Exposed', {
      test_name: testName,
      variant: variant,
      element: element,
      path: pathname
    }),
    
    // Variant conversion
    variantConversion: (testName: string, variant: string, conversionType: string, value?: number) => {
      if (value !== undefined) {
        trackRevenue('AB Test Conversion', value, 'USD', {
          test_name: testName,
          variant: variant,
          conversion_type: conversionType
        });
      } else {
        trackEvent('AB Test Conversion', {
          test_name: testName,
          variant: variant,
          conversion_type: conversionType
        });
      }
    }
  }), [pathname]);

  return {
    // Core tracking functions
    trackEvent,
    trackRevenue,
    trackConversion,
    
    // Funnel tracking
    trackFunnel: trackFunnel(),
    
    // Price variant tracking
    trackPriceExposure,
    getPriceVariant,
    getPriceConfig,
    
    // Interaction tracking
    trackInteraction: trackInteraction(),
    
    // Performance tracking
    trackPerformance: trackPerformance(),
    
    // A/B test tracking
    trackABTest: trackABTest(),
    
    // Current page
    currentPath: pathname
  };
}

export default usePlausibleTracking;
