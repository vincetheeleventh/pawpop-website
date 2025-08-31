import { Metadata } from 'next';
import { getAllProducts, formatProductPrice } from '@/lib/products';
import { generateOrganizationStructuredData, generateWebsiteStructuredData } from '@/lib/structured-data';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: 'Custom Pet Portraits & Prints | PawPop Art Products',
  description: 'Browse our collection of custom pet portrait options including digital downloads, canvas prints, and framed artwork. Transform your pet into stunning pop art!',
  keywords: 'custom pet portraits, pet art prints, canvas prints, digital pet art, framed pet portraits',
};

export default function ProductsPage() {
  const products = getAllProducts();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pawpop.art';
  
  const organizationData = generateOrganizationStructuredData(baseUrl);
  const websiteData = generateWebsiteStructuredData(baseUrl);

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationData),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteData),
        }}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Custom Pet Portraits</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your beloved pet into a stunning pop art masterpiece. Choose from digital downloads 
            or premium physical prints that celebrate your furry friend's unique personality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative h-64">
                <Image
                  src={product.images[0] || '/images/placeholder-product.jpg'}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {product.availability === 'in_stock' && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-2 py-1 rounded text-sm">
                    In Stock
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{product.description}</p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-bold text-blue-600">
                    {formatProductPrice(product.price, product.currency)}
                  </span>
                  <span className="text-sm text-gray-500">{product.category}</span>
                </div>

                {product.variants && product.variants.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 mb-2">Available options:</p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((variant) => (
                        <span
                          key={variant.id}
                          className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                        >
                          {variant.attributes.size || variant.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <Link
                  href={`/products/${product.id}`}
                  className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Your Pet's Photo</h3>
              <p className="text-gray-600">Choose your favorite high-quality photo of your pet</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Our Artists Create Magic</h3>
              <p className="text-gray-600">AI-assisted creation with human artist refinement</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Receive Your Masterpiece</h3>
              <p className="text-gray-600">Get your custom artwork delivered digitally or printed</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
