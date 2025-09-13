# UTM Tracking Guide for PawPop Google Ads

## UTM Parameter Structure

All PawPop Google Ads campaigns use standardized UTM parameters for comprehensive tracking:

### Standard UTM Parameters
- **utm_source**: `google` (traffic source)
- **utm_medium**: `cpc` (cost-per-click advertising)
- **utm_campaign**: `pawpop-webtraffic-search` (campaign name)
- **utm_content**: Ad group identifier (see mapping below)
- **utm_term**: Specific keyword identifier

### Ad Group UTM Content Mapping

| Ad Group | UTM Content | Keywords Count |
|----------|-------------|----------------|
| Pet Mom Gifts | `pet-mom-gifts` | 8 keywords |
| Custom Pet Portraits | `custom-pet-portraits` | 12 keywords |
| Canvas & Print | `canvas-print` | 10 keywords |
| Artistic Styles | `artistic-styles` | 10 keywords |
| Branded & Marketplace | `branded-marketplace` | 6 keywords |

### UTM Term Convention

Keywords are converted to UTM terms using this format:
- Remove brackets and quotes from keyword
- Convert to lowercase
- Replace spaces with hyphens
- Add `-phrase` suffix for phrase match keywords
- Keep exact match keywords without suffix

**Examples:**
- `[best dog mom gifts]` → `best-dog-mom-gifts`
- `"best dog mom gifts"` → `best-dog-mom-gifts-phrase`
- `[custom pet portrait]` → `custom-pet-portrait`
- `"custom pet portraits"` → `custom-pet-portraits-phrase`

## Sample URLs

### Pet Mom Gifts Ad Group
```
https://www.pawpopart.com/?utm_source=google&utm_medium=cpc&utm_campaign=pawpop-webtraffic-search&utm_content=pet-mom-gifts&utm_term=best-dog-mom-gifts
```

### Custom Pet Portraits Ad Group
```
https://www.pawpopart.com/?utm_source=google&utm_medium=cpc&utm_campaign=pawpop-webtraffic-search&utm_content=custom-pet-portraits&utm_term=custom-pet-portrait
```

### Canvas & Print Ad Group
```
https://www.pawpopart.com/?utm_source=google&utm_medium=cpc&utm_campaign=pawpop-webtraffic-search&utm_content=canvas-print&utm_term=custom-canvas-prints
```

## Analytics Tracking Benefits

This UTM structure enables tracking of:

1. **Campaign Performance**: Overall `pawpop-webtraffic-search` performance
2. **Ad Group Performance**: Which themes perform best (gifts vs portraits vs canvas)
3. **Keyword Performance**: Individual keyword conversion rates
4. **Match Type Performance**: Exact vs Phrase match effectiveness
5. **Landing Page Optimization**: Traffic source analysis for A/B testing

## Implementation

1. **Google Ads Setup**: Use the `keywords-with-utm.csv` file for keyword import
2. **Analytics Configuration**: Set up goals and conversions in Google Analytics
3. **Reporting**: Create custom reports filtering by UTM parameters
4. **Optimization**: Adjust bids and budgets based on UTM performance data

## Files

- `/src/mcp/google-ads/keywords-with-utm.csv` - Complete keyword list with UTM URLs
- `/src/mcp/google-ads/keywords.csv` - Original keyword list (for MCP sync)

## Next Steps

1. Import keywords with UTM URLs into Google Ads
2. Verify all ads point to UTM-tracked landing pages
3. Set up conversion tracking in Google Analytics
4. Create performance dashboards filtered by UTM parameters
