'use client';

import { useState } from 'react';
import { Image, Frame, Upload, Eye } from 'lucide-react';

interface MockupResult {
  success: boolean;
  printifyProductId: string;
  mockups: Array<{
    src: string;
    variant_ids: number[];
    position: string;
    is_default: boolean;
  }>;
  selectedVariant: {
    id: number;
    title: string;
    price: number;
  } | null;
  productDetails: {
    title: string;
    description: string;
  };
  imageUrl: string;
  size: string;
  productType: string;
}

export default function PrintifyTestPage() {
  const [imageUrl, setImageUrl] = useState('http://localhost:3000/images/final-output-test.png');
  const [productType, setProductType] = useState('art_print');
  const [size, setSize] = useState('18x24');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MockupResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateMockup = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test/printify-mockup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          productType,
          size,
          customerName: 'Test Customer'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create mockup');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-mona-cream to-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-playfair font-bold text-charcoal-frame mb-2">
            Printify Product Mockup Tester
          </h1>
          <p className="text-lg text-gray-600">
            Test how your custom images are placed on Printify products
          </p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Test Configuration</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mona-gold"
                placeholder="Enter image URL"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use existing test image or enter custom URL
              </p>
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Type
              </label>
              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mona-gold"
              >
                <option value="art_print">Fine Art Print</option>
                <option value="framed_canvas">Framed Canvas</option>
              </select>
            </div>

            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mona-gold"
              >
                <option value="12x18">12x18" (Small)</option>
                <option value="18x24">18x24" (Medium)</option>
                <option value="20x30">20x30" (Large)</option>
              </select>
            </div>
          </div>

          {/* Preview Current Image */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Source Image Preview</h3>
            <div className="flex items-center space-x-4">
              <img 
                src={imageUrl} 
                alt="Source" 
                className="w-32 h-32 object-cover rounded-lg border"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder-product.jpg';
                }}
              />
              <div className="text-sm text-gray-600">
                <p>This image will be placed on the {productType === 'art_print' ? 'art print' : 'framed canvas'}</p>
                <p>Size: {size}" ({size === '12x18' ? 'Small' : size === '18x24' ? 'Medium' : 'Large'})</p>
              </div>
            </div>
          </div>

          {/* Create Mockup Button */}
          <div className="mt-6">
            <button
              onClick={handleCreateMockup}
              disabled={loading || !imageUrl}
              className={`btn btn-primary btn-lg px-8 ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Printify Product...
                </>
              ) : (
                <>
                  <Eye className="mr-2" size={20} />
                  Create Printify Mockup
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4 text-green-700">
              ✅ Printify Product Created Successfully!
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Product Details</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p><strong>Printify ID:</strong> {result.printifyProductId}</p>
                  <p><strong>Title:</strong> {result.productDetails.title}</p>
                  <p><strong>Type:</strong> {result.productType}</p>
                  <p><strong>Size:</strong> {result.size}"</p>
                  {result.selectedVariant && (
                    <p><strong>Price:</strong> ${(result.selectedVariant.price / 100).toFixed(2)}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Source Image</h3>
                <img 
                  src={result.imageUrl} 
                  alt="Source" 
                  className="w-full max-w-xs rounded-lg border"
                />
              </div>
            </div>

            {/* Mockup Images */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Product Mockups</h3>
              <p className="text-gray-600 mb-4">
                These are the actual mockup images generated by Printify showing how your image is placed on the product:
              </p>
              
              {result.mockups.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {result.mockups.map((mockup, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <img 
                        src={mockup.src} 
                        alt={`Mockup ${index + 1}`}
                        className="w-full rounded-lg mb-2"
                      />
                      <div className="text-sm text-gray-600">
                        <p><strong>Position:</strong> {mockup.position}</p>
                        <p><strong>Default:</strong> {mockup.is_default ? 'Yes' : 'No'}</p>
                        <p><strong>Variants:</strong> {mockup.variant_ids.join(', ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic">No mockup images available yet. They may still be processing.</p>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">What You're Seeing:</h4>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• <strong>Product Details:</strong> The actual Printify product configuration</li>
                <li>• <strong>Mockup Images:</strong> How your custom image appears on the physical product</li>
                <li>• <strong>Image Placement:</strong> Printify automatically centers and scales your image</li>
                <li>• <strong>Quality Preview:</strong> These mockups show the final product quality</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
