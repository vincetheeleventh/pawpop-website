# Printify Mockup Context Selection

This document explains how PawPop selects specific mockup contexts for different product types to ensure optimal visual presentation.

## Context Types

Printify generates multiple mockup images for each product variant, each with different camera angles and contexts:

- **context-1**: Close-up product shot (default)
- **context-2**: Clean, focused setting - ideal for fine art prints
- **context-3**: Lifestyle/room environment - ideal for canvas products

## Product-Specific Context Selection

### Fine Art Prints (Blueprint 1220)
- **Preferred Context**: `context-2`
- **Reason**: Shows the print in a clean, focused setting that highlights the artwork quality
- **Fallback Order**: context-2 → index[1] → index[2] → index[0]

### Canvas Products (Blueprints 1159, 944)
- **Preferred Context**: `context-3`
- **Reason**: Shows the canvas in a lifestyle/room setting that demonstrates how it looks in a home
- **Fallback Order**: context-3 → index[2] → index[1] → index[0]

## Product Sizes

**Fine Art Prints (Blueprint 1220)**:
- 12" × 18", 18" × 24", 20" × 30"

**Canvas Products (Blueprints 1159, 944)**:
- 12" × 18", 16" × 24", 20" × 30"

## Implementation

The context selection logic is implemented in `/src/app/api/printify/generate-mockups/route.ts`:

```typescript
// For fine art prints, use Context 2 mockups; for canvas, use Context 3
let contextMockup = variantMockups.find((mockup: any) => {
  const url = mockup.src || ''
  if (blueprintId === PRODUCT_CONFIG.ART_PRINT.US.blueprint_id) {
    // Fine art prints: use context-2
    return url.includes('camera_label=context-2') || 
           url.includes('camera_label=context2')
  } else {
    // Canvas products: use context-3 (lifestyle/room shots)
    return url.includes('camera_label=context-3') || 
           url.includes('camera_label=context3') ||
           url.includes('camera_label=lifestyle') ||
           url.includes('camera_label=room')
  }
})
```

## URL Pattern Recognition

Mockup URLs contain camera_label parameters that identify the context:
- `?camera_label=context-2` - Clean, focused setting
- `?camera_label=context-3` - Lifestyle/room environment

## Fallback Strategy

If the preferred context is not available:
1. **Fine Art Prints**: Use index[1] (often context-2), then index[2], then index[0]
2. **Canvas Products**: Use index[2] (often context-3), then index[1], then index[0]

## Testing

To verify correct context selection:
1. Check server logs for mockup generation
2. Look for "Selected Context 2/3 mockups" messages
3. Verify camera_label in mockup details logging

## Impact

This ensures that:
- Fine art prints are displayed in clean, professional settings
- Canvas products are shown in realistic home environments
- Each product type gets the most appropriate visual presentation
- Customer purchase decisions are better informed by relevant mockup contexts
