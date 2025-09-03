// src/components/modals/PurchaseModalRouter.tsx
'use client';

import { PurchaseModalDigitalFirst } from './PurchaseModalDigitalFirst';
import { PurchaseModalEqualTiers } from './PurchaseModalEqualTiers';
import { PurchaseModalPhysicalFirst } from './PurchaseModalPhysicalFirst';

export type ModalVariant = 'digital-first' | 'equal-tiers' | 'physical-first';

interface PurchaseModalRouterProps {
  isOpen: boolean;
  onClose: () => void;
  variant: ModalVariant;
  artwork: {
    id: string;
    generated_image_url: string;
    customer_name: string;
    customer_email: string;
    pet_name?: string;
  };
}

export const PurchaseModalRouter = ({ variant, ...props }: PurchaseModalRouterProps) => {
  switch (variant) {
    case 'digital-first':
      return <PurchaseModalDigitalFirst {...props} />;
    case 'equal-tiers':
      return <PurchaseModalEqualTiers {...props} />;
    case 'physical-first':
      return <PurchaseModalPhysicalFirst {...props} />;
    default:
      return <PurchaseModalEqualTiers {...props} />;
  }
};

// A/B Testing Helper
export const getModalVariant = (): ModalVariant => {
  // Simple hash-based A/B testing using session storage
  if (typeof window === 'undefined') return 'equal-tiers';
  
  let variant = sessionStorage.getItem('modal-variant') as ModalVariant;
  
  if (!variant) {
    // Distribute evenly across 3 variants
    const hash = Math.abs(
      Array.from(crypto.getRandomValues(new Uint8Array(4)))
        .reduce((acc, byte) => acc + byte, 0)
    );
    
    const variants: ModalVariant[] = ['digital-first', 'equal-tiers', 'physical-first'];
    variant = variants[hash % 3];
    
    sessionStorage.setItem('modal-variant', variant);
  }
  
  return variant;
};

// Analytics tracking helper
export const trackModalVariant = (variant: ModalVariant, event: string, metadata?: any) => {
  // Track with your analytics provider (GA, Mixpanel, etc.)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, {
      modal_variant: variant,
      ...metadata
    });
  }
  
  console.log(`Modal A/B Test - ${variant}: ${event}`, metadata);
};
