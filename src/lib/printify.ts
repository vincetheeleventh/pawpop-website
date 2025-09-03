// src/lib/printify.ts

const PRINTIFY_API_URL = "https://api.printify.com/v1";

interface PrintifyErrorResponse {
  status: string;
  code: number;
  message: string;
  errors: {
    reason: string;
    message: string;
  };
}

// Product type enum for PawPop products
export enum ProductType {
  DIGITAL = 'digital',
  ART_PRINT = 'art_print', 
  FRAMED_CANVAS = 'framed_canvas'
}

// Printify product configurations for PawPop
export const PRINTIFY_PRODUCTS = {
  [ProductType.ART_PRINT]: {
    US_CA: {
      blueprint_id: 1191, // Photo Art Paper Posters
      print_provider_id: 1, // Generic Brand
      variants: [
        { id: 'poster_12x18', size: '12x18', price: 2999 }, // $29.99
        { id: 'poster_16x20', size: '16x20', price: 3999 }, // $39.99
        { id: 'poster_18x24', size: '18x24', price: 4999 }  // $49.99
      ]
    },
    EUROPE: {
      blueprint_id: 494, // Giclee Art Print
      print_provider_id: 1, // Generic Brand
      variants: [
        { id: 'giclee_12x18', size: '12x18', price: 3499 }, // $34.99
        { id: 'giclee_16x20', size: '16x20', price: 4499 }, // $44.99
        { id: 'giclee_18x24', size: '18x24', price: 5499 }  // $54.99
      ]
    }
  },
  [ProductType.FRAMED_CANVAS]: {
    GLOBAL: {
      blueprint_id: 944, // Matte Canvas Framed Multi-Color
      print_provider_id: 1, // Generic Brand
      variants: [
        { id: 'canvas_12x16', size: '12x16', price: 7999 }, // $79.99
        { id: 'canvas_16x20', size: '16x20', price: 9999 }, // $99.99
        { id: 'canvas_20x24', size: '20x24', price: 12999 } // $129.99
      ]
    }
  }
};

// Order interfaces
export interface PrintifyOrderItem {
  product_id: string;
  variant_id: number;
  quantity: number;
  print_areas: {
    front?: string; // Image URL
  };
}

export interface PrintifyShippingAddress {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  country: string;
  region?: string;
  address1: string;
  address2?: string;
  city: string;
  zip: string;
}

export interface PrintifyOrderRequest {
  external_id: string; // Stripe session ID
  label?: string;
  line_items: PrintifyOrderItem[];
  shipping_method: number;
  send_shipping_notification: boolean;
  address_to: PrintifyShippingAddress;
}

export interface Blueprint {
  id: number;
  title: string;
  brand: string;
  images: string[];
  description: string;
  tags: string[];
}

export interface PaginatedBlueprints {
  data: Blueprint[];
  current_page: number;
  per_page: number;
  total: number;
}

export async function getProducts(): Promise<PaginatedBlueprints> {
  if (!process.env.PRINTIFY_API_TOKEN) {
    console.warn("Printify API token is not configured. Returning empty products list.");
    return {
      data: [],
      current_page: 1,
      per_page: 0,
      total: 0
    };
  }

  const response = await fetch(`${PRINTIFY_API_URL}/catalog/blueprints.json`, {
    headers: {
      "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
    },
    next: { revalidate: 3600 } // Revalidate every hour
  });

  if (!response.ok) {
    const errorData: PrintifyErrorResponse = await response.json();
    console.error("Printify API Error:", errorData);
    throw new Error(`Failed to fetch products: ${errorData.message}`);
  }

  const blueprints = await response.json();
  
  // Transform the Printify API response to match our expected structure
  const transformedData: Blueprint[] = blueprints.map((bp: any) => ({
    id: bp.id,
    title: bp.title,
    brand: bp.brand,
    description: bp.description || '',
    images: bp.images?.map((img: any) => img.url) || [],
    tags: bp.tags || []
  }));

  return {
    data: transformedData,
    current_page: 1,
    per_page: transformedData.length,
    total: transformedData.length
  };
}

// Create a Printify product for a specific blueprint
export async function createPrintifyProduct(
  shopId: string,
  blueprintId: number,
  printProviderId: number,
  title: string,
  description: string,
  imageUrl: string,
  productType: ProductType,
  size: string
): Promise<any> {
  if (!process.env.PRINTIFY_API_TOKEN) {
    throw new Error("Printify API token is not configured");
  }

  // Import image positioning logic
  const { calculateImagePlacement, validatePlacement } = await import('./printify-image-positioning');
  
  // Calculate optimal image placement
  const placement = calculateImagePlacement(productType, size, imageUrl);
  const validatedPlacement = validatePlacement(placement);

  const productData = {
    title,
    description,
    blueprint_id: blueprintId,
    print_provider_id: printProviderId,
    variants: [
      {
        id: 1,
        price: 2999, // Will be overridden by variant-specific pricing
        is_enabled: true
      }
    ],
    print_areas: [
      {
        variant_ids: [1],
        placeholders: [
          {
            position: "front",
            images: [
              {
                id: imageUrl,
                x: validatedPlacement.x,
                y: validatedPlacement.y,
                scale: validatedPlacement.scale,
                angle: validatedPlacement.angle
              }
            ]
          }
        ]
      }
    ]
  };

  const response = await fetch(`${PRINTIFY_API_URL}/shops/${shopId}/products.json`, {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Printify product creation error:", errorData);
    throw new Error(`Failed to create Printify product: ${errorData.message}`);
  }

  return response.json();
}

// Create a Printify order
export async function createPrintifyOrder(
  shopId: string,
  orderData: PrintifyOrderRequest
): Promise<any> {
  if (!process.env.PRINTIFY_API_TOKEN) {
    throw new Error("Printify API token is not configured");
  }

  const response = await fetch(`${PRINTIFY_API_URL}/shops/${shopId}/orders.json`, {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Printify order creation error:", errorData);
    throw new Error(`Failed to create Printify order: ${errorData.message}`);
  }

  return response.json();
}

// Get shipping methods for a specific product
export async function getShippingMethods(
  shopId: string,
  blueprintId: number,
  printProviderId: number,
  countryCode: string
): Promise<any> {
  if (!process.env.PRINTIFY_API_TOKEN) {
    throw new Error("Printify API token is not configured");
  }

  const response = await fetch(
    `${PRINTIFY_API_URL}/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/shipping.json?country=${countryCode}`,
    {
      headers: {
        "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
      }
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Printify shipping methods error:", errorData);
    throw new Error(`Failed to get shipping methods: ${errorData.message}`);
  }

  return response.json();
}

// Helper function to determine the correct product configuration based on shipping country
export function getProductConfig(productType: ProductType, countryCode: string) {
  if (productType === ProductType.DIGITAL) {
    return null; // No Printify needed for digital products
  }

  if (productType === ProductType.FRAMED_CANVAS) {
    return PRINTIFY_PRODUCTS[ProductType.FRAMED_CANVAS].GLOBAL;
  }

  if (productType === ProductType.ART_PRINT) {
    // Determine region based on country code
    const europeanCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'SE', 'DK', 'NO', 'PL', 'CZ', 'HU', 'SK', 'SI', 'HR', 'BG', 'RO', 'LT', 'LV', 'EE', 'MT', 'CY', 'LU', 'GR'];
    
    if (europeanCountries.includes(countryCode)) {
      return PRINTIFY_PRODUCTS[ProductType.ART_PRINT].EUROPE;
    } else {
      return PRINTIFY_PRODUCTS[ProductType.ART_PRINT].US_CA;
    }
  }

  return null;
}
