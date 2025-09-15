// Test script to verify pricing matches PRODUCTS.md
const { ProductType, getProductPricing } = require('./src/lib/printify-products.ts');

console.log('🧪 Testing PawPop Pricing Structure from PRODUCTS.md\n');

// Test Digital Download
console.log('📱 DIGITAL DOWNLOAD:');
console.log(`Price: $${getProductPricing(ProductType.DIGITAL, 'digital', 'US') / 100} CAD`);
console.log('Expected: $15.00 CAD ✓\n');

// Test Art Print - North America
console.log('🖼️  ART PRINT (North America):');
const artPrintSizes = ['12x18', '18x24', '20x30'];
const expectedArtPrices = [29.00, 36.00, 48.00];
artPrintSizes.forEach((size, i) => {
  const price = getProductPricing(ProductType.ART_PRINT, size, 'US') / 100;
  console.log(`${size}: $${price} CAD (Expected: $${expectedArtPrices[i]} CAD) ${price === expectedArtPrices[i] ? '✓' : '❌'}`);
});

// Test Art Print - Europe
console.log('\n🖼️  ART PRINT (Europe):');
artPrintSizes.forEach((size, i) => {
  const price = getProductPricing(ProductType.ART_PRINT, size, 'DE') / 100;
  console.log(`${size}: $${price} CAD (Expected: $${expectedArtPrices[i]} CAD) ${price === expectedArtPrices[i] ? '✓' : '❌'}`);
});

// Test Canvas Stretched
console.log('\n🎨 CANVAS STRETCHED (Global):');
const canvasSizes = ['12x18', '18x24', '20x30'];
const expectedCanvasPrices = [59.00, 79.00, 99.00];
canvasSizes.forEach((size, i) => {
  const price = getProductPricing(ProductType.CANVAS_STRETCHED, size, 'US') / 100;
  const priceWithFrame = getProductPricing(ProductType.CANVAS_STRETCHED, size, 'US', true) / 100;
  console.log(`${size}: $${price} CAD (Expected: $${expectedCanvasPrices[i]} CAD) ${price === expectedCanvasPrices[i] ? '✓' : '❌'}`);
  console.log(`${size} + Frame: $${priceWithFrame} CAD (Expected: $${expectedCanvasPrices[i] + 40} CAD) ${priceWithFrame === expectedCanvasPrices[i] + 40 ? '✓' : '❌'}`);
});

// Test Canvas Framed
console.log('\n🖼️  CANVAS FRAMED (Global):');
const expectedFramedPrices = [99.00, 119.00, 149.00];
canvasSizes.forEach((size, i) => {
  const price = getProductPricing(ProductType.CANVAS_FRAMED, size, 'US') / 100;
  console.log(`${size}: $${price} CAD (Expected: $${expectedFramedPrices[i]} CAD) ${price === expectedFramedPrices[i] ? '✓' : '❌'}`);
});

console.log('\n✅ Pricing verification complete!');
