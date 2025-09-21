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

// PawPop product catalog - 7 products total
export const pawPopProducts: PawPopProduct[] = [
  // 1. Digital Product
  {
    id: 'pawpop-digital-portrait',
    name: 'Custom Pet Pop Art Portrait - Digital',
    description: 'Transform your beloved pet into a stunning pop art masterpiece! Our artists create a unique, personalized digital portrait that captures your pet\'s personality in vibrant colors and artistic style. Perfect for pet lovers who want a one-of-a-kind piece of art.',
    price: 1999, // $19.99
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
        name: 'High Resolution Digital Download',
        price: 1999,
        sku: 'PAWPOP-DIG-STD',
        availability: 'in_stock',
        attributes: {
          format: 'Digital Download',
          size: 'High Resolution'
        }
      }
    ]
  },
  // 2-4. Art Prints (3 sizes)
  {
    id: 'pawpop-art-print-12x18',
    name: 'Custom Pet Pop Art Print - 12"x18"',
    description: 'Your pet\'s pop art portrait printed on museum-quality fine art paper (285 g/m²)! This 12"x18" art print features your custom pet portrait with archival inks.',
    price: 2999, // $29.99
    currency: 'USD',
    category: 'Art & Collectibles > Art Prints',
    availability: 'in_stock',
    condition: 'new',
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
        name: '12"x18" Fine Art Print',
        price: 2999,
        sku: 'PAWPOP-PRT-12X18',
        availability: 'in_stock',
        attributes: {
          size: '12"x18"',
          material: 'Fine Art Paper (285 g/m²)'
        }
      }
    ]
  },
  {
    id: 'pawpop-art-print-16x24',
    name: 'Custom Pet Pop Art Print - 16"x24"',
    description: 'Your pet\'s pop art portrait printed on museum-quality fine art paper (285 g/m²)! This 16"x24" art print features your custom pet portrait with archival inks.',
    price: 3999, // $39.99
    currency: 'USD',
    category: 'Art & Collectibles > Art Prints',
    availability: 'in_stock',
    condition: 'new',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-PRINT-16X24',
    images: [
      '/images/pawpop-print-16x24-sample.jpg',
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
        id: 'print-16x24-standard',
        name: '16"x24" Fine Art Print',
        price: 3999,
        sku: 'PAWPOP-PRT-16X24',
        availability: 'in_stock',
        attributes: {
          size: '16"x24"',
          material: 'Fine Art Paper (285 g/m²)'
        }
      }
    ]
  },
  {
    id: 'pawpop-art-print-20x30',
    name: 'Custom Pet Pop Art Print - 20"x30"',
    description: 'Your pet\'s pop art portrait printed on museum-quality fine art paper (285 g/m²)! This large 20"x30" art print makes a bold statement piece with your custom pet portrait in archival inks.',
    price: 4999, // $49.99
    currency: 'USD',
    category: 'Art & Collectibles > Art Prints',
    availability: 'in_stock',
    condition: 'new',
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
        name: '20"x30" Fine Art Print',
        price: 4999,
        sku: 'PAWPOP-PRT-20X30',
        availability: 'in_stock',
        attributes: {
          size: '20"x30"',
          material: 'Fine Art Paper (285 g/m²)'
        }
      }
    ]
  },
  // 5-7. Framed Canvas (3 sizes)
  {
    id: 'pawpop-framed-canvas-12x18',
    name: 'Custom Pet Pop Art Framed Canvas - 12"x18"',
    description: 'Your pet\'s pop art portrait professionally printed on canvas and framed! This 12"x18" framed canvas comes ready to hang with premium materials and protective finish.',
    price: 7999, // $79.99
    currency: 'USD',
    category: 'Art & Collectibles > Framed Canvas',
    availability: 'in_stock',
    condition: 'new',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-CANVAS-12X18',
    images: [
      '/images/pawpop-canvas-12x18-sample.jpg',
      '/images/canvas-frame-detail.jpg'
    ],
    shippingWeight: 2.5,
    dimensions: {
      length: 18,
      width: 12,
      height: 1.5,
      unit: 'in'
    },
    variants: [
      {
        id: 'canvas-12x18-framed',
        name: '12"x18" Framed Canvas',
        price: 7999,
        sku: 'PAWPOP-CAN-12X18',
        availability: 'in_stock',
        attributes: {
          size: '12"x18"',
          material: 'Canvas with Frame'
        }
      }
    ]
  },
  {
    id: 'pawpop-framed-canvas-16x24',
    name: 'Custom Pet Pop Art Framed Canvas - 16"x24"',
    description: 'Your pet\'s pop art portrait professionally printed on canvas and framed! This 16"x24" framed canvas makes a stunning statement piece, ready to hang with premium materials.',
    price: 9999, // $99.99
    currency: 'USD',
    category: 'Art & Collectibles > Framed Canvas',
    availability: 'in_stock',
    condition: 'new',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-CANVAS-16X24',
    images: [
      '/images/pawpop-canvas-16x24-sample.jpg',
      '/images/canvas-frame-detail.jpg'
    ],
    shippingWeight: 4.0,
    dimensions: {
      length: 24,
      width: 18,
      height: 1.5,
      unit: 'in'
    },
    variants: [
      {
        id: 'canvas-16x24-framed',
        name: '16"x24" Framed Canvas',
        price: 9999,
        sku: 'PAWPOP-CAN-16X24',
        availability: 'in_stock',
        attributes: {
          size: '16"x24"',
          material: 'Canvas with Frame'
        }
      }
    ]
  },
  {
    id: 'pawpop-framed-canvas-20x30',
    name: 'Custom Pet Pop Art Framed Canvas - 20"x30"',
    description: 'Your pet\'s pop art portrait professionally printed on canvas and framed! This large 20"x30" framed canvas is our premium offering, perfect for making a bold artistic statement.',
    price: 12999, // $129.99
    currency: 'USD',
    category: 'Art & Collectibles > Framed Canvas',
    availability: 'in_stock',
    condition: 'new',
    brand: 'PawPop Art',
    mpn: 'PAWPOP-CANVAS-20X30',
    images: [
      '/images/pawpop-canvas-20x30-sample.jpg',
      '/images/canvas-frame-detail.jpg'
    ],
    shippingWeight: 6.0,
    dimensions: {
      length: 30,
      width: 20,
      height: 1.5,
      unit: 'in'
    },
    variants: [
      {
        id: 'canvas-20x30-framed',
        name: '20"x30" Framed Canvas',
        price: 12999,
        sku: 'PAWPOP-CAN-20X30',
        availability: 'in_stock',
        attributes: {
          size: '20"x30"',
          material: 'Canvas with Frame'
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
