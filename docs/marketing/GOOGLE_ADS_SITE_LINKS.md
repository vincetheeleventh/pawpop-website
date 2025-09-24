# Google Ads Site Links for PawPop

Since PawPop uses a modal-based upload system that doesn't change the URL, we've created several options for Google Ads site links.

## Available Site Link URLs

### Option 1: Dedicated Upload Page (Recommended)
**URL:** `https://pawpopart.com/upload`
**Description:** "Upload Your Pet Photo"
**Benefits:**
- Clean, dedicated URL for Google Ads
- SEO-optimized with proper metadata
- Auto-opens upload modal on page load
- Professional landing experience

### Option 2: URL Parameter Auto-Open
**URL:** `https://pawpopart.com/?upload=true`
**Description:** "Start Upload"
**Benefits:**
- Uses main page with auto-open modal
- Maintains main page SEO benefits
- Seamless user experience

### Option 3: Quick Start Redirect
**URL:** `https://pawpopart.com/start`
**Description:** "Get Started"
**Benefits:**
- Short, memorable URL
- Automatically redirects to main page with upload modal
- Good for campaigns and social media

## Recommended Site Link Structure

For Google Ads campaigns, we recommend using these site links:

1. **"Upload Photo"** → `/upload`
   - Primary action, dedicated landing page
   
2. **"View Gallery"** → `/#gallery`
   - Show portfolio/gallery with smooth scroll
   
3. **"How It Works"** → `/#process`
   - Explain the process with smooth scroll
   
4. **"Reviews"** → `/#testimonials`
   - Customer testimonials and social proof

5. **"Get Started"** → `/start`
   - Alternative CTA for variety

## Available Anchor Links

✅ **Implemented anchor navigation with smooth scrolling:**

- `/#home` - Hero section with main CTA
- `/#gallery` - Gallery of example transformations  
- `/#testimonials` - Customer reviews and reactions
- `/#why` - Why choose PawPop section
- `/#process` - How it works process steps

## Implementation Details

### Upload Page Features:
- ✅ SEO-optimized metadata
- ✅ Auto-opens upload modal
- ✅ Back to home navigation
- ✅ Professional design matching main site
- ✅ Mobile-optimized

### URL Parameter System:
- ✅ `/?upload=true` auto-opens modal on main page
- ✅ Maintains all main page content and SEO
- ✅ Seamless user experience

### Analytics Tracking:
- All upload methods trigger the same Plausible/Google Ads events
- Conversion tracking works consistently across all entry points
- A/B testing for pricing variants maintained

## Navigation Features

✅ **Header Navigation (Desktop Only):**
- Gallery, Reviews, How It Works anchor links
- Upload CTA button
- Smooth scrolling with proper header offset
- Mobile shows simplified CTA only

✅ **Smooth Scrolling:**
- CSS `scroll-behavior: smooth` enabled
- 80px scroll margin offset for fixed header
- Works on all modern browsers

## Testing URLs

Before setting up Google Ads site links, test these URLs:

1. **Upload Pages:**
   - Visit `/upload` - Should show dedicated upload page with modal open
   - Visit `/?upload=true` - Should show main page with modal auto-opened
   - Visit `/start` - Should redirect to main page with modal open

2. **Anchor Navigation:**
   - Visit `/#gallery` - Should scroll to gallery section
   - Visit `/#testimonials` - Should scroll to reviews section  
   - Visit `/#process` - Should scroll to how it works section
   - Visit `/test-anchors` - Test page with all anchor links

3. **Header Navigation:**
   - Click "Gallery" in header - Should smooth scroll to gallery
   - Click "Reviews" in header - Should smooth scroll to testimonials
   - Click "How It Works" in header - Should smooth scroll to process

All URLs should provide smooth navigation and proper functionality while giving you maximum flexibility for different Google Ads campaign strategies.
