import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById, formatProductPrice } from '@/lib/products';
import { generateProductStructuredData } from '@/lib/structured-data';
import { generateProductSEO, generateMetadata } from '@/lib/seo';
import Image from 'next/image';
import Link from 'next/link';

interface ProductPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = getProductById(params.id);
  
  if (!product) {
    return {
      title: 'Product Not Found | PawPop Art',
    };
  }

  const seoConfig = generateProductSEO(product);
  return generateMetadata(seoConfig);
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductById(params.id);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawpop.art';

  if (!product) {
    notFound();
  }

  const structuredData = generateProductStructuredData(product, baseUrl);

  return (
    <>
      {/* Product Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="relative h-96 lg:h-[500px] rounded-lg overflow-hidden">
              <Image
                src={product.images[0] || '/images/placeholder-product.jpg'}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-3 gap-4">
                {product.images.slice(1, 4).map((image, index) => (
                  <div key={index} className="relative h-24 rounded-lg overflow-hidden">
                    <Image
                      src={image}
                      alt={`${product.name} - Image ${index + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
              <p className="text-gray-600">{product.category}</p>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-blue-600">
                {formatProductPrice(product.price, product.currency)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm ${
                product.availability === 'in_stock' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {product.availability === 'in_stock' ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <div className="prose prose-lg">
              <p>{product.description}</p>
            </div>

            {/* Product Variants */}
            {product.variants && product.variants.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Available Options</h3>
                <div className="space-y-3">
                  {product.variants.map((variant) => (
                    <div key={variant.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{variant.name}</h4>
                          <p className="text-sm text-gray-600">
                            {Object.entries(variant.attributes).map(([key, value]) => 
                              `${key}: ${value}`
                            ).join(', ')}
                          </p>
                        </div>
                        <span className="font-semibold">
                          {formatProductPrice(variant.price, product.currency)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product Specifications */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-3">Product Details</h3>
              <dl className="grid grid-cols-1 gap-3">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Brand:</dt>
                  <dd className="font-medium">{product.brand}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Condition:</dt>
                  <dd className="font-medium capitalize">{product.condition}</dd>
                </div>
                {product.mpn && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Model:</dt>
                    <dd className="font-medium">{product.mpn}</dd>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Dimensions:</dt>
                    <dd className="font-medium">
                      {product.dimensions.length}" × {product.dimensions.width}" × {product.dimensions.height}"
                    </dd>
                  </div>
                )}
                {product.shippingWeight && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Weight:</dt>
                    <dd className="font-medium">{product.shippingWeight} lbs</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-4">
              <button
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={product.availability !== 'in_stock'}
              >
                {product.availability === 'in_stock' ? 'Create Custom Portrait' : 'Out of Stock'}
              </button>
              <Link
                href="/products"
                className="block w-full text-center border border-gray-300 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View All Products
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="border-t pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span>✓</span>
                  <span>100% Satisfaction Guarantee</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>✓</span>
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>✓</span>
                  <span>Fast Delivery</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>✓</span>
                  <span>Expert Artists</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Quality Guarantee</h3>
            <p className="text-gray-600">
              We're committed to delivering artwork that exceeds your expectations. 
              If you're not completely satisfied, we'll work with you to make it right.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Fast Turnaround</h3>
            <p className="text-gray-600">
              Digital portraits delivered in 3-5 business days. Physical prints 
              ship within 7-14 business days with tracking included.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Expert Artists</h3>
            <p className="text-gray-600">
              Our team combines AI technology with human creativity to ensure 
              every portrait captures your pet's unique personality.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
