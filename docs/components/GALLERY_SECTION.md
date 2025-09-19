# Gallery Section Documentation

## Overview

The Gallery Section is an adaptive multi-image carousel component that displays PawPop artwork examples using the react-multi-carousel library. It provides a responsive design that shows 1 image on mobile portrait, and 3 images on landscape/desktop with partial next/prev visibility and smooth horizontal scrolling.

## Features

### Adaptive Multi-Image Display
- **Mobile Portrait**: 1 image at full width (100% screen width) with visible title
- **Mobile Landscape & Tablet**: 3 images with partial next/prev visibility
- **Desktop**: 3 images with enhanced partial visibility (40px gutter)
- **No Cropping**: Uses `object-contain` to show full vertical length of images
- **Touch-Friendly Navigation**: Swipe gestures and large touch targets
- **Consistent Branding**: Gallery title and description visible on all devices

### Navigation
- **Smooth Horizontal Scrolling**: Slides multiple images smoothly
- **Partial Visibility**: Shows edges of next/prev images to indicate more content
- **Arrow Buttons**: Touch-friendly arrow buttons with backdrop blur
- **Dot Indicators**: Bottom navigation dots for direct navigation
- **Keyboard Support**: Arrow keys for navigation
- **Infinite Loop**: Seamless wrapping from last to first set

### Animation & Interactions
- **300ms Transitions**: Smooth slide animations with hardware acceleration
- **Partial Image Scaling**: Next/prev images scale and fade for depth effect
- **Hover Effects**: Partial images become more prominent on hover
- **Touch Momentum**: Responsive swipe tracking with momentum

## Technical Implementation

### Dependencies
- `react-multi-carousel`: Multi-image carousel functionality
- `react-multi-carousel/lib/styles.css`: Base styles

### Responsive Breakpoints
```tsx
const responsive = {
  desktop: {
    breakpoint: { max: 3000, min: 1024 },
    items: 3,
    slidesToSlide: 1,
    partialVisibilityGutter: 40 // Shows partial next/prev images
  },
  tablet: {
    breakpoint: { max: 1024, min: 768 },
    items: 3,
    slidesToSlide: 1,
    partialVisibilityGutter: 30
  },
  mobile: {
    breakpoint: { max: 768, min: 0 },
    items: 1,
    slidesToSlide: 1,
    partialVisibilityGutter: 0 // Full width on mobile portrait
  }
};
```

### Carousel Configuration
```tsx
<Carousel
  responsive={responsive}
  infinite={true}
  autoPlay={false}
  keyBoardControl={true}
  customTransition="transform 300ms ease-in-out"
  transitionDuration={300}
  swipeable={true}
  draggable={true}
  partialVisible={true}
  showDots={true}
  arrows={true}
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
