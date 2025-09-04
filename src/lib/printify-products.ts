// src/lib/printify-products.ts
import { 
  createPrintifyProduct, 
  getProductConfig, 
  ProductType, 
  PRINTIFY_PRODUCTS 
} from './printify';

// Re-export ProductType for use in other components
export { ProductType };

export interface PawPopProduct {
  id: string;
  printifyProductId?: string;
  productType: ProductType;
  size: string;
  imageUrl: string;
  title: string;
  description: string;
  region: 'US_CA' | 'EUROPE' | 'GLOBAL';
}

// Cache for created Printify products to avoid recreation
const productCache = new Map<string, string>();

// Generate a unique product key for caching
function getProductKey(productType: ProductType, size: string, imageUrl: string, region: string): string {
  return `${productType}_${size}_${region}_${Buffer.from(imageUrl).toString('base64').slice(0, 10)}`;
}

// Create or retrieve a Printify product for a specific order
export async function getOrCreatePrintifyProduct(
  productType: ProductType,
  size: string,
  imageUrl: string,
  countryCode: string,
  customerName: string,
  petName?: string
): Promise<{ productId: string; variantId: number }> {
  
  if (productType === ProductType.DIGITAL) {
    throw new Error('Digital products do not require Printify integration');
  }

  const productConfig = getProductConfig(productType, countryCode);
  if (!productConfig) {
    throw new Error(`No product configuration found for ${productType} in ${countryCode}`);
  }

  // Find the variant for the selected size
  const variant = productConfig.variants.find(v => v.size === size);
  if (!variant) {
    throw new Error(`No variant found for size ${size}`);
  }

  // Determine region
  let region: string;
  if (productType === ProductType.FRAMED_CANVAS) {
    region = 'GLOBAL';
  } else {
    const europeanCountries = ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'PT', 'IE', 'FI', 'SE', 'DK', 'NO', 'PL', 'CZ', 'HU', 'SK', 'SI', 'HR', 'BG', 'RO', 'LT', 'LV', 'EE', 'MT', 'CY', 'LU', 'GR'];
    region = europeanCountries.includes(countryCode) ? 'EUROPE' : 'US_CA';
  }

  // Check cache first
  const productKey = getProductKey(productType, size, imageUrl, region);
  const cachedProductId = productCache.get(productKey);
  
  if (cachedProductId) {
    return {
      productId: cachedProductId,
      variantId: 1 // Simplified - in real implementation, map to actual variant IDs
    };
  }

  // Create new Printify product
  const shopId = process.env.PRINTIFY_SHOP_ID;
  if (!shopId) {
    throw new Error('PRINTIFY_SHOP_ID environment variable is not set');
  }

  const title = `PawPop ${getProductTypeDisplayName(productType)} - ${customerName}${petName ? ` (${petName})` : ''}`;
  const description = `Custom ${getProductTypeDisplayName(productType)} featuring ${petName || 'your pet'} in the style of the Mona Lisa. Size: ${size}`;

  try {
    const printifyProduct = await createPrintifyProduct(
      productConfig.blueprint_id,
      productConfig.print_provider_id,
      title,
      description,
      imageUrl,
      productType,
      size,
      shopId
    );

    // Cache the product ID
    productCache.set(productKey, printifyProduct.id);

    return {
      productId: printifyProduct.id,
      variantId: 1 // Simplified - in real implementation, map to actual variant IDs
    };

  } catch (error) {
    console.error('Failed to create Printify product:', error);
    throw error;
  }
}

// Get display name for product type
function getProductTypeDisplayName(productType: ProductType): string {
  switch (productType) {
    case ProductType.ART_PRINT:
      return 'Art Print';
    case ProductType.FRAMED_CANVAS:
      return 'Framed Canvas';
    case ProductType.DIGITAL:
      return 'Digital Download';
    default:
      return 'Custom Product';
  }
}

// Get pricing for a product type and size
export function getProductPricing(productType: ProductType, size: string, countryCode: string): number {
  if (productType === ProductType.DIGITAL) {
    return 999; // $9.99 for digital
  }

  const productConfig = getProductConfig(productType, countryCode);
  if (!productConfig) {
    throw new Error(`No product configuration found for ${productType} in ${countryCode}`);
  }

  const variant = productConfig.variants.find(v => v.size === size);
  if (!variant) {
    throw new Error(`No variant found for size ${size}`);
  }

  return variant.price;
}

// Get available sizes for a product type
export function getAvailableSizes(productType: ProductType, countryCode: string): string[] {
  if (productType === ProductType.DIGITAL) {
    return ['digital']; // Digital products don't have physical sizes
  }

  const productConfig = getProductConfig(productType, countryCode);
  if (!productConfig) {
    return [];
  }

  return productConfig.variants.map(v => v.size);
}

// Validate order data before processing
export function validateOrderData(
  productType: ProductType,
  size: string,
  countryCode: string,
  imageUrl: string
): { isValid: boolean; error?: string } {
  
  // Validate product type
  if (!Object.values(ProductType).includes(productType)) {
    return { isValid: false, error: 'Invalid product type' };
  }

  // Validate image URL
  if (!imageUrl || !isValidImageUrl(imageUrl)) {
    return { isValid: false, error: 'Invalid or missing image URL' };
  }

  // Validate size for physical products
  if (productType !== ProductType.DIGITAL) {
    const availableSizes = getAvailableSizes(productType, countryCode);
    if (!availableSizes.includes(size)) {
      return { isValid: false, error: `Invalid size ${size} for product type ${productType}` };
    }
  }

  // Validate country code
  if (!countryCode || countryCode.length !== 2) {
    return { isValid: false, error: 'Invalid country code' };
  }

  return { isValid: true };
}

// Simple URL validation
function isValidImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}
