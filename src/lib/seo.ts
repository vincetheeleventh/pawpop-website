import { Metadata } from 'next';
import { PawPopProduct } from './products';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  product?: PawPopProduct;
}

export function generateMetadata(config: SEOConfig): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawpop.art';
  const defaultImage = `${baseUrl}/images/pawpop-og-image.jpg`;
  
  const metadata: Metadata = {
    title: config.title,
    description: config.description,
    keywords: config.keywords?.join(', '),
    
    // Open Graph
    openGraph: {
      title: config.title,
      description: config.description,
      url: config.canonicalUrl || baseUrl,
      siteName: 'PawPop Art',
      images: [
        {
          url: config.ogImage || defaultImage,
          width: 1200,
          height: 630,
          alt: config.title,
        }
      ],
      locale: 'en_US',
      type: config.ogType || 'website',
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: config.title,
      description: config.description,
      images: [config.ogImage || defaultImage],
      creator: '@pawpopart',
      site: '@pawpopart',
    },
    
    // Additional meta tags
    other: {
      'google-site-verification': process.env.GOOGLE_SITE_VERIFICATION || '',
      'facebook-domain-verification': process.env.FACEBOOK_DOMAIN_VERIFICATION || '',
    },
  };

  // Add product-specific metadata
  if (config.product) {
    const product = config.product;
    metadata.openGraph = {
      ...metadata.openGraph,
      images: product.images.map(img => ({
        url: `${baseUrl}${img}`,
        width: 800,
        height: 800,
        alt: product.name,
      })),
    };
    
    // Add product schema to other meta tags  
    const productMeta: Record<string, string> = {
      'product:price:amount': (product.price / 100).toString(),
      'product:price:currency': product.currency,
    };
    
    metadata.other = {
      ...metadata.other,
      ...productMeta,
    };
  }

  return metadata;
}

export const defaultSEOConfig: SEOConfig = {
  title: 'PawPop Art - Custom Pet Pop Art Portraits | Turn Your Pet Into Art',
  description: 'Transform your beloved pet into a stunning pop art masterpiece! Custom pet portraits that celebrate the unique bond between you and your furry friend. Digital downloads and premium prints available.',
  keywords: [
    'custom pet portraits',
    'pet pop art',
    'dog portraits',
    'cat portraits',
    'pet art',
    'custom pet art',
    'personalized pet gifts',
    'pet memorial art',
    'pop art portraits',
    'pet canvas prints',
    'digital pet art',
    'pet lover gifts'
  ],
  canonicalUrl: process.env.NEXT_PUBLIC_BASE_URL || 'https://pawpop.art',
  ogType: 'website'
};

export function generateProductSEO(product: PawPopProduct): SEOConfig {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawpop.art';
  
  return {
    title: `${product.name} | PawPop Art`,
    description: product.description,
    keywords: [
      'custom pet portrait',
      'pet pop art',
      product.name.toLowerCase(),
      'personalized pet gift',
      'pet art commission',
      'dog portrait',
      'cat portrait'
    ],
    canonicalUrl: `${baseUrl}/products/${product.id}`,
    ogImage: product.images[0] ? `${baseUrl}${product.images[0]}` : undefined,
    ogType: 'website',
    product
  };
}
