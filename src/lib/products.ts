export interface PawPopProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  availability: 'in_stock' | 'out_of_stock' | 'preorder';
  condition: 'new' | 'used' | 'refurbished';
  brand: string;
  mpn?: string; // Manufacturer Part Number
  gtin?: string; // Global Trade Item Number
  images: string[];
  variants?: ProductVariant[];
  shippingWeight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'in' | 'cm';
  };
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  sku: string;
  availability: 'in_stock' | 'out_of_stock' | 'preorder';
  attributes: {
    size?: string;
    material?: string;
    format?: string;
  };
}

// PawPop product catalog
export const pawPopProducts: PawPopProduct[] = [
  {
    id: 'pawpop-digital-portrait',
    name: 'Custom Pet Pop Art Portrait - Digital',
    description: 'Transform your beloved pet into a stunning pop art masterpiece! Our artists create a unique, personalized digital portrait that captures your pet\'s personality in vibrant colors and artistic style. Perfect for pet lovers who want a one-of-a-kind piece of art.',
    price: 2999, // $29.99
    currency: 'USD',
    category: 'Art & Collectibles > Personalized Art',
    availability: 'in_stock',
    condition: 'new',
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
        name: 'Standard Resolution (2000x2000px)',
        price: 2999,
        sku: 'PAWPOP-DIG-STD',
        availability: 'in_stock',
        attributes: {
          format: 'Digital Download',
          size: '2000x2000px'
        }
      },
      {
        id: 'digital-hd',
        name: 'HD Resolution (4000x4000px)',
        price: 3999,
        sku: 'PAWPOP-DIG-HD',
        availability: 'in_stock',
        attributes: {
          format: 'Digital Download',
          size: '4000x4000px'
        }
      }
    ]
  },
  {
    id: 'pawpop-canvas-print-12x12',
    name: 'Custom Pet Pop Art Canvas Print - 12"x12"',
    description: 'Your pet\'s pop art portrait printed on premium canvas! This 12"x12" canvas print features your custom pet portrait with vibrant, fade-resistant inks. Ready to hang with included mounting hardware.',
    price: 4999, // $49.99
    currency: 'USD',
    category: 'Art & Collectibles > Canvas Prints',
    availability: 'in_stock',
    condition: 'new',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-CANVAS-12X12',
    images: [
      '/images/pawpop-canvas-12x12-sample.jpg',
      '/images/canvas-texture-detail.jpg'
    ],
    shippingWeight: 1.2,
    dimensions: {
      length: 12,
      width: 12,
      height: 0.75,
      unit: 'in'
    },
    variants: [
      {
        id: 'canvas-12x12-standard',
        name: '12"x12" Standard Canvas',
        price: 4999,
        sku: 'PAWPOP-CAN-12X12-STD',
        availability: 'in_stock',
        attributes: {
          size: '12"x12"',
          material: 'Premium Canvas'
        }
      }
    ]
  },
  {
    id: 'pawpop-canvas-print-16x16',
    name: 'Custom Pet Pop Art Canvas Print - 16"x16"',
    description: 'Your pet\'s pop art portrait printed on premium canvas! This larger 16"x16" canvas print makes a bold statement piece with your custom pet portrait in vibrant, fade-resistant inks.',
    price: 6999, // $69.99
    currency: 'USD',
    category: 'Art & Collectibles > Canvas Prints',
    availability: 'in_stock',
    condition: 'new',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-CANVAS-16X16',
    images: [
      '/images/pawpop-canvas-16x16-sample.jpg',
      '/images/canvas-texture-detail.jpg'
    ],
    shippingWeight: 2.1,
    dimensions: {
      length: 16,
      width: 16,
      height: 0.75,
      unit: 'in'
    },
    variants: [
      {
        id: 'canvas-16x16-standard',
        name: '16"x16" Premium Canvas',
        price: 6999,
        sku: 'PAWPOP-CAN-16X16-STD',
        availability: 'in_stock',
        attributes: {
          size: '16"x16"',
          material: 'Premium Canvas'
        }
      }
    ]
  },
  {
    id: 'pawpop-framed-print-11x14',
    name: 'Custom Pet Pop Art Framed Print - 11"x14"',
    description: 'Your pet\'s pop art portrait professionally printed and framed! This elegant 11"x14" framed print comes ready to display with a sleek black frame and protective glass.',
    price: 7999, // $79.99
    currency: 'USD',
    category: 'Art & Collectibles > Framed Prints',
    availability: 'in_stock',
    condition: 'new',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-FRAMED-11X14',
    images: [
      '/images/pawpop-framed-11x14-sample.jpg',
      '/images/frame-detail.jpg'
    ],
    shippingWeight: 3.5,
    dimensions: {
      length: 14,
      width: 11,
      height: 1,
      unit: 'in'
    },
    variants: [
      {
        id: 'framed-11x14-black',
        name: '11"x14" Black Frame',
        price: 7999,
        sku: 'PAWPOP-FRM-11X14-BLK',
        availability: 'in_stock',
        attributes: {
          size: '11"x14"',
          material: 'Black Wood Frame'
        }
      }
    ]
  }
];

// Helper function to get product by ID
export function getProductById(id: string): PawPopProduct | undefined {
  return pawPopProducts.find(product => product.id === id);
}

// Helper function to get all products
export function getAllProducts(): PawPopProduct[] {
  return pawPopProducts;
}

// Helper function to format price for display
export function formatProductPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(price / 100);
}
