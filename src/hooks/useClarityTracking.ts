'use client';

import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { clarity, setTag, setTags, trackEvent, upgradeSession } from '@/lib/clarity';
import { plausible } from '@/lib/plausible';

/**
 * Custom hook for Microsoft Clarity tracking with Plausible integration
 * Provides session recording tags and event tracking
 */
export function useClarityTracking() {
  const pathname = usePathname();

  // Track page navigation with tags
  useEffect(() => {
    if (!clarity.isEnabled()) return;

    // Update page tag on navigation
    setTag('current_page', pathname);
  }, [pathname]);

  // Set price variant tags
  const setPriceVariantTags = useCallback(() => {
    try {
      const priceVariant = plausible.getPriceVariant();
      const priceConfig = plausible.getPriceConfig();

      setTags({
        price_variant: priceVariant,
        variant_label: priceConfig.label,
        digital_price: priceConfig.digital,
        print_price: priceConfig.print,
        canvas_price: priceConfig.canvas
      });
    } catch (error) {
      console.error('[Clarity Hook] Error setting price variant tags:', error);
    }
  }, []);

  // Track funnel steps
  const trackFunnel = useCallback(() => ({
    uploadModalOpened: () => {
      trackEvent('upload_modal_opened');
      setTag('funnel_step', 'upload_modal');
    },

    photoUploaded: (fileType?: string, fileSize?: number) => {
      trackEvent('photo_uploaded');
      setTag('funnel_step', 'photo_uploaded');
      if (fileType) setTag('upload_file_type', fileType);
      if (fileSize) setTag('upload_file_size_mb', Math.round(fileSize / (1024 * 1024)));
    },

    artworkGenerationStarted: () => {
      trackEvent('artwork_generation_started');
      setTag('funnel_step', 'generation_started');
    },

    artworkCompleted: (generationTime?: number) => {
      trackEvent('artwork_completed');
      setTag('funnel_step', 'artwork_completed');
      if (generationTime) setTag('generation_time_seconds', Math.round(generationTime));
      // Upgrade session for users who complete artwork generation
      upgradeSession('artwork_completed');
    },

    artworkPageViewed: (artworkId?: string) => {
      trackEvent('artwork_page_viewed');
      setTag('funnel_step', 'artwork_page_viewed');
      if (artworkId) setTag('current_artwork_id', artworkId);
    },

    purchaseModalOpened: (productType?: string) => {
      trackEvent('purchase_modal_opened');
      setTag('funnel_step', 'purchase_modal');
      if (productType) setTag('selected_product_type', productType);
    },

    productSelected: (productType: string, price: number) => {
      trackEvent('product_selected');
      setTags({
        funnel_step: 'product_selected',
        selected_product_type: productType,
        selected_price: price
      });
    },

    checkoutInitiated: (productType: string, price: number) => {
      trackEvent('checkout_initiated');
      setTags({
        funnel_step: 'checkout_initiated',
        checkout_product_type: productType,
        checkout_price: price
      });
      // Upgrade session for users who initiate checkout
      upgradeSession('checkout_initiated');
    },

    purchaseCompleted: (orderId: string, productType: string, price: number) => {
      trackEvent('purchase_completed');
      setTags({
        funnel_step: 'purchase_completed',
        order_id: orderId,
        purchased_product_type: productType,
        purchased_price: price,
        is_customer: 'true'
      });
      // Upgrade session for paying customers
      upgradeSession('purchase_completed');
    }
  }), []);

  // Track user interactions
  const trackInteraction = useCallback(() => ({
    buttonClick: (buttonName: string, location: string) => {
      trackEvent('button_clicked');
      setTags({
        last_button_clicked: buttonName,
        button_location: location
      });
    },

    modalOpened: (modalName: string) => {
      trackEvent(`modal_opened_${modalName}`);
      setTag('current_modal', modalName);
    },

    modalClosed: (modalName: string) => {
      trackEvent(`modal_closed_${modalName}`);
      setTag('current_modal', 'none');
    },

    formStarted: (formName: string) => {
      trackEvent('form_started');
      setTag('current_form', formName);
    },

    formCompleted: (formName: string) => {
      trackEvent('form_completed');
      setTag('form_completed', formName);
    },

    errorOccurred: (errorType: string, errorMessage?: string) => {
      trackEvent('error_occurred');
      setTags({
        last_error_type: errorType,
        last_error_page: pathname
      });
      if (errorMessage) {
        setTag('last_error_message', errorMessage.substring(0, 100)); // Limit length
      }
      // Upgrade session to prioritize error investigation
      upgradeSession('error_occurred');
    }
  }), [pathname]);

  // Track performance issues
  const trackPerformance = useCallback(() => ({
    slowLoad: (loadTime: number) => {
      if (loadTime > 3000) { // Over 3 seconds
        trackEvent('slow_page_load');
        setTags({
          slow_load: 'true',
          page_load_time_seconds: Math.round(loadTime / 1000)
        });
        upgradeSession('slow_page_load');
      }
    },

    slowApiCall: (endpoint: string, responseTime: number) => {
      if (responseTime > 5000) { // Over 5 seconds
        trackEvent('slow_api_call');
        setTags({
          slow_api: 'true',
          slow_api_endpoint: endpoint,
          api_response_time_seconds: Math.round(responseTime / 1000)
        });
      }
    },

    generationTimeout: (generationType: string) => {
      trackEvent('generation_timeout');
      setTags({
        generation_failed: 'true',
        failed_generation_type: generationType
      });
      upgradeSession('generation_timeout');
    }
  }), []);

  // Track user segment tags
  const setUserSegment = useCallback((segment: string) => {
    setTag('user_segment', segment);
  }, []);

  return {
    // Core functions
    setTag,
    setTags,
    trackEvent,
    upgradeSession,

    // Price variant tracking
    setPriceVariantTags,

    // Funnel tracking
    trackFunnel: trackFunnel(),

    // Interaction tracking
    trackInteraction: trackInteraction(),

    // Performance tracking
    trackPerformance: trackPerformance(),

    // User segmentation
    setUserSegment,

    // Utility
    isEnabled: clarity.isEnabled(),
    currentPath: pathname
  };
}

export default useClarityTracking;
