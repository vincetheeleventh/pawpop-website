// src/lib/copy.ts

/**
 * @file Centralized copy for the PawPop landing page.
 * This helps in maintaining consistency and preparing for potential future internationalization.
 */

export const landingPageCopy = {
  header: {
    logoText: 'PawPop Art',
    navLinks: [
      { text: 'How It Works', href: '#process' },
      { text: 'Reviews', href: '#reviews' },
      { text: 'Pricing', href: '#pricing' },
    ],
  },
  hero: {
    title: 'Turn Your Pet Into a Pop Art Icon',
    subtitle: 'The most unique and hilarious gift for the pet mom who has everything. A timeless treasure that is both funny and deeply personal.',
    ctaButton: 'Create Your Masterpiece',
  },
  process: {
    title: 'Our Handcrafted Process',
    steps: [
      {
        title: '1. Upload Your Photos',
        description: 'Share a photo of the lucky recipient and their beloved pet. Our artists work best with clear, well-lit images.',
      },
      {
        title: '2. Our Artists Get to Work',
        description: 'Our digital artists personally review and perfect each portrait, ensuring the likeness and personality of both human and pet shine through.',
      },
      {
        title: '3. Approve Your Artwork',
        description: 'You\'ll receive a preview of your custom pop art to approve. We want to make sure you absolutely love it before we print.',
      },
      {
        title: '4. Delivered to Your Door',
        description: 'Your one-of-a-kind artwork is professionally printed and shipped, ready to bring joy for years to come.',
      },
    ],
  },
  testimonials: {
    title: 'What Our Customers Are Saying',
    reviews: [
      {
        quote: '"I gave this to my sister for her birthday and she literally cried with laughter and joy. It\'s the best gift I\'ve ever given."',
        author: 'Sarah J., Thoughtful Sister',
      },
      {
        quote: '"The quality is amazing, and it captured my dog\'s goofy personality perfectly. It\'s now the centerpiece of our living room."',
        author: 'Mike R., Proud Dog Dad',
      },
    ],
  },
  emailCapture: {
    title: 'Get a Free Digital Wallpaper!',
    subtitle: 'Join our newsletter and get a free pop art wallpaper of your pet. Be the first to know about new styles and special offers.',
    placeholder: 'Enter your email',
    buttonText: 'Get My Freebie',
  },
  pricing: {
    title: 'Choose Your Perfect Portrait',
    // Pricing details will be fetched from Printify, but we can have placeholders.
    options: [
      { name: 'Digital Download', price: '$49', features: ['High-resolution file', 'Perfect for sharing online'], cta: 'Choose Plan' },
      { name: 'Poster Print (12x18")', price: '$79', features: ['Museum-quality paper', 'Vibrant, rich colors'], cta: 'Choose Plan' },
      { name: 'Framed Canvas (16x20")', price: '$129', features: ['Ready to hang', 'A true statement piece'], cta: 'Choose Plan' },
    ],
  },
  footer: {
    copyright: '© 2024 PawPop Art. All Rights Reserved.',
    links: [
      { text: 'FAQ', href: '/faq' },
      { text: 'Contact Us', href: '/contact' },
      { text: 'Privacy Policy', href: '/privacy' },
    ],
  },
};
