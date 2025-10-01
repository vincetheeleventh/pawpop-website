// src/lib/copy.ts

/**
 * @file Centralized copy for the PawPop brand experience.
 * Includes dynamic pricing based on A/B test variants.
 */

import { getPriceConfig, PRICE_VARIANTS, type PriceVariantConfig } from './plausible';

export const landingPageCopy = {
  header: {
    navLinks: [], // No navigation links for squeeze page
    ctaButton: 'Start',
  },
  hero: {
    title: 'Pet Mom, But Make it Mona Lisa',
    subtitle: 'Create a masterpiece simply by uploading a photo of a pet mom and their pet. See your custom artwork before you buy.',
    ctaButton: 'Make My Masterpiece',
    subCta: 'Takes about 3 minutes',
  },
  examples: {
    title: 'From Photo to Masterpiece',
    subtitle: 'See the magic happen with real transformations',
    pairs: [
      {
        before: '/images/test headshots/Screenshot_2.jpg',
        after: '/images/hero_1.jpeg',
        altText: 'Sarah & Bella → Renaissance Masterpiece'
      },
      {
        before: '/images/test headshots/image_50438145 (1).JPG',
        after: '/images/pet-integration-output.jpg',
        altText: 'Jennifer & Muffin → Classical Portrait'
      },
      {
        before: '/images/test headshots/Screen Shot 2023-11-30 at 11.48.13 AM.png',
        after: '/images/flux-test-output.png',
        altText: 'Lisa & Charlie → Artistic Transformation'
      }
    ]
  },
  reactions: {
    title: 'The Look on Their Face Says It All',
    subtitle: 'Real reactions from pet moms who received their masterpieces',
    testimonials: [
      {
        quote: "The look on her face was priceless! Best gift I've ever given. She immediately hung it in her living room.",
        author: 'Sarah M.',
        petName: 'Bella',
        emoji: '🎁'
      },
      {
        quote: "I couldn't stop laughing and crying at the same time. It's so beautiful and captures both me and Muffin perfectly!",
        author: 'Jennifer K.',
        petName: 'Muffin',
        emoji: '❤️'
      },
      {
        quote: "My wife was speechless. The quality is museum-level and it shows how much I pay attention to what makes her happy.",
        author: 'David R.',
        petName: 'Charlie',
        emoji: '🐾'
      },
      {
        quote: "Everyone at work keeps asking about the painting in my office. It's such a conversation starter!",
        author: 'Maria L.',
        petName: 'Luna',
        emoji: '🎨'
      },
      {
        quote: "I've never seen my mom so happy. She calls it her 'royal portrait' and shows it to everyone who visits.",
        author: 'Alex T.',
        petName: 'Max',
        emoji: '👑'
      }
    ]
  },
  whyPawPop: {
    title: 'Why PawPop?',
    items: [
      {
        icon: '⭐',
        title: '10,000+ Happy Pet Moms',
        description: 'Join thousands who\'ve become Renaissance masterpieces'
      },
      {
        icon: '🎨',
        title: 'Handcrafted Process',
        description: 'Made to order, one of a kind portraits refined by our artists'
      },
      {
        icon: '💕',
        title: '100% Satisfaction Guarantee',
        description: 'Love your masterpiece or get your money back'
      }
    ],
  },
  process: {
    title: 'The Magical Transformation',
    subtitle: 'From ordinary photo to Renaissance masterpiece in three simple steps',
    steps: [
      {
        title: 'Upload Your Photo',
        description: 'Simply drag and drop your favorite pet mom photo.',
        icon: '📸',
      },
      {
        title: 'Artistic Transformation',
        description: 'Our artists use modern illustration tools with human finishing touches to transform you into the iconic Mona Lisa style.',
        icon: '🎨',
      },
      {
        title: 'Your Masterpiece Revealed',
        description: 'Behold your transformation! Share your Renaissance portrait or order museum-quality prints.',
        icon: '🖼️',
      },
    ],
  },
  testimonials: {
    title: 'Pet Moms Love Their Transformations',
    subtitle: 'See what happens when ordinary photos become extraordinary art',
    reviews: [
      {
        quote: '"The look on her face was priceless! Best gift I\'ve ever given. She immediately hung it in her living room and now everyone asks about it."',
        author: 'Sarah M.',
        relationship: 'Thoughtful Daughter',
        petName: 'Bella',
        image: '/images/testimonial-sarah.jpg',
      },
      {
        quote: '"I couldn\'t stop laughing and crying at the same time. It\'s so beautiful and captures both me and Muffin perfectly. Pure magic!"',
        author: 'Jennifer K.',
        relationship: 'Cat Mom',
        petName: 'Muffin',
        image: '/images/testimonial-jennifer.jpg',
      },
      {
        quote: '"My wife was speechless. The quality is museum-level and it shows how much I pay attention to what makes her happy."',
        author: 'David R.',
        relationship: 'Loving Husband',
        petName: 'Charlie',
        image: '/images/testimonial-david.jpg',
      },
    ],
  },
  emailCapture: {
    title: 'Join the Gallery of Pet Moms',
    subtitle: 'Get inspiration and be the first to see new transformations. Plus, receive exclusive offers!',
    placeholder: 'your@email.com',
    buttonText: 'Join the Gallery',
  },
  pricing: {
    title: 'Bring Your Masterpiece Home',
    subtitle: 'Choose how you want to treasure your Renaissance transformation',
    options: [
      { 
        name: 'Digital Portrait', 
        price: '$15', 
        features: ['High-resolution download', 'Perfect for social sharing', 'Instant delivery'], 
        cta: 'Get Digital',
        popular: false,
        icon: '💾'
      },
      { 
        name: 'Premium Print', 
        price: '$29', 
        features: ['Museum-quality fine art paper (285 g/m²)', 'Professional printing', 'Ready to frame'], 
        cta: 'Order Print',
        popular: true,
        icon: '🖼️'
      },
      { 
        name: 'Framed Canvas', 
        price: '$99', 
        features: ['Gallery-wrapped canvas', 'Ready to hang', 'Lifetime quality'], 
        cta: 'Order Canvas',
        popular: false,
        icon: '🏛️'
      },
    ],
  },
  footer: {
    brand: {
      name: "PawPop",
      description: "Transform your beloved pet into stunning Renaissance masterpieces. Where handcrafted artistry meets the timeless bond between pet moms and their furry companions."
    },
    characterMessage: "Merci for visiting my atelier! Remember, every pet mom deserves to be immortalized as a Renaissance masterpiece with her beloved companion.",
    contact: {
      email: "hello@pawpopart.com",
      phone: "+1 604 499 7660",
      address: "2006-1323 Homer St, Vancouver BC Canada V6B 5T1"
    },
    links: {
      experience: [
        { label: "Create Your Portrait", href: "/create" },
        { label: "Gallery", href: "/gallery" },
        { label: "How It Works", href: "/process" },
        { label: "About Us", href: "/about" }
      ],
      support: [
        { label: "About Us", href: "/about" },
        { label: "Help Center", href: "/help" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" }
      ]
    },
    social: [
      { name: "Instagram", href: "https://www.instagram.com/pawpopart", icon: "📸" },
      { name: "Facebook", href: "https://www.facebook.com/pawpopart", icon: "👥" },
      { name: "Twitter", href: "https://twitter.com/pawpopart", icon: "🐦" }
    ],
    copyright: "© 2024 PawPop. All rights reserved."
  }
};


// Page-specific content
export const pageContent = {
  gallery: {
    title: "Gallery of Transformations",
    subtitle: "See how pet moms become Renaissance masterpieces",
    filterLabels: {
      all: "All Portraits",
      dogs: "Dog Moms",
      cats: "Cat Moms",
      other: "Other Pets"
    }
  },
  process: {
    title: "The Art of Transformation",
    subtitle: "Discover how we turn ordinary photos into Renaissance masterpieces",
    steps: [
      {
        title: "Upload Your Photo",
        description: "Simply drag and drop your favorite pet mom photo.",
        icon: "📸",
      },
      {
        title: "Artistic Transformation",
        description: "Our artists use modern illustration tools with human finishing touches to transform you into a classical masterpiece while preserving your unique beauty.",
        icon: "🎨",
      },
      {
        title: "Receive Your Masterpiece",
        description: "Download your stunning digital portrait or order premium prints to treasure forever.",
        icon: "🖼️",
      }
    ]
  },
  about: {
    title: "About PawPop",
    subtitle: "Creating beautiful Renaissance-style portraits",
    story: "PawPop combines classical Renaissance art techniques with modern tools to create stunning portraits that celebrate the beautiful bond between pet moms and their beloved companions."
  },
  contact: {
    title: "Get in Touch",
    subtitle: "Questions about your masterpiece? We're here to help!",
    supportHours: "Support available 9 AM - 6 PM EST, Monday-Friday",
    contact: {
      email: "hello@pawpopart.com",
      phone: "+1 604 499 7660",
      address: "2006-1323 Homer St, Vancouver BC Canada V6B 5T1"
    }
  },
  footer: {
    brand: {
      name: "PawPop",
      description: "Transform your beloved pet into stunning Renaissance masterpieces. Where handcrafted artistry meets the timeless bond between pet moms and their furry companions."
    },
    characterMessage: "Merci for visiting my atelier! Remember, every pet mom deserves to be immortalized as a Renaissance masterpiece with her beloved companion.",
    contact: {
      email: "hello@pawpopart.com",
      phone: "+1 604 499 7660",
      address: "2006-1323 Homer St, Vancouver BC Canada V6B 5T1"
    },
    links: {
      experience: [
        { label: "Create Your Portrait", href: "/create" },
        { label: "Gallery", href: "/gallery" },
        { label: "How It Works", href: "/process" },
        { label: "About Us", href: "/about" }
      ],
      support: [
        { label: "About Us", href: "/about" },
        { label: "Help Center", href: "/help" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" }
      ]
    },
    social: [
      { name: "Instagram", href: "https://www.instagram.com/pawpopart", icon: "📸" },
      { name: "Facebook", href: "https://www.facebook.com/pawpopart", icon: "👥" },
      { name: "Twitter", href: "https://twitter.com/pawpopart", icon: "🐦" }
    ],
    copyright: "© 2024 PawPop. All rights reserved."
  }
};

/**
 * Get dynamic pricing based on current A/B test variant or explicit variant
 * @param explicitVariant - Optional variant override (e.g., from database or URL)
 */
export function getDynamicPricing(explicitVariant?: 'A' | 'B') {
  try {
    const priceConfig = explicitVariant 
      ? PRICE_VARIANTS[explicitVariant]
      : getPriceConfig();
    
    return {
      title: 'Bring Your Masterpiece Home',
      subtitle: 'Choose how you want to treasure your Renaissance transformation',
      variant: priceConfig.variant,
      variantLabel: priceConfig.label,
      options: [
        { 
          name: 'Digital Portrait', 
          price: `$${priceConfig.digital}`, 
          numericPrice: priceConfig.digital,
          features: ['High-resolution download', 'Perfect for social sharing', 'Instant delivery'], 
          cta: 'Get Digital',
          popular: false,
          icon: '💾'
        },
        { 
          name: 'Premium Print', 
          price: `$${priceConfig.print}`, 
          numericPrice: priceConfig.print,
          features: ['Museum-quality fine art paper (285 g/m²)', 'Professional printing', 'Ready to frame'], 
          cta: 'Order Print',
          popular: true,
          icon: '🖼️'
        },
        { 
          name: 'Framed Canvas', 
          price: `$${priceConfig.canvasFramed}`, 
          numericPrice: priceConfig.canvasFramed,
          features: ['Gallery-wrapped canvas', 'Ready to hang', 'Lifetime quality'], 
          cta: 'Order Canvas',
          popular: false,
          icon: '🏛️'
        },
      ],
    };
  } catch (error) {
    console.error('Error getting dynamic pricing, falling back to static:', error);
    // Fallback to static pricing (Variant A)
    return {
      ...landingPageCopy.pricing,
      variant: 'A' as const,
      variantLabel: 'Standard Pricing',
      options: landingPageCopy.pricing.options.map(option => ({
        ...option,
        numericPrice: parseInt(option.price.replace('$', ''))
      }))
    };
  }
}

export default landingPageCopy;
