'use client';

import { useState, useEffect } from 'react';
import { Check, Star, Truck, Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface OrderData {
  petMomPhoto: string;
  petPhoto: string;
  name: string;
  email: string;
  timestamp: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  features: string[];
  popular?: boolean;
  sizes?: { name: string; price: number }[];
}

const products: Product[] = [
  {
    id: 'digital',
    name: 'High-Res Digital File',
    description: 'Perfect for social media, printing at home, or creating your own products',
    price: 29,
    features: [
      '4K Ultra High Resolution (3840×2160)',
      'Multiple formats (JPG, PNG, PDF)',
      'Instant download after creation',
      'Print rights included',
      'Perfect for social sharing'
    ]
  },
  {
    id: 'canvas',
    name: 'Premium Canvas Print',
    description: 'Museum-quality canvas with rich colors and stunning detail',
    price: 79,
    originalPrice: 99,
    popular: true,
    features: [
      'Premium cotton canvas',
      'Fade-resistant archival inks',
      'Gallery-wrapped edges',
      'Ready to hang hardware',
      'Protective UV coating'
    ],
    sizes: [
      { name: '12" × 16"', price: 79 },
      { name: '16" × 20"', price: 99 },
      { name: '20" × 24"', price: 129 }
    ]
  },
  {
    id: 'framed',
    name: 'Elegant Framed Print',
    description: 'Classic Renaissance-style frame with museum-quality print',
    price: 149,
    originalPrice: 199,
    features: [
      'Ornate gold Renaissance frame',
      'Museum-quality fine art paper',
      'Professional matting included',
      'UV-protective glass',
      'Certificate of authenticity'
    ],
    sizes: [
      { name: '11" × 14" (Matted)', price: 149 },
      { name: '16" × 20" (Matted)', price: 199 },
      { name: '20" × 24" (Matted)', price: 249 }
    ]
  },
  {
    id: 'giclee',
    name: 'Fine Art Giclée Print',
    description: 'Gallery-grade giclée on premium watercolor paper',
    price: 119,
    features: [
      'Hahnemühle fine art paper',
      '12-color archival pigment inks',
      'Hand-signed and numbered',
      'Acid-free museum board backing',
      '100+ year fade resistance'
    ],
    sizes: [
      { name: '11" × 14"', price: 119 },
      { name: '16" × 20"', price: 159 },
      { name: '16" × 24"', price: 199 }
    ]
  }
];

export default function OrderPage() {
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<{[key: string]: { size?: string; price: number }}>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const data = localStorage.getItem('pawpop-order-data');
    if (data) {
      setOrderData(JSON.parse(data));
    }
    setIsLoading(false);
  }, []);

  const handleProductSelect = (productId: string, size?: string, price?: number) => {
    setSelectedProducts(prev => {
      const newSelected = { ...prev };
      if (newSelected[productId]) {
        delete newSelected[productId];
      } else {
        newSelected[productId] = { 
          size: size || undefined, 
          price: price || products.find(p => p.id === productId)?.price || 0 
        };
      }
      return newSelected;
    });
  };

  const getTotalPrice = () => {
    return Object.values(selectedProducts).reduce((total, item) => total + item.price, 0);
  };

  const getSelectedCount = () => {
    return Object.keys(selectedProducts).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-mona-gold/30 border-t-mona-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-charcoal-frame">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-playfair font-bold text-charcoal-frame mb-4">
            No Order Found
          </h1>
          <p className="text-gray-600 mb-6">
            It looks like you haven't started an order yet. Let's create your masterpiece!
          </p>
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-mona-gold text-charcoal-frame px-6 py-3 rounded-lg font-medium hover:bg-yellow-600 transition-colors"
          >
            <ArrowLeft size={16} />
            Start Your Order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gallery-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-playfair font-bold text-charcoal-frame">
                Choose Your Masterpiece
              </h1>
              <p className="text-gray-600 mt-1">
                Hello {orderData.name}! Select your preferred format(s) below.
              </p>
            </div>
            <Link 
              href="/"
              className="flex items-center gap-2 text-charcoal-frame hover:text-gray-600 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Order Summary */}
        <div className="bg-white rounded-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-xl font-playfair font-bold text-charcoal-frame mb-4">
            Your Order Details
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-charcoal-frame">Customer</p>
              <p className="text-gray-600">{orderData.name}</p>
              <p className="text-gray-600">{orderData.email}</p>
            </div>
            <div>
              <p className="font-medium text-charcoal-frame">Photos Uploaded</p>
              <p className="text-gray-600">✓ Pet Mom Photo</p>
              <p className="text-gray-600">✓ Pet Photo</p>
            </div>
            <div>
              <p className="font-medium text-charcoal-frame">Status</p>
              <p className="text-green-600">Ready for Production</p>
              <p className="text-gray-600">Delivery in 24-48 hours</p>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {products.map((product) => (
            <div 
              key={product.id}
              className={`
                relative bg-white rounded-lg border-2 transition-all
                ${selectedProducts[product.id] 
                  ? 'border-mona-gold bg-mona-gold/5' 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              {product.popular && (
                <div className="absolute -top-3 left-4 bg-mona-gold text-charcoal-frame px-3 py-1 rounded-full text-xs font-medium">
                  Most Popular
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-playfair font-bold text-charcoal-frame">
                      {product.name}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {product.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      {product.originalPrice && (
                        <span className="text-gray-400 line-through text-sm">
                          ${product.originalPrice}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-charcoal-frame">
                        ${product.price}
                      </span>
                    </div>
                    {product.sizes && (
                      <p className="text-xs text-gray-500">Starting at</p>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <ul className="space-y-1">
                    {product.features.slice(0, 3).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check size={14} className="text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Size Options */}
                {product.sizes ? (
                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-charcoal-frame">Select Size:</p>
                    {product.sizes.map((size) => (
                      <button
                        key={size.name}
                        onClick={() => handleProductSelect(product.id, size.name, size.price)}
                        className={`
                          w-full flex items-center justify-between p-3 rounded-lg border transition-colors
                          ${selectedProducts[product.id]?.size === size.name
                            ? 'border-mona-gold bg-mona-gold/10 text-charcoal-frame'
                            : 'border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        <span className="text-sm">{size.name}</span>
                        <span className="font-medium">${size.price}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => handleProductSelect(product.id)}
                    className={`
                      w-full p-3 rounded-lg border transition-colors font-medium
                      ${selectedProducts[product.id]
                        ? 'border-mona-gold bg-mona-gold text-charcoal-frame'
                        : 'border-gray-300 hover:border-mona-gold hover:bg-mona-gold/10'
                      }
                    `}
                  >
                    {selectedProducts[product.id] ? 'Selected' : 'Select This Option'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary & Checkout */}
        {getSelectedCount() > 0 && (
          <div className="bg-white rounded-lg p-6 border border-gray-200 sticky bottom-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-playfair font-bold text-charcoal-frame">
                  Order Summary
                </h3>
                <p className="text-sm text-gray-600">
                  {getSelectedCount()} item{getSelectedCount() > 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-charcoal-frame">
                  ${getTotalPrice()}
                </p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>

            {/* Selected Items */}
            <div className="space-y-2 mb-4">
              {Object.entries(selectedProducts).map(([productId, selection]) => {
                const product = products.find(p => p.id === productId);
                if (!product) return null;
                
                return (
                  <div key={productId} className="flex items-center justify-between text-sm">
                    <span className="text-charcoal-frame">
                      {product.name}
                      {selection.size && ` (${selection.size})`}
                    </span>
                    <span className="font-medium">${selection.price}</span>
                  </div>
                );
              })}
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 mb-6 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Shield size={14} className="text-green-500" />
                Secure Checkout
              </div>
              <div className="flex items-center gap-1">
                <Truck size={14} className="text-blue-500" />
                Fast Shipping
              </div>
              <div className="flex items-center gap-1">
                <Star size={14} className="text-yellow-500" />
                100% Satisfaction
              </div>
            </div>

            {/* Checkout Button */}
            <button className="w-full bg-mona-gold text-charcoal-frame py-4 rounded-lg font-medium text-lg hover:bg-yellow-600 transition-colors">
              Proceed to Checkout - ${getTotalPrice()}
            </button>

            <p className="text-center text-xs text-gray-500 mt-3">
              Your masterpiece will be created and delivered within 24-48 hours
            </p>
          </div>
        )}

        {/* Empty State */}
        {getSelectedCount() === 0 && (
          <div className="text-center py-12">
            <h3 className="text-xl font-playfair font-bold text-charcoal-frame mb-2">
              Select Your Products
            </h3>
            <p className="text-gray-600">
              Choose one or more formats for your custom Mona Lisa portrait
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
