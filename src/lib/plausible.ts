// src/lib/plausible.ts

/**
 * Plausible Analytics integration with A/B testing for price variants
 * Runs alongside Google Ads tracking for comprehensive analytics
 */

declare global {
  interface Window {
    plausible?: {
      (eventName: string, options?: { 
        props?: Record<string, string | number | boolean>;
        revenue?: { currency: string; amount: number };
      }): void;
      q?: any[];
    } & ((eventName: string, options?: { 
      props?: Record<string, string | number | boolean>;
      revenue?: { currency: string; amount: number };
    }) => void);
  }
}

interface PlausibleEventOptions {
  props?: Record<string, string | number | boolean>;
  revenue?: {
    currency: string;
    amount: number;
  };
  callback?: () => void;
}

interface PlausiblePageviewOptions {
  u?: string; // Custom URL
  referrer?: string;
}

// Price variant configuration
export type PriceVariant = 'A' | 'B';

export interface PriceVariantConfig {
  variant: PriceVariant;
  digital: number;
  print: number;
  printMid: number;
  printLarge: number;
  canvas: number;
  canvasMid: number;
  canvasLarge: number;
  canvasFramed: number;
  canvasFramedMid: number;
  canvasFramedLarge: number;
  label: string;
}

export const PRICE_VARIANTS = {
  A: {
    variant: 'A' as const,
    digital: 15,        // PRODUCT_A.md: $15.00 CAD
    print: 39,          // PRODUCT_A.md: $39.00 CAD (12x18 size) - UPDATED
    printMid: 49,       // PRODUCT_A.md: $49.00 CAD (18x24 size) - UPDATED
    printLarge: 59,     // PRODUCT_A.md: $59.00 CAD (20x30 size) - UPDATED
    canvas: 59,         // PRODUCT_A.md: $59.00 CAD (12x18 stretched)
    canvasMid: 79,      // PRODUCT_A.md: $79.00 CAD (16x24 stretched)
    canvasLarge: 99,    // PRODUCT_A.md: $99.00 CAD (20x30 stretched)
    canvasFramed: 99,   // PRODUCT_A.md: $99.00 CAD (12x18 framed)
    canvasFramedMid: 119, // PRODUCT_A.md: $119.00 CAD (16x24 framed)
    canvasFramedLarge: 149, // PRODUCT_A.md: $149.00 CAD (20x30 framed)
    label: 'Standard Pricing'
  },
  B: {
    variant: 'B' as const,
    digital: 45,        // PRODUCT_B.md: $45.00 CAD
    print: 79,          // PRODUCT_B.md: $79.00 CAD (12x18 size)
    printMid: 95,       // PRODUCT_B.md: $95.00 CAD (18x24 size)
    printLarge: 115,    // PRODUCT_B.md: $115.00 CAD (20x30 size)
    canvas: 95,         // PRODUCT_B.md: $95.00 CAD (12x18 stretched)
    canvasMid: 135,     // PRODUCT_B.md: $135.00 CAD (16x24 stretched)
    canvasLarge: 175,   // PRODUCT_B.md: $175.00 CAD (20x30 stretched)
    canvasFramed: 145,  // PRODUCT_B.md: $145.00 CAD (12x18 framed)
    canvasFramedMid: 185, // PRODUCT_B.md: $185.00 CAD (16x24 framed)
    canvasFramedLarge: 225, // PRODUCT_B.md: $225.00 CAD (20x30 framed)
    label: 'Premium Pricing'
  }
} as const;

// Local storage key for persistent variant assignment
const VARIANT_STORAGE_KEY = 'pawpop_price_variant';
const VARIANT_EXPIRY_KEY = 'pawpop_price_variant_expiry';
const VARIANT_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

class PlausibleAnalytics {
  private isEnabled: boolean = false;
  private domain: string = '';
  private currentVariant: PriceVariant | null = null;

  constructor() {
    this.isEnabled = typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
    this.domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || '';
    
    if (this.isEnabled) {
      this.initializePriceVariant();
    }
  }

  /**
   * Ensure plausible is initialized and available
   */
  private ensurePlausible(): void {
    if (typeof window !== 'undefined' && !window.plausible) {
      const plausibleFn = function() { 
        (plausibleFn.q = plausibleFn.q || []).push(arguments) 
      } as any;
      plausibleFn.q = [];
      window.plausible = plausibleFn;
    }
  }

  /**
   * Initialize or retrieve persistent price variant assignment
   */
  private initializePriceVariant(): void {
    if (typeof window === 'undefined') return;

    try {
      const storedVariant = localStorage.getItem(VARIANT_STORAGE_KEY);
      const storedExpiry = localStorage.getItem(VARIANT_EXPIRY_KEY);
      const now = Date.now();

      // Check if stored variant is still valid
      if (storedVariant && storedExpiry && now < parseInt(storedExpiry)) {
        this.currentVariant = storedVariant as PriceVariant;
        console.log(`[Plausible] Using stored price variant: ${this.currentVariant}`);
        return;
      }

      // Assign new variant (50/50 split)
      this.currentVariant = Math.random() < 0.5 ? 'A' : 'B';
      
      // Store variant with expiry
      localStorage.setItem(VARIANT_STORAGE_KEY, this.currentVariant);
      localStorage.setItem(VARIANT_EXPIRY_KEY, (now + VARIANT_DURATION).toString());
      
      console.log(`[Plausible] Assigned new price variant: ${this.currentVariant}`);
      
      // Track variant assignment
      this.trackEvent('Price Variant Assigned', {
        variant: this.currentVariant,
        label: PRICE_VARIANTS[this.currentVariant].label
      });
      
    } catch (error) {
      console.error('[Plausible] Error initializing price variant:', error);
      this.currentVariant = 'A'; // Fallback to variant A
    }
  }

  /**
   * Get current price variant
   */
  getPriceVariant(): PriceVariant {
    if (!this.currentVariant) {
      this.initializePriceVariant();
    }
    return this.currentVariant || 'A';
  }

  /**
   * Get price configuration for current variant
   */
  getPriceConfig(): PriceVariantConfig {
    const variant = this.getPriceVariant();
    return PRICE_VARIANTS[variant];
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, props?: Record<string, string | number | boolean>): void {
    if (!this.isEnabled || typeof window === 'undefined') {
      console.log(`[Plausible] Event: ${eventName}`, props);
      return;
    }

    try {
      // Always include price variant in event props
      const eventProps = {
        ...props,
        price_variant: this.getPriceVariant(),
        variant_label: PRICE_VARIANTS[this.getPriceVariant()].label
      };

      // Ensure plausible is available
      this.ensurePlausible();
      
      // Track the event (will be queued if script not loaded yet)
      window.plausible!(eventName, { props: eventProps });
      console.log(`[Plausible] Event tracked: ${eventName}`, eventProps);
    } catch (error) {
      console.error('[Plausible] Error tracking event:', error);
    }
  }

  /**
   * Track revenue event
   */
  trackRevenue(eventName: string, amount: number, currency: string = 'USD', props?: Record<string, string | number | boolean>): void {
    if (!this.isEnabled || typeof window === 'undefined') {
      console.log(`[Plausible] Revenue Event: ${eventName}`, { amount, currency, props });
      return;
    }

    try {
      const eventProps = {
        ...props,
        price_variant: this.getPriceVariant(),
        variant_label: PRICE_VARIANTS[this.getPriceVariant()].label,
        amount,
        currency
      };

      // Ensure plausible is available
      this.ensurePlausible();

      window.plausible!(eventName, {
        props: eventProps,
        revenue: { currency, amount }
      });
      
      console.log(`[Plausible] Revenue tracked: ${eventName}`, eventProps);
    } catch (error) {
      console.error('[Plausible] Error tracking revenue:', error);
    }
  }

  /**
   * Track pageview with custom properties
   */
  trackPageview(url?: string, props?: Record<string, string | number | boolean>): void {
    if (!this.isEnabled || typeof window === 'undefined') {
      console.log(`[Plausible] Pageview: ${url || 'current page'}`, props);
      return;
    }

    try {
      const eventProps = {
        ...props,
        price_variant: this.getPriceVariant(),
        variant_label: PRICE_VARIANTS[this.getPriceVariant()].label
      };

      // Ensure plausible is available
      this.ensurePlausible();

      // Plausible automatically tracks pageviews, but we can send custom props
      window.plausible!('pageview', { props: eventProps });
      console.log(`[Plausible] Pageview tracked with props:`, eventProps);
    } catch (error) {
      console.error('[Plausible] Error tracking pageview:', error);
    }
  }

  /**
   * Funnel step tracking
   */
  trackFunnelStep(step: string, stepNumber: number, props?: Record<string, string | number | boolean>): void {
    this.trackEvent('Funnel Step', {
      step,
      step_number: stepNumber,
      ...props
    });
  }

  /**
   * Conversion tracking with price variant context
   */
  trackConversion(conversionType: string, value?: number, props?: Record<string, string | number | boolean>): void {
    const config = this.getPriceConfig();
    
    if (value !== undefined) {
      this.trackRevenue(`Conversion: ${conversionType}`, value, 'USD', {
        conversion_type: conversionType,
        digital_price: config.digital,
        print_price: config.print,
        canvas_price: config.canvas,
        ...props
      });
    } else {
      this.trackEvent(`Conversion: ${conversionType}`, {
        conversion_type: conversionType,
        digital_price: config.digital,
        print_price: config.print,
        canvas_price: config.canvas,
        ...props
      });
    }
  }

  /**
   * Track variant exposure for A/B testing
   */
  trackVariantExposure(element: string, props?: Record<string, string | number | boolean>): void {
    this.trackEvent('Variant Exposure', {
      element,
      variant: this.getPriceVariant(),
      variant_label: PRICE_VARIANTS[this.getPriceVariant()].label,
      ...props
    });
  }

  /**
   * Track file downloads (enhanced script feature)
   */
  trackFileDownload(fileName: string, fileType: string, props?: Record<string, string | number | boolean>): void {
    this.trackEvent('File Download', {
      file_name: fileName,
      file_type: fileType,
      ...props
    });
  }

  /**
   * Track outbound link clicks (enhanced script feature)
   */
  trackOutboundLink(url: string, props?: Record<string, string | number | boolean>): void {
    this.trackEvent('Outbound Link', {
      url,
      ...props
    });
  }

  /**
   * Track tagged events with custom properties (enhanced script feature)
   */
  trackTaggedEvent(eventName: string, props?: Record<string, string | number | boolean>): void {
    if (!this.isEnabled || typeof window === 'undefined') {
      console.log(`[Plausible] Tagged Event: ${eventName}`, props);
      return;
    }

    try {
      // Use plausible() directly for tagged events with enhanced features
      const eventProps = {
        ...props,
        price_variant: this.getPriceVariant(),
        variant_label: PRICE_VARIANTS[this.getPriceVariant()].label
      };

      // Ensure plausible is available
      this.ensurePlausible();

      window.plausible!(eventName, { props: eventProps });
      console.log(`[Plausible] Tagged Event: ${eventName}`, eventProps);
    } catch (error) {
      console.error('[Plausible] Error tracking tagged event:', error);
    }
  }

  /**
   * Force variant assignment (for testing)
   */
  forceVariant(variant: PriceVariant): void {
    if (typeof window === 'undefined') return;
    
    this.currentVariant = variant;
    localStorage.setItem(VARIANT_STORAGE_KEY, variant);
    localStorage.setItem(VARIANT_EXPIRY_KEY, (Date.now() + VARIANT_DURATION).toString());
  }

  /**
   * Initialize for testing environment
   */
  initializeForTesting(domain: string = 'pawpopart.com'): void {
    this.isEnabled = true;
    this.domain = domain;
    this.initializePriceVariant();
  }

  /**
   * Clear variant assignment (for testing)
   */
  clearVariant(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(VARIANT_STORAGE_KEY);
    localStorage.removeItem(VARIANT_EXPIRY_KEY);
    this.currentVariant = null;
    
    console.log('[Plausible] Cleared price variant assignment');
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary(): {
    isEnabled: boolean;
    domain: string;
    currentVariant: PriceVariant | null;
    priceConfig: PriceVariantConfig;
  } {
    return {
      isEnabled: this.isEnabled,
      domain: this.domain,
      currentVariant: this.currentVariant,
      priceConfig: this.getPriceConfig()
    };
  }
}

// Singleton instance
export const plausible = new PlausibleAnalytics();

// Convenience functions for common tracking
export const trackEvent = (eventName: string, props?: Record<string, string | number | boolean>) => 
  plausible.trackEvent(eventName, props);

export const trackRevenue = (eventName: string, amount: number, currency?: string, props?: Record<string, string | number | boolean>) => 
  plausible.trackRevenue(eventName, amount, currency, props);

export const trackPageview = (url?: string, props?: Record<string, string | number | boolean>) => 
  plausible.trackPageview(url, props);

export const trackFunnelStep = (step: string, stepNumber: number, props?: Record<string, string | number | boolean>) => 
  plausible.trackFunnelStep(step, stepNumber, props);

export const trackConversion = (conversionType: string, value?: number, props?: Record<string, string | number | boolean>) => 
  plausible.trackConversion(conversionType, value, props);

export const trackVariantExposure = (element: string, props?: Record<string, string | number | boolean>) => 
  plausible.trackVariantExposure(element, props);

export const trackFileDownload = (fileName: string, fileType: string, props?: Record<string, string | number | boolean>) => 
  plausible.trackFileDownload(fileName, fileType, props);

export const trackOutboundLink = (url: string, props?: Record<string, string | number | boolean>) => 
  plausible.trackOutboundLink(url, props);

export const trackTaggedEvent = (eventName: string, props?: Record<string, string | number | boolean>) => 
  plausible.trackTaggedEvent(eventName, props);

export const getPriceVariant = () => plausible.getPriceVariant();
export const getPriceConfig = () => plausible.getPriceConfig();

// Export for testing
export const plausibleTestUtils = {
  forceVariant: (variant: PriceVariant) => plausible.forceVariant(variant),
  clearVariant: () => plausible.clearVariant(),
  getAnalyticsSummary: () => plausible.getAnalyticsSummary(),
  initializeForTesting: (domain?: string) => plausible.initializeForTesting(domain)
};

export default plausible;
