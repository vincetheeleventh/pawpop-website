// src/lib/product-config.ts

/**
 * Dynamic product configuration that adapts to A/B test pricing variants
 * Integrates with Plausible Analytics for price testing
 */

import { PRICE_VARIANTS, type PriceVariant } from './plausible';

export interface ProductConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  mpn: string;
  images: string[];
  shippingWeight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'in' | 'cm';
  };
  variants: ProductVariantConfig[];
}

export interface ProductVariantConfig {
  id: string;
  name: string;
  sku: string;
  attributes: {
    size?: string;
    material?: string;
    format?: string;
  };
  // Pricing is dynamic based on A/B test variant
  getPriceForVariant: (variant: PriceVariant) => number;
}

// Base product configurations (pricing is dynamic)
export const PRODUCT_CONFIGS: Record<string, ProductConfig> = {
  digital: {
    id: 'pawpop-digital-portrait',
    name: 'Custom Pet Renaissance Portrait - Digital Masterpiece',
    description: 'Transform your beloved pet into a stunning Renaissance masterpiece! Our artists create a unique, personalized digital portrait that captures your pet\'s personality in classical artistic style. High-resolution file suitable for printing.',
    category: 'Art & Collectibles > Personalized Art',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-DIGITAL-001',
    images: [
      '/images/pawpop-digital-sample-1.jpg',
      '/images/pawpop-digital-sample-2.jpg',
      '/images/pawpop-digital-sample-3.jpg'
    ],
    variants: [
      {
        id: 'digital-standard',
        name: 'High Resolution Digital Download',
        sku: 'PAWPOP-DIG-STD',
        attributes: {
          format: 'Digital Download',
          size: 'High Resolution (300 DPI)'
        },
        getPriceForVariant: (variant) => PRICE_VARIANTS[variant].digital * 100 // Convert to cents
      }
    ]
  },

  art_print_12x18: {
    id: 'pawpop-art-print-12x18',
    name: 'Custom Pet Renaissance Portrait - Fine Art Print 12"×18"',
    description: 'Your pet\'s Renaissance portrait printed on museum-quality fine art paper (285 g/m²)! This 12"×18" art print features archival inks for lasting beauty.',
    category: 'Art & Collectibles > Art Prints',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-PRINT-12X18',
    images: [
      '/images/pawpop-print-12x18-sample.jpg',
      '/images/print-texture-detail.jpg'
    ],
    shippingWeight: 0.5,
    dimensions: {
      length: 18,
      width: 12,
      height: 0.1,
      unit: 'in'
    },
    variants: [
      {
        id: 'print-12x18-standard',
        name: '12"×18" Fine Art Print',
        sku: 'PAWPOP-PRT-12X18',
        attributes: {
          size: '12"×18"',
          material: 'Fine Art Paper (285 g/m²)'
        },
        getPriceForVariant: (variant) => PRICE_VARIANTS[variant].print * 100
      }
    ]
  },

  art_print_18x24: {
    id: 'pawpop-art-print-18x24',
    name: 'Custom Pet Renaissance Portrait - Fine Art Print 18"×24"',
    description: 'Your pet\'s Renaissance portrait printed on museum-quality fine art paper (285 g/m²)! This 18"×24" art print makes a beautiful statement piece with archival inks.',
    category: 'Art & Collectibles > Art Prints',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-PRINT-18X24',
    images: [
      '/images/pawpop-print-18x24-sample.jpg',
      '/images/print-texture-detail.jpg'
    ],
    shippingWeight: 0.8,
    dimensions: {
      length: 24,
      width: 18,
      height: 0.1,
      unit: 'in'
    },
    variants: [
      {
        id: 'print-18x24-standard',
        name: '18"×24" Fine Art Print',
        sku: 'PAWPOP-PRT-18X24',
        attributes: {
          size: '18"×24"',
          material: 'Fine Art Paper (285 g/m²)'
        },
        getPriceForVariant: (variant) => PRICE_VARIANTS[variant].printMid * 100
      }
    ]
  },

  art_print_20x30: {
    id: 'pawpop-art-print-20x30',
    name: 'Custom Pet Renaissance Portrait - Fine Art Print 20"×30"',
    description: 'Your pet\'s Renaissance portrait printed on museum-quality fine art paper (285 g/m²)! This large 20"×30" art print makes a bold statement piece with archival inks. Actual Mona Lisa size!',
    category: 'Art & Collectibles > Art Prints',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-PRINT-20X30',
    images: [
      '/images/pawpop-print-20x30-sample.jpg',
      '/images/print-texture-detail.jpg'
    ],
    shippingWeight: 1.2,
    dimensions: {
      length: 30,
      width: 20,
      height: 0.1,
      unit: 'in'
    },
    variants: [
      {
        id: 'print-20x30-standard',
        name: '20"×30" Fine Art Print',
        sku: 'PAWPOP-PRT-20X30',
        attributes: {
          size: '20"×30"',
          material: 'Fine Art Paper (285 g/m²)'
        },
        getPriceForVariant: (variant) => PRICE_VARIANTS[variant].printLarge * 100
      }
    ]
  },

  canvas_stretched_12x18: {
    id: 'pawpop-canvas-stretched-12x18',
    name: 'Custom Pet Renaissance Portrait - Stretched Canvas 12"×18"',
    description: 'Your pet\'s Renaissance portrait on premium stretched canvas! This 12"×18" gallery-wrapped canvas is hand-stretched over solid wood and ready to hang.',
    category: 'Art & Collectibles > Canvas Art',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-CANVAS-STR-12X18',
    images: [
      '/images/pawpop-canvas-stretched-12x18-sample.jpg',
      '/images/canvas-texture-detail.jpg'
    ],
    shippingWeight: 1.5,
    dimensions: {
      length: 18,
      width: 12,
      height: 1.25,
      unit: 'in'
    },
    variants: [
      {
        id: 'canvas-stretched-12x18',
        name: '12"×18" Stretched Canvas',
        sku: 'PAWPOP-CAN-STR-12X18',
        attributes: {
          size: '12"×18"',
          material: 'Stretched Canvas (1.25" depth)'
        },
        getPriceForVariant: (variant) => PRICE_VARIANTS[variant].canvas * 100
      }
    ]
  },

  canvas_stretched_16x24: {
    id: 'pawpop-canvas-stretched-16x24',
    name: 'Custom Pet Renaissance Portrait - Stretched Canvas 16"×24"',
    description: 'Your pet\'s Renaissance portrait on premium stretched canvas! This 16"×24" gallery-wrapped canvas makes a stunning statement piece, hand-stretched over solid wood.',
    category: 'Art & Collectibles > Canvas Art',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-CANVAS-STR-16X24',
    images: [
      '/images/pawpop-canvas-stretched-16x24-sample.jpg',
      '/images/canvas-texture-detail.jpg'
    ],
    shippingWeight: 2.5,
    dimensions: {
      length: 24,
      width: 16,
      height: 1.25,
      unit: 'in'
    },
    variants: [
      {
        id: 'canvas-stretched-16x24',
        name: '16"×24" Stretched Canvas',
        sku: 'PAWPOP-CAN-STR-16X24',
        attributes: {
          size: '16"×24"',
          material: 'Stretched Canvas (1.25" depth)'
        },
        getPriceForVariant: (variant) => PRICE_VARIANTS[variant].canvasMid * 100
      }
    ]
  },

  canvas_stretched_20x30: {
    id: 'pawpop-canvas-stretched-20x30',
    name: 'Custom Pet Renaissance Portrait - Stretched Canvas 20"×30"',
    description: 'Your pet\'s Renaissance portrait on premium stretched canvas! This large 20"×30" gallery-wrapped canvas is our premium offering, hand-stretched over solid wood. Actual Mona Lisa size!',
    category: 'Art & Collectibles > Canvas Art',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-CANVAS-STR-20X30',
    images: [
      '/images/pawpop-canvas-stretched-20x30-sample.jpg',
      '/images/canvas-texture-detail.jpg'
    ],
    shippingWeight: 4.0,
    dimensions: {
      length: 30,
      width: 20,
      height: 1.25,
      unit: 'in'
    },
    variants: [
      {
        id: 'canvas-stretched-20x30',
        name: '20"×30" Stretched Canvas',
        sku: 'PAWPOP-CAN-STR-20X30',
        attributes: {
          size: '20"×30"',
          material: 'Stretched Canvas (1.25" depth)'
        },
        getPriceForVariant: (variant) => PRICE_VARIANTS[variant].canvasLarge * 100
      }
    ]
  },

  canvas_framed_12x18: {
    id: 'pawpop-canvas-framed-12x18',
    name: 'Custom Pet Renaissance Portrait - Framed Canvas 12"×18"',
    description: 'Your pet\'s Renaissance portrait professionally printed on canvas and framed! This 12"×18" framed canvas comes ready to hang with premium multi-color frame and protective finish.',
    category: 'Art & Collectibles > Framed Canvas',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-CANVAS-FRM-12X18',
    images: [
      '/images/pawpop-canvas-framed-12x18-sample.jpg',
      '/images/canvas-frame-detail.jpg'
    ],
    shippingWeight: 3.0,
    dimensions: {
      length: 18,
      width: 12,
      height: 1.5,
      unit: 'in'
    },
    variants: [
      {
        id: 'canvas-framed-12x18',
        name: '12"×18" Framed Canvas',
        sku: 'PAWPOP-CAN-FRM-12X18',
        attributes: {
          size: '12"×18"',
          material: 'Canvas with Premium Frame'
        },
        getPriceForVariant: (variant) => PRICE_VARIANTS[variant].canvasFramed * 100
      }
    ]
  },

  canvas_framed_16x24: {
    id: 'pawpop-canvas-framed-16x24',
    name: 'Custom Pet Renaissance Portrait - Framed Canvas 16"×24"',
    description: 'Your pet\'s Renaissance portrait professionally printed on canvas and framed! This 16"×24" framed canvas makes a stunning statement piece with premium multi-color frame.',
    category: 'Art & Collectibles > Framed Canvas',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-CANVAS-FRM-16X24',
    images: [
      '/images/pawpop-canvas-framed-16x24-sample.jpg',
      '/images/canvas-frame-detail.jpg'
    ],
    shippingWeight: 5.0,
    dimensions: {
      length: 24,
      width: 16,
      height: 1.5,
      unit: 'in'
    },
    variants: [
      {
        id: 'canvas-framed-16x24',
        name: '16"×24" Framed Canvas',
        sku: 'PAWPOP-CAN-FRM-16X24',
        attributes: {
          size: '16"×24"',
          material: 'Canvas with Premium Frame'
        },
        getPriceForVariant: (variant) => PRICE_VARIANTS[variant].canvasFramedMid * 100
      }
    ]
  },

  canvas_framed_20x30: {
    id: 'pawpop-canvas-framed-20x30',
    name: 'Custom Pet Renaissance Portrait - Framed Canvas 20"×30"',
    description: 'Your pet\'s Renaissance portrait professionally printed on canvas and framed! This large 20"×30" framed canvas is our luxury offering with premium multi-color frame. Actual Mona Lisa size!',
    category: 'Art & Collectibles > Framed Canvas',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-CANVAS-FRM-20X30',
    images: [
      '/images/pawpop-canvas-framed-20x30-sample.jpg',
      '/images/canvas-frame-detail.jpg'
    ],
    shippingWeight: 7.0,
    dimensions: {
      length: 30,
      width: 20,
      height: 1.5,
      unit: 'in'
    },
    variants: [
      {
        id: 'canvas-framed-20x30',
        name: '20"×30" Framed Canvas',
        sku: 'PAWPOP-CAN-FRM-20X30',
        attributes: {
          size: '20"×30"',
          material: 'Canvas with Premium Frame'
        },
        getPriceForVariant: (variant) => PRICE_VARIANTS[variant].canvasFramedLarge * 100
      }
    ]
  }
};

/**
 * Get product configuration by type and size
 */
export function getProductConfig(productType: string, size?: string): ProductConfig | null {
  if (productType === 'digital') {
    return PRODUCT_CONFIGS.digital;
  }
  
  if (productType === 'art_print' && size) {
    const key = `art_print_${size.replace('x', 'x')}`;
    return PRODUCT_CONFIGS[key] || null;
  }
  
  if (productType === 'canvas_stretched' && size) {
    const key = `canvas_stretched_${size.replace('x', 'x')}`;
    return PRODUCT_CONFIGS[key] || null;
  }
  
  if (productType === 'canvas_framed' && size) {
    const key = `canvas_framed_${size.replace('x', 'x')}`;
    return PRODUCT_CONFIGS[key] || null;
  }
  
  return null;
}

/**
 * Get dynamic pricing for a product based on A/B test variant
 */
export function getProductPrice(productType: string, size: string, variant: PriceVariant): number {
  const config = getProductConfig(productType, size);
  if (!config || !config.variants[0]) {
    return 0;
  }
  
  return config.variants[0].getPriceForVariant(variant);
}

/**
 * Format price for display
 */
export function formatPrice(priceInCents: number, currency: string = 'CAD'): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: currency,
  }).format(priceInCents / 100);
}

/**
 * Get all available sizes for a product type
 */
export function getAvailableSizes(productType: string): string[] {
  if (productType === 'digital') {
    return ['digital'];
  }
  
  if (productType === 'art_print') {
    return ['12x18', '18x24', '20x30'];
  }
  
  if (productType === 'canvas_stretched' || productType === 'canvas_framed') {
    return ['12x18', '16x24', '20x30'];
  }
  
  return [];
}
