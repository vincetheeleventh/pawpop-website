# Gallery Section Documentation

## Overview

The Gallery Section is a responsive image carousel component that displays PawPop artwork examples using the react-responsive-carousel library. It provides a mobile-first design with full-width images on mobile devices and touch-friendly navigation.

## Features

### Mobile-First Design
- **Full Width on Mobile**: Images take up 100% of the mobile screen width in portrait mode
- **Touch-Friendly Navigation**: Swipe gestures and large touch targets for arrows and dots
- **Responsive Heights**: Images maintain their aspect ratio with maximum height constraints
- **No Cropping**: Uses `object-contain` to show full vertical length of images

### Navigation
- **Swipe Gestures**: Left/right swipe to navigate between images
- **Arrow Buttons**: Touch-friendly arrow buttons on left and right edges
- **Dot Indicators**: Bottom navigation dots for direct image selection
- **Keyboard Support**: Arrow keys for navigation
- **Infinite Loop**: Seamless wrapping from last to first image

### Animation
- **Smooth Transitions**: 300ms slide animations
- **Dynamic Height**: Carousel adjusts height based on each image's dimensions
- **Touch Momentum**: Responsive swipe tracking with momentum

## Technical Implementation

### Dependencies
- `react-responsive-carousel`: Main carousel functionality
- `react-responsive-carousel/lib/styles/carousel.min.css`: Base styles

### Component Structure
```tsx
<section className="w-full bg-site-bg py-0 md:py-12">
  <div className="w-full">
    {/* Desktop Title (hidden on mobile) */}
    <div className="hidden md:block text-center mb-8 px-6">
      <h2>Gallery</h2>
      <p>See what we've created for other pet moms</p>
    </div>

    {/* Full-width Carousel */}
    <div className="w-full px-0 md:px-6">
      <Carousel {...props}>
        {galleryImages.map((image, index) => (
          <div key={index} className="relative w-full">
            <img src={image.src} alt={image.alt} />
          </div>
        ))}
      </Carousel>
    </div>
  </div>
</section>
```

### Carousel Configuration
```tsx
<Carousel
  showArrows={true}
  showStatus={false}
  showIndicators={true}
  infiniteLoop={true}
  useKeyboardArrows={true}
  autoPlay={false}
  swipeable={true}
  emulateTouch={true}
  dynamicHeight={true}
  transitionTime={300}
  interval={5000}
  showThumbs={false}
/>
```

### Image Styling
- **Width**: `w-full` (100% width)
- **Height**: `h-auto` (maintains natural aspect ratio)
- **Object Fit**: `object-contain object-center` (no cropping)
- **Loading**: First image `eager`, others `lazy`
- **No Height Constraints**: Images display at their natural dimensions

### Mobile Optimizations
- **Full Viewport Width**: Uses CSS tricks to break out of container constraints
- **Touch-Friendly Controls**: Minimum 44px touch targets
- **Backdrop Blur**: Semi-transparent arrow backgrounds
- **Optimized Transitions**: Hardware-accelerated animations

## Gallery Images

The component displays 5 images from `/public/images/gallery/`:
1. `1.jpg` - PawPop artwork example 1
2. `2.jpg` - PawPop artwork example 2  
3. `3.jpg` - PawPop artwork example 3
4. `4.jpg` - PawPop artwork example 4
5. `5.jpg` - PawPop artwork example 5

## Accessibility

### ARIA Labels
- Arrow buttons: `aria-label="Previous image"` / `aria-label="Next image"`
- Dot indicators: `aria-label="Go to slide {index + 1}"`
- Images: Descriptive `alt` attributes

### Keyboard Navigation
- Arrow keys for navigation
- Tab navigation for controls
- Enter/Space to activate buttons

### Touch Accessibility
- Large touch targets (40px minimum)
- Touch manipulation optimization
- Swipe gesture support

## Performance

### Image Loading
- **Lazy Loading**: Only first image loads immediately
- **Optimized Formats**: JPEG images with appropriate compression
- **Responsive Sizing**: Images scale based on viewport

### Animation Performance
- **Hardware Acceleration**: CSS transforms for smooth animations
- **Optimized Transitions**: 300ms duration for responsive feel
- **Dynamic Height**: Smooth height transitions between images

## Testing

The component includes comprehensive tests covering:
- Component rendering and structure
- Navigation functionality (arrows, dots, swipe)
- Accessibility attributes
- Mobile-responsive behavior
- Image loading strategies
- CSS class applications

### Test File
`/tests/components/GallerySection.test.tsx`

## Usage

```tsx
import { GallerySection } from '@/components/landing/GallerySection';

export default function LandingPage() {
  return (
    <div>
      <HeroSection />
      <GallerySection />
      <ExamplesSection />
    </div>
  );
}
```

## Design System Integration

### Colors
- **Background**: `bg-site-bg` (#F5EED7 - warm cream)
- **Primary CTA**: `bg-atomic-tangerine` for active dot indicators
- **Secondary**: `bg-white/60` for inactive dots
- **Overlay**: Subtle gradient for better contrast

### Typography
- **Title**: `font-arvo` (Arvo serif font)
- **Body**: Standard text colors from design system

### Spacing
- **Mobile**: No padding for full-width effect
- **Desktop**: `px-6` for contained layout
- **Vertical**: `py-0` on mobile, `py-12` on desktop

## Browser Support

- **Modern Browsers**: Full feature support
- **Touch Devices**: Optimized swipe gestures
- **Keyboard Navigation**: Full accessibility support
- **Screen Readers**: Proper ARIA labels and structure

## Future Enhancements

Potential improvements:
1. **Lazy Loading**: Implement intersection observer for better performance
2. **Image Optimization**: Add next/image integration
3. **Preloading**: Preload adjacent images for smoother navigation
4. **Analytics**: Track image interaction for optimization
5. **Dynamic Content**: Load images from CMS or API
