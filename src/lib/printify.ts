// src/lib/printify.ts

const PRINTIFY_API_URL = 'https://api.printify.com/v1';

// Upload image to Printify
export async function uploadImageToPrintify(imageUrl: string, fileName: string): Promise<string> {
  if (!process.env.PRINTIFY_API_TOKEN) {
    throw new Error("Printify API token is not configured");
  }

  console.log(' Uploading image to Printify:', imageUrl);

  // First, fetch the image data
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');

  // Upload to Printify
  const uploadResponse = await fetch(`${PRINTIFY_API_URL}/uploads/images.json`, {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      file_name: fileName,
      contents: base64Image
    })
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error("Printify image upload error:", {
      status: uploadResponse.status,
      statusText: uploadResponse.statusText,
      body: errorText
    });
    throw new Error(`Failed to upload image to Printify: ${uploadResponse.status} - ${errorText}`);
  }

  const uploadResult = await uploadResponse.json();
  console.log(' Image uploaded to Printify:', uploadResult.id);
  
  return uploadResult.id;
}

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
  CANVAS_STRETCHED = 'canvas_stretched',
  CANVAS_FRAMED = 'canvas_framed'
}

// Type alias for database compatibility
export type ProductTypeString = 'digital' | 'art_print' | 'canvas_stretched' | 'canvas_framed';

// Product configuration interface
export interface ProductConfig {
  blueprint_id: number;
  print_provider_id: number;
  variants: Array<{
    id: string | number; // Support both string and numeric IDs
    size: string;
    price: number;
  }>;
  frame_upgrade_price?: number; // Optional for canvas stretched products
}

// Printify product configurations for PawPop
export const PRINTIFY_PRODUCTS: Partial<Record<ProductType, Record<string, ProductConfig>>> = {
  [ProductType.ART_PRINT]: {
    US: {
      blueprint_id: 1220, // Rolled Posters (Fine Art)
      print_provider_id: 105, // Jondo
      variants: [
        { id: '92396', size: '12x18', price: 2900 }, // $29.00 CAD - 12″ x 18″ (Vertical) / Fine Art
        { id: '92400', size: '18x24', price: 3900 }, // $39.00 CAD - 18″ x 24″ (Vertical) / Fine Art
        { id: '92402', size: '20x30', price: 4800 }  // $48.00 CAD - 20″ x 30″ (Vertical) / Fine Art
      ]
    },
    // Future EU implementation - Blueprint 494 (Giclée Art Print) with Print Pigeons (ID: 36)
    // Currently not implemented - ships to EU only, no UK/US/CA coverage
    EUROPE_FUTURE: {
      blueprint_id: 494, // Giclée Art Print
      print_provider_id: 36, // Print Pigeons
      variants: [
        { id: 'giclee_12x18', size: '12x18', price: 2900 }, // $29.00 CAD
        { id: 'giclee_18x24', size: '18x24', price: 3900 }, // $39.00 CAD
        { id: 'giclee_20x30', size: '20x30', price: 4800 }  // $48.00 CAD
      ]
    }
  },
  [ProductType.CANVAS_STRETCHED]: {
    GLOBAL: {
      blueprint_id: 1159, // Matte Canvas, Stretched, 1.25"
      print_provider_id: 105, // Jondo
      variants: [
        { id: 91644, size: '12x18', price: 5900 }, // $59.00 CAD - 12″ × 18″ (Vertical) / 1.25"
        { id: 91647, size: '16x24', price: 7900 }, // $79.00 CAD - 16″ × 24″ (Vertical) / 1.25"
        { id: 91650, size: '20x30', price: 9900 }  // $99.00 CAD - 20″ × 30″ (Vertical) / 1.25"
      ],
      frame_upgrade_price: 4000 // $40 CAD
    }
  },
  [ProductType.CANVAS_FRAMED]: {
    GLOBAL: {
      blueprint_id: 944, // Matte Canvas, Framed Multi-color
      print_provider_id: 105, // Jondo
      variants: [
        { id: 111829, size: '12x18', price: 9900 }, // $99.00 CAD - 12″ × 18″ (Vertical) / Black / 1.25"
        { id: 111837, size: '16x24', price: 11900 }, // $119.00 CAD - 16″ × 24″ (Vertical) / Black / 1.25"
        { id: 88295, size: '20x30', price: 14900 }  // $149.00 CAD - 20″ × 30″ (Vertical) / Black / 1.25"
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
  blueprintId: number,
  printProviderId: number,
  title: string,
  description: string,
  imageUrl: string,
  productType: ProductType,
  size: string,
  shopId: string
): Promise<any> {
  if (!process.env.PRINTIFY_API_TOKEN) {
    throw new Error("Printify API token is not configured");
  }

  // Upload image to Printify first
  const fileName = `${String(title).replace(/[^a-zA-Z0-9]/g, '_')}.png`;
  const printifyImageId = await uploadImageToPrintify(imageUrl, fileName);

  // Import image positioning logic
  const { calculateImagePlacement, validatePlacement } = await import('./printify-image-positioning');
  
  // Calculate optimal image placement
  const placement = calculateImagePlacement(productType, size, imageUrl);
  const validatedPlacement = validatePlacement(placement);

  // Get the product configuration based on the product type and size
  const productConfig = getProductConfig(productType, 'US');
  if (!productConfig) {
    throw new Error(`No product configuration found for ${productType} in US region`);
  }

  // Configure canvas-specific options for canvas products
  const isCanvas = productType === ProductType.CANVAS_STRETCHED || productType === ProductType.CANVAS_FRAMED;
  
  // Get the actual variant IDs from the product config (ensure they're integers)
  const variantIds = productConfig.variants.map(v => parseInt(String(v.id), 10));
  
  const productData = {
    title,
    description,
    blueprint_id: blueprintId,
    print_provider_id: printProviderId,
    variants: productConfig.variants.map(variant => ({
      id: parseInt(String(variant.id), 10),
      price: variant.price,
      is_enabled: true
    })),
    print_areas: [
      {
        variant_ids: variantIds,
        placeholders: [
          {
            position: "front",
            images: [
              {
                id: printifyImageId,
                x: validatedPlacement.x,
                y: validatedPlacement.y,
                scale: validatedPlacement.scale,
                angle: validatedPlacement.angle
              }
            ]
          }
        ]
      }
    ],
    // Add canvas-specific print details for canvas products
    ...(isCanvas && {
      print_details: {
        print_on_side: "mirror", // Mirror the image on both sides
        print_on_sides: true     // Enable printing on both sides
      }
    })
  };

  console.log("📤 Creating Printify product with data:", JSON.stringify(productData, null, 2));

  const response = await fetch(`${PRINTIFY_API_URL}/shops/${shopId}/products.json`, {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(productData)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Printify product creation error:", {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
      requestPayload: productData
    });
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
      console.error("❌ Parsed error details:", JSON.stringify(errorData, null, 2));
    } catch (e) {
      errorData = { message: errorText };
      console.error("❌ Could not parse error response:", errorText);
    }
    
    throw new Error(`Failed to create Printify product: ${response.status} - ${JSON.stringify(errorData)}`);
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

  console.log(`🚀 Creating Printify order for shop: ${shopId}`);
  console.log(`📋 Order data:`, JSON.stringify(orderData, null, 2));

  const response = await fetch(`${PRINTIFY_API_URL}/shops/${shopId}/orders.json`, {
    method: 'POST',
    headers: {
      "Authorization": `Bearer ${process.env.PRINTIFY_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(orderData)
  });

  console.log(`📡 Printify API response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Printify order creation error:", {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    });
    
    let errorMessage = 'Operation failed';
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.message || errorData.error || 'Operation failed';
      console.error("Parsed error data:", errorData);
    } catch (e) {
      console.error("Raw error text:", errorText);
    }
    
    throw new Error(`Failed to create Printify order: ${errorMessage}`);
  }

  const result = await response.json();
  console.log(`✅ Printify order created successfully:`, result);
  return result;
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
export function getProductConfig(productType: ProductType, countryCode: string): ProductConfig | null {
  if (productType === ProductType.DIGITAL) {
    return null; // No Printify needed for digital products
  }

  if (productType === ProductType.CANVAS_STRETCHED) {
    return PRINTIFY_PRODUCTS[ProductType.CANVAS_STRETCHED]?.GLOBAL || null;
  }

  if (productType === ProductType.CANVAS_FRAMED) {
    return PRINTIFY_PRODUCTS[ProductType.CANVAS_FRAMED]?.GLOBAL || null;
  }

  if (productType === ProductType.ART_PRINT) {
    // Currently only US is supported for Fine Art prints (Blueprint 1220)
    if (countryCode === 'US') {
      return PRINTIFY_PRODUCTS[ProductType.ART_PRINT]?.US || null;
    }
    
    // Future EU implementation (Blueprint 494) - not active
    // const europeanCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'SE', 'DK', 'NO', 'PL', 'CZ', 'HU', 'SK', 'SI', 'HR', 'BG', 'RO', 'LT', 'LV', 'EE', 'MT', 'CY', 'LU', 'GR'];
    // if (europeanCountries.includes(countryCode)) {
    //   return PRINTIFY_PRODUCTS[ProductType.ART_PRINT]?.EUROPE_FUTURE || null;
    // }
    
    // For now, all non-US customers cannot order art prints
    return null;
  }

  return null;
}
