import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/products';

// Google Merchant Center Product Feed
export async function GET() {
  try {
    const products = getAllProducts();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawpop.art';
    
    // Generate RSS/XML feed for Google Merchant Center
    const feedItems = products.map(product => {
      const mainVariant = product.variants?.[0];
      const imageUrl = product.images[0] ? `${baseUrl}${product.images[0]}` : '';
      
      return `
    <item>
      <g:id>${product.id}</g:id>
      <g:title><![CDATA[${product.name}]]></g:title>
      <g:description><![CDATA[${product.description}]]></g:description>
      <g:link>${baseUrl}/products/${product.id}</g:link>
      <g:image_link>${imageUrl}</g:image_link>
      <g:condition>${product.condition}</g:condition>
      <g:availability>${product.availability === 'in_stock' ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:price>${(product.price / 100).toFixed(2)} ${product.currency}</g:price>
      <g:brand>${product.brand}</g:brand>
      <g:product_type>${product.category}</g:product_type>
      <g:google_product_category>Arts &amp; Entertainment &gt; Hobbies &amp; Creative Arts &gt; Arts &amp; Crafts</g:google_product_category>
      ${product.mpn ? `<g:mpn>${product.mpn}</g:mpn>` : ''}
      ${product.gtin ? `<g:gtin>${product.gtin}</g:gtin>` : ''}
      ${product.shippingWeight ? `<g:shipping_weight>${product.shippingWeight} lb</g:shipping_weight>` : ''}
      <g:identifier_exists>${product.mpn || product.gtin ? 'yes' : 'no'}</g:identifier_exists>
      <g:custom_label_0>PawPop</g:custom_label_0>
      <g:custom_label_1>Pet Art</g:custom_label_1>
      <g:adult>no</g:adult>
    </item>`;
    }).join('');

    const xmlFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>PawPop Art Products</title>
    <link>${baseUrl}</link>
    <description>Custom pet pop art portraits and prints</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${feedItems}
  </channel>
</rss>`;

    return new NextResponse(xmlFeed, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('[MERCHANT_FEED_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Alternative JSON format for programmatic access
export async function POST() {
  try {
    const products = getAllProducts();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawpop.art';
    
    const merchantProducts = products.map(product => ({
      id: product.id,
      title: product.name,
      description: product.description,
      link: `${baseUrl}/products/${product.id}`,
      image_link: product.images[0] ? `${baseUrl}${product.images[0]}` : '',
      additional_image_links: product.images.slice(1).map(img => `${baseUrl}${img}`),
      condition: product.condition,
      availability: product.availability === 'in_stock' ? 'in_stock' : 'out_of_stock',
      price: `${(product.price / 100).toFixed(2)} ${product.currency}`,
      brand: product.brand,
      product_type: product.category,
      google_product_category: 'Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts',
      mpn: product.mpn,
      gtin: product.gtin,
      shipping_weight: product.shippingWeight ? `${product.shippingWeight} lb` : undefined,
      identifier_exists: product.mpn || product.gtin ? 'yes' : 'no',
      custom_labels: {
        custom_label_0: 'PawPop',
        custom_label_1: 'Pet Art',
        custom_label_2: product.category.split(' > ')[0],
      },
      adult: false,
    }));

    return NextResponse.json({
      products: merchantProducts,
      feed_info: {
        title: 'PawPop Art Products',
        description: 'Custom pet pop art portraits and prints',
        link: baseUrl,
        updated: new Date().toISOString(),
        total_products: merchantProducts.length,
      }
    });
  } catch (error) {
    console.error('[MERCHANT_FEED_JSON_ERROR]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
