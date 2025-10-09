# PawPop Google Ads Campaign Implementation

## Campaign Structure

**Campaign Name:** PawPop Search
**Campaign Type:** Search Network
**Target:** pawpop-webtraffic-search

## Ad Groups and Keywords

### 1. Pet Mom Gifts (8 keywords)
**Target Audience:** Pet owners looking for gifts for pet moms
- `[best dog mom gifts]` - Exact
- `"best dog mom gifts"` - Phrase
- `[dog mom presents]` - Exact
- `"dog mom gifts"` - Phrase
- `[gift for dog mom]` - Exact
- `"dog mom gift ideas"` - Phrase
- `[cat mom gifts]` - Exact
- `"cat mom gifts"` - Phrase

### 2. Custom Pet Portraits (12 keywords)
**Target Audience:** Users seeking custom pet artwork services
- `[custom pet portrait]` - Exact
- `"custom pet portraits"` - Phrase
- `[dog portrait painting]` - Exact
- `"dog portrait painting"` - Phrase
- `[cat portrait]` - Exact
- `"cat portrait"` - Phrase
- `[custom dog portrait]` - Exact
- `"custom dog portrait"` - Phrase
- `[custom cat portrait]` - Exact
- `"custom cat portrait"` - Phrase
- `[digital pet portraits]` - Exact
- `"digital pet portraits"` - Phrase

### 3. Canvas & Print (10 keywords)
**Target Audience:** Users looking for physical print products
- `[custom canvas prints]` - Exact
- `"custom canvas prints"` - Phrase
- `[personalized canvas art]` - Exact
- `"personalized canvas prints"` - Phrase
- `[dog canvas art]` - Exact
- `"dog canvas"` - Phrase
- `[pet canvas art]` - Exact
- `"pet canvas art"` - Phrase
- `[custom pet painting]` - Exact
- `"custom pet painting"` - Phrase

### 4. Artistic Styles (10 keywords)
**Target Audience:** Users interested in specific art styles
- `[dog oil painting]` - Exact
- `"dog oil painting"` - Phrase
- `[watercolor dog portrait]` - Exact
- `"watercolor pet portrait"` - Phrase
- `[hand painted pet portraits]` - Exact
- `"hand painted dog portraits"` - Phrase
- `[dog renaissance painting]` - Exact
- `"renaissance dog painting"` - Phrase
- `[royal pet portraits]` - Exact
- `"royal dog painting"` - Phrase

### 5. Branded & Marketplace (6 keywords)
**Target Audience:** Users searching for competitors or marketplace options
- `[crown and paw portraits]` - Exact
- `"crown and paw"` - Phrase
- `[west willow pet portraits]` - Exact
- `"willow pet portrait"` - Phrase
- `[etsy pet portraits]` - Exact
- `"etsy dog painting"` - Phrase

## Total Keywords: 46

## Implementation Status

✅ **Keywords CSV Updated:** `/src/mcp/google-ads/keywords.csv` contains all 46 keywords
✅ **Campaign Structure Defined:** 5 ad groups with targeted keyword themes
✅ **Match Types Optimized:** Mix of Exact and Phrase match for optimal coverage
✅ **MCP Integration Ready:** Keywords can be synced using `sync_keywords_from_csv()` function

## Next Steps for Campaign Activation

### 1. Google Ads Account Setup
```bash
# First, list available accounts
mcp1_list_accounts()

# Get account currency
mcp1_get_account_currency(customer_id="YOUR_CUSTOMER_ID")
```

### 2. Campaign Creation
- Create "PawPop Search" campaign in Google Ads interface
- Set up 5 ad groups: Pet Mom Gifts, Custom Pet Portraits, Canvas & Print, Artistic Styles, Branded & Marketplace

### 3. Keyword Sync
```bash
# Sync keywords to the campaign
mcp1_sync_keywords_from_csv(customer_id="YOUR_CUSTOMER_ID", campaign_name="PawPop Search")
```

### 4. Ad Copy Creation
Create responsive search ads for each ad group with:
- Headlines focusing on the ad group theme
- Descriptions highlighting PawPop's unique value proposition
- Call-to-action: "Upload Photo Now"

### 5. Landing Page Optimization
- Ensure all ads point to the main PawPop landing page
- Set up conversion tracking for photo uploads
- Implement Google Ads conversion pixel

## Keyword Strategy

### Match Type Distribution
- **Exact Match (23 keywords):** High-intent, specific searches
- **Phrase Match (23 keywords):** Broader reach while maintaining relevance

### Competitive Strategy
- **Branded & Marketplace ad group** targets competitor searches
- Allows PawPop to capture users comparing options
- Focus on unique value proposition in ad copy

### Quality Score Optimization
- Keywords are highly relevant to PawPop's service
- Ad groups are tightly themed for better Quality Scores
- Landing page relevance should be high for all keywords

## Budget Recommendations

### Initial Budget Allocation
- **Pet Mom Gifts:** 30% (highest commercial intent)
- **Custom Pet Portraits:** 25% (core service keywords)
- **Canvas & Print:** 20% (product-specific searches)
- **Artistic Styles:** 15% (style-conscious users)
- **Branded & Marketplace:** 10% (competitive capture)

### Bid Strategy
- Start with Target CPA bidding
- Set initial CPA target based on customer lifetime value
- Monitor and adjust based on conversion data

## Performance Monitoring

### Key Metrics to Track
- **Impressions:** Keyword visibility
- **Click-through Rate (CTR):** Ad relevance
- **Conversion Rate:** Landing page effectiveness
- **Cost per Acquisition (CPA):** Campaign efficiency
- **Quality Score:** Keyword and ad relevance

### Optimization Schedule
- **Daily:** Monitor spend and major performance changes
- **Weekly:** Adjust bids and pause underperforming keywords
- **Monthly:** Analyze search terms and add negative keywords

## Files Updated

1. `/src/mcp/google-ads/keywords.csv` - Complete keyword list
2. `/docs/marketing/pawpop_keywords_google_ads.csv` - Source keyword file
3. `/docs/marketing/GOOGLE_ADS_CAMPAIGN_IMPLEMENTATION.md` - This documentation

## MCP Tools Available

- `mcp1_list_accounts()` - List Google Ads accounts
- `mcp1_sync_keywords_from_csv()` - Sync keywords to campaign
- `mcp1_get_campaign_performance()` - Monitor campaign metrics
- `mcp1_manage_keywords_from_csv()` - Manage keyword list

The campaign structure is now ready for implementation in Google Ads with a comprehensive keyword strategy targeting PawPop's core audience segments.
