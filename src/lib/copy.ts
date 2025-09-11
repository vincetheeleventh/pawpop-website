// src/lib/copy.ts

/**
 * @file Centralized copy for the PawPop brand experience.
 * Includes Monsieur Brush character dialogue and whimsical content.
 */

export const landingPageCopy = {
  header: {
    logoText: 'PawPop',
    navLinks: [], // No navigation links for squeeze page
    ctaButton: 'Upload Photo Now',
  },
  hero: {
    title: 'The Unforgettable Gift for Pet Moms',
    subtitle: 'Custom portrait created from your pet\'s photo in a Renaissance masterpiece style',
    ctaButton: 'Upload Photo Now',
    characterIntro: '"Upload your photo and watch ze magic happen, mon ami!"',
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
    characterQuote: '"I guarantee you will love your transformation, mon ami!"'
  },
  process: {
    title: 'The Magical Transformation',
    subtitle: 'From ordinary photo to Renaissance masterpiece in three simple steps',
    steps: [
      {
        title: 'Upload Your Photo',
        description: 'Simply drag and drop your favorite pet mom photo. Monsieur Brush will guide you through the process.',
        icon: '📸',
        characterQuote: '"Ah, magnifique! A beautiful subject for my canvas!"',
      },
      {
        title: 'Artistic Transformation',
        description: 'Our artists use modern illustration tools with human finishing touches to transform you into the iconic Mona Lisa style.',
        icon: '🎨',
        characterQuote: '"Now I add ze artistic flair... mixing ze perfect colors..."',
      },
      {
        title: 'Your Masterpiece Revealed',
        description: 'Behold your transformation! Share your Renaissance portrait or order museum-quality prints.',
        icon: '🖼️',
        characterQuote: '"Voilà! You are now immortalized as ze Mona Lisa!"',
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
    subtitle: 'Get inspiration and be the first to see new transformations. Plus, receive exclusive offers from Monsieur Brush!',
    placeholder: 'your@email.com',
    buttonText: 'Join the Gallery',
    characterQuote: '"Oui! Join my studio for ze latest artistic inspirations!"',
  },
  pricing: {
    title: 'Bring Your Masterpiece Home',
    subtitle: 'Choose how you want to treasure your Renaissance transformation',
    options: [
      { 
        name: 'Digital Portrait', 
        price: '$29', 
        features: ['High-resolution download', 'Perfect for social sharing', 'Instant delivery'], 
        cta: 'Get Digital',
        popular: false,
        icon: '💾'
      },
      { 
        name: 'Premium Print', 
        price: '$79', 
        features: ['Museum-quality paper', 'Professional printing', 'Ready to frame'], 
        cta: 'Order Print',
        popular: true,
        icon: '🖼️'
      },
      { 
        name: 'Framed Canvas', 
        price: '$129', 
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
      email: "pawpopart@gmail.com",
      phone: "+1 604 499 7660",
      address: "2006-1323 Homer St, Vancouver BC Canada V6B 5T1"
    },
    links: {
      experience: [
        { label: "Create Your Portrait", href: "/create" },
        { label: "Gallery", href: "/gallery" },
        { label: "How It Works", href: "/process" },
        { label: "About Monsieur Brush", href: "/about" }
      ],
      support: [
        { label: "Contact Us", href: "/contact" },
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
    copyright: "© 2024 PawPop. All rights reserved. Crafted with love by Monsieur Brush."
  }
};

// Character dialogue for different states
export const monsieurBrush = {
  welcome: [
    "Bonjour! I am Monsieur Brush, your personal Renaissance artist!",
    "Ah, magnifique! Ready to become ze Mona Lisa?",
    "Welcome to my studio! Let us create something extraordinary together!"
  ],
  uploading: [
    "Ah, what a beautiful subject for my canvas!",
    "Perfect! Now I can see ze artistic potential!",
    "Magnifique photo! This will make a wonderful portrait!"
  ],
  processing: [
    "Now I work my magic... mixing ze perfect colors...",
    "Adding ze Renaissance touch... almost finished...",
    "Creating your masterpiece with ze finest artistic flair...",
    "Painting with ze skill of ze old masters..."
  ],
  success: [
    "Voilà! Your transformation is complete!",
    "Magnifique! You are now immortalized as ze Mona Lisa!",
    "Bravo! A masterpiece worthy of ze Louvre!"
  ],
  error: [
    "Ah, mon dieu! A small problem with ze canvas...",
    "Not to worry! Even ze great masters had to try again!",
    "Let us fix this together, oui?"
  ],
  encouragement: [
    "Trust ze process, mon ami!",
    "Art takes time, but ze result will be magnifique!",
    "Patience! Great art cannot be rushed!"
  ]
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
        description: "Simply drag and drop your favorite pet mom photo. Monsieur Brush will guide you through the process.",
        icon: "📸",
        characterQuote: "Ah, magnifique! A beautiful subject for my canvas!"
      },
      {
        title: "Artistic Transformation",
        description: "Our artists use modern illustration tools with human finishing touches to transform you into a classical masterpiece while preserving your unique beauty.",
        icon: "🎨",
        characterQuote: "Now I work my magic... mixing ze perfect colors..."
      },
      {
        title: "Receive Your Masterpiece",
        description: "Download your stunning digital portrait or order premium prints to treasure forever.",
        icon: "🖼️",
        characterQuote: "Voilà! A masterpiece worthy of ze Louvre!"
      }
    ]
  },
  about: {
    title: "Meet Monsieur Brush",
    subtitle: "The charming artist behind your transformations",
    story: "Born in a digital atelier in France, Monsieur Brush combines the classical techniques of Renaissance masters with modern AI artistry. His passion? Celebrating the beautiful bond between pet moms and their beloved companions."
  },
  contact: {
    title: "Get in Touch",
    subtitle: "Questions about your masterpiece? Monsieur Brush is here to help!",
    supportHours: "Support available 9 AM - 6 PM EST, Monday-Friday",
    contact: {
      email: "pawpopart@gmail.com",
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
      email: "pawpopart@gmail.com",
      phone: "+1 604 499 7660",
      address: "2006-1323 Homer St, Vancouver BC Canada V6B 5T1"
    },
    links: {
      experience: [
        { label: "Create Your Portrait", href: "/create" },
        { label: "Gallery", href: "/gallery" },
        { label: "How It Works", href: "/process" },
        { label: "About Monsieur Brush", href: "/about" }
      ],
      support: [
        { label: "Contact Us", href: "/contact" },
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
    copyright: "© 2024 PawPop. All rights reserved. Crafted with love by Monsieur Brush."
  }
};

export default landingPageCopy;
