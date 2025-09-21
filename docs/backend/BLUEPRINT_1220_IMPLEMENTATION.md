# Blueprint 1220 Fine Art Implementation

## Overview

PawPop now uses **Blueprint 1220 (Rolled Posters by Jondo)** for US customers, offering premium Fine Art paper quality for art prints. This implementation provides museum-quality prints with superior paper weight and texture.

## Product Specifications

### Blueprint 1220 - Rolled Posters (Fine Art)
- **Provider**: Jondo (ID: 105)
- **Paper Type**: Fine Art
- **Paper Weight**: 285 g/m²
- **Finish**: Matte
- **Quality**: Museum-quality, archival
- **Shipping**: US only

### Available Sizes & Variant IDs
| Size | Variant ID | Price (CAD) | Description |
|------|------------|-------------|-------------|
| 12″×18″ | 92396 | $29 | 12″ x 18″ (Vertical) / Fine Art |
| 18″×24″ | 92400 | $39 | 18″ x 24″ (Vertical) / Fine Art |
| 20″×30″ | 92402 | $48 | 20″ x 30″ (Vertical) / Fine Art |

## Implementation Details

### Product Configuration
```javascript
const PRODUCT_CONFIG = {
  ART_PRINT: {
    US: {
      blueprint_id: 1220, // Rolled Posters (Fine Art)
      print_provider_id: 105, // Jondo
      variants: [
        { id: 'fine_art_12x18', size: '12x18', price: 2900, variant_id: 92396 },
        { id: 'fine_art_18x24', size: '18x24', price: 3900, variant_id: 92400 },
        { id: 'fine_art_20x30', size: '20x30', price: 4800, variant_id: 92402 }
      ]
    }
  }
}
```

### Key Changes Made
1. **Updated Blueprint**: Changed from 1191 to 1220
2. **Updated Provider**: Changed from Generic Brand to Jondo
3. **Updated Variant IDs**: Using specific Fine Art variant IDs
4. **Updated Descriptions**: Now mentions "Fine Art paper (285 g/m²)"
5. **Regional Limitation**: Currently US-only shipping

## Shipping Coverage

### Current Implementation (Blueprint 1220)
- ✅ **United States**: Full coverage
- ❌ **Canada**: Not supported
- ❌ **Europe**: Not supported  
- ❌ **United Kingdom**: Not supported

### Impact
- US customers get premium Fine Art quality
- International customers currently cannot order art prints
- Future expansion needed for global coverage

## Future EU Implementation

### Blueprint 494 - Giclée Art Print (Planned)
- **Provider**: Print Pigeons (ID: 36)
- **Paper Type**: Giclée quality
- **Paper Weight**: 192 g/m²
- **Shipping**: EU countries only
- **Status**: Not implemented (missing UK/US/CA coverage)

```javascript
// Future EU configuration (not active)
EUROPE_FUTURE: {
  blueprint_id: 494, // Giclée Art Print
  print_provider_id: 36, // Print Pigeons
  variants: [
    { id: 'giclee_12x18', size: '12x18', price: 2900 },
    { id: 'giclee_18x24', size: '18x24', price: 3900 },
    { id: 'giclee_20x30', size: '20x30', price: 4800 }
  ]
}
```

## Technical Implementation

### Files Modified
- `/src/app/api/printify/generate-mockups/route.ts`
  - Updated PRODUCT_CONFIG with Blueprint 1220
  - Changed variant IDs to Fine Art options
  - Updated mockup titles and descriptions
  - Added documentation for future EU option

### API Changes
- Mockup generation now uses Blueprint 1220 variants
- Product titles changed to "Fine Art Print"
- Descriptions mention "Museum-quality fine art paper (285 g/m²)"
- Fallback mockups also updated to reflect Fine Art quality

### Quality Improvements
- **Paper Weight**: Increased from ~180-200 g/m² to 285 g/m²
- **Paper Type**: Upgraded to Fine Art quality
- **Durability**: Archival quality, acid-free
- **Finish**: Professional matte finish
- **Print Quality**: Museum-quality giclée printing

## Testing

### Configuration Test
```bash
node scripts/test-blueprint-1220-implementation.js
```

Expected output:
- Blueprint: 1220 (Rolled Posters)
- Provider: 105 (Jondo)
- 3 variants with correct pricing
- Fine Art variant IDs: 92396, 92400, 92402

### Integration Test
The implementation can be tested by:
1. Creating an artwork through the normal flow
2. Checking that mockups are generated with "Fine Art Print" titles
3. Verifying product descriptions mention "285 g/m²"
4. Confirming US shipping availability

## Limitations & Considerations

### Current Limitations
1. **Geographic**: US-only shipping
2. **International Customers**: Cannot order art prints
3. **Business Impact**: Reduced addressable market
4. **Customer Experience**: May cause confusion for international users

### Recommended Next Steps
1. **Implement Region Detection**: Show different products based on customer location
2. **Find Global Alternative**: Research blueprints with worldwide shipping + Fine Art
3. **Hybrid Approach**: Use Blueprint 1220 for US, alternative for international
4. **Customer Communication**: Clear messaging about shipping limitations

## Quality Comparison

| Aspect | Previous (Blueprint 1191) | Current (Blueprint 1220) |
|--------|---------------------------|---------------------------|
| Paper Weight | ~180-200 g/m² | 285 g/m² |
| Paper Type | Standard | Fine Art |
| Quality Level | Good | Museum-quality |
| Shipping | Global | US only |
| Provider | Generic Brand | Jondo |
| Archival Quality | Standard | Acid-free, archival |

## Monitoring & Metrics

### Key Metrics to Track
- US art print conversion rates
- International customer drop-off at art print selection
- Customer feedback on Fine Art quality
- Shipping-related support tickets

### Success Indicators
- Improved customer satisfaction with print quality
- Higher perceived value for US customers
- Positive feedback on paper weight and finish
- Reduced quality-related returns

## Conclusion

Blueprint 1220 implementation successfully provides US customers with premium Fine Art quality prints. The 285 g/m² paper weight and museum-quality finish represent a significant upgrade in product quality. However, the geographic limitation requires future expansion planning for international markets.

The foundation is in place for regional product differentiation, with Blueprint 494 documented as a potential EU solution pending shipping coverage improvements.
