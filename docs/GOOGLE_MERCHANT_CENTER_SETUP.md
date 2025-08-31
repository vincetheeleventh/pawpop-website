# Google Merchant Center Setup Guide

This guide walks you through setting up Google Merchant Center for PawPop Art to enable Google Shopping ads and product listings.

## ✅ Completed Implementation

All required components have been implemented for Google Merchant Center compliance:

### 1. Product Data Structure
- **File**: `src/lib/products.ts`
- **Features**: Complete product catalog with all required fields (price, availability, brand, etc.)
- **Products**: 4 main products with variants (digital downloads, canvas prints, framed prints)

### 2. Product Feed API
- **Endpoint**: `/api/merchant-feed`
- **Format**: Google Merchant Center XML feed
- **Access**: `GET https://pawpop.art/api/merchant-feed`
- **Alternative**: JSON format via `POST https://pawpop.art/api/merchant-feed`

### 3. Structured Data (Schema.org)
- **File**: `src/lib/structured-data.ts`
- **Implementation**: JSON-LD markup for products, organization, and website
- **Coverage**: All product pages include proper structured data

### 4. SEO & Meta Tags
- **File**: `src/lib/seo.ts`
- **Features**: Enhanced meta tags, Open Graph, Twitter Cards
- **Product Pages**: Individual SEO optimization for each product

### 5. Legal Pages (Required by Google)
- **Privacy Policy**: `/privacy`
- **Terms of Service**: `/terms`
- **Return Policy**: `/returns`
- **Contact Page**: `/contact`

### 6. Product Catalog
- **Product Listing**: `/products`
- **Individual Products**: `/products/[id]`
- **Features**: Full product details, images, pricing, variants

### 7. Technical Requirements
- **Sitemap**: `/sitemap.xml`
- **Business Information**: Complete contact details and business hours
- **SSL**: Ensure HTTPS is enabled (required by Google)

## 🚀 Next Steps for Google Merchant Center

### 1. Set Up Environment Variables
Copy `.env.example` to `.env.local` and fill in:
```bash
NEXT_PUBLIC_BASE_URL=https://pawpop.art
GOOGLE_SITE_VERIFICATION=your_verification_code
```

### 2. Create Google Merchant Center Account
1. Go to [Google Merchant Center](https://merchants.google.com/)
2. Create account and verify your website
3. Add business information

### 3. Submit Product Feed
1. In Merchant Center, go to "Products" → "Feeds"
2. Create new feed with these settings:
   - **Feed name**: PawPop Products
   - **Input method**: Scheduled fetch
   - **Feed URL**: `https://pawpop.art/api/merchant-feed`
   - **Frequency**: Daily
   - **Time**: 2:00 AM (your timezone)

### 4. Verify Website Ownership
1. Add Google Site Verification meta tag to your site
2. Or upload HTML file to your domain
3. Verify in Google Search Console

### 5. Set Up Google Ads (Optional)
1. Link Google Ads account to Merchant Center
2. Create Shopping campaigns
3. Set up product groups and bidding

## 📋 Google Merchant Center Requirements Checklist

### ✅ Website Requirements
- [x] Secure website (HTTPS)
- [x] Clear navigation and professional design
- [x] Contact information clearly displayed
- [x] Privacy policy accessible
- [x] Terms of service accessible
- [x] Return/refund policy accessible

### ✅ Product Requirements
- [x] Clear product titles and descriptions
- [x] High-quality product images
- [x] Accurate pricing information
- [x] Product availability status
- [x] Shipping information
- [x] Product categories

### ✅ Technical Requirements
- [x] Structured data markup (Schema.org)
- [x] Product feed (XML/RSS format)
- [x] Sitemap.xml
- [x] Mobile-friendly design
- [x] Fast loading times

### ✅ Business Requirements
- [x] Valid business address
- [x] Customer service contact information
- [x] Clear business hours
- [x] Professional email address

## 🔧 Feed Validation

Test your product feed:
1. Visit: `https://pawpop.art/api/merchant-feed`
2. Validate XML structure
3. Check all required fields are present
4. Verify product URLs are accessible

## 📊 Monitoring & Optimization

### Key Metrics to Track:
- Product approval rate in Merchant Center
- Click-through rates on Shopping ads
- Conversion rates from Shopping traffic
- Product feed errors and warnings

### Regular Maintenance:
- Update product availability daily
- Monitor for policy violations
- Keep product information current
- Optimize product titles and descriptions

## 🚨 Common Issues & Solutions

### Product Disapprovals
- **Missing GTIN**: Add product identifiers where applicable
- **Poor image quality**: Use high-resolution images (800x800px minimum)
- **Misleading prices**: Ensure prices match website exactly

### Feed Errors
- **Invalid URLs**: Check all product URLs are accessible
- **Missing required fields**: Verify all mandatory fields are included
- **Encoding issues**: Ensure proper UTF-8 encoding

## 📞 Support

For technical issues with the implementation:
- Check the API endpoints are working
- Verify environment variables are set
- Test product pages load correctly
- Validate structured data with Google's Rich Results Test

## 🎯 Expected Timeline

- **Feed setup**: 1-2 hours
- **Google review**: 3-7 business days
- **Product approval**: 1-3 business days per product
- **Shopping ads live**: 1-2 days after approval

Your PawPop website is now fully prepared for Google Merchant Center submission!
