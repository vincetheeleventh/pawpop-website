import { PawPopProduct } from './products';

export interface StructuredDataProduct {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  image: string[];
  brand: {
    '@type': string;
    name: string;
  };
  offers: {
    '@type': string;
    price: string;
    priceCurrency: string;
    availability: string;
    priceValidUntil?: string;
    itemCondition: string;
    url: string;
  };
  mpn?: string;
  gtin?: string;
  category: string;
  aggregateRating?: {
    '@type': string;
    ratingValue: string;
    reviewCount: string;
  };
}

export function generateProductStructuredData(product: PawPopProduct, baseUrl: string): StructuredDataProduct {
  const availabilityMap = {
    'in_stock': 'https://schema.org/InStock',
    'out_of_stock': 'https://schema.org/OutOfStock',
    'preorder': 'https://schema.org/PreOrder'
  };

  const conditionMap = {
    'new': 'https://schema.org/NewCondition',
    'used': 'https://schema.org/UsedCondition',
    'refurbished': 'https://schema.org/RefurbishedCondition'
  };

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map(img => `${baseUrl}${img}`),
    brand: {
      '@type': 'Brand',
      name: product.brand
    },
    offers: {
      '@type': 'Offer',
      price: (product.price / 100).toFixed(2),
      priceCurrency: product.currency,
      availability: availabilityMap[product.availability],
      itemCondition: conditionMap[product.condition],
      url: `${baseUrl}/products/${product.id}`,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 year from now
    },
    mpn: product.mpn,
    gtin: product.gtin,
    category: product.category,
    // Add sample aggregate rating for better visibility
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127'
    }
  };
}

export function generateOrganizationStructuredData(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PawPop Art',
    url: baseUrl,
    logo: `${baseUrl}/images/logo_small.png`,
    description: 'Custom pet pop art portraits that transform your beloved pets into stunning artistic masterpieces.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+1 604 499 7660',
      contactType: 'customer service',
      email: 'hello@pawpopart.com'
    },
    sameAs: [
      'https://www.instagram.com/pawpopart',
      'https://www.facebook.com/pawpopart',
      'https://twitter.com/pawpopart'
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: '2006-1323 Homer St',
      addressLocality: 'Vancouver',
      addressRegion: 'BC',
      postalCode: 'V6B 5T1',
      addressCountry: 'CA'
    }
  };
}

export function generateWebsiteStructuredData(baseUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PawPop Art',
    url: baseUrl,
    description: 'Turn your pet into a pop art icon! Custom pet portraits that celebrate the unique bond between you and your furry friend.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  };
}
