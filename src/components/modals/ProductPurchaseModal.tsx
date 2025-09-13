'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface Mockup {
  type: string
  title: string
  description: string
  mockupUrl: string
  productId: string
  size: string
}

interface ProductPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
  productType: string
  mockups: Mockup[]
  artwork: {
    id: string
    pet_name?: string
    customer_name: string
    generated_image_url: string
  }
  onProductClick?: (productType: string, mockups: Mockup[]) => void
}

const PRODUCT_PRICING = {
  art_print: {
    '12x18': { price: 49, originalPrice: 59 },
    '18x24': { price: 69, originalPrice: 79 },
    '20x30': { price: 89, originalPrice: 99 }
  },
  canvas_stretched: {
    '12x18': { price: 89, originalPrice: 109 },
    '18x24': { price: 129, originalPrice: 149 },
    '20x30': { price: 169, originalPrice: 199 }
  },
  canvas_framed: {
    '12x18': { price: 149, originalPrice: 179 },
    '18x24': { price: 199, originalPrice: 229 },
    '20x30': { price: 249, originalPrice: 289 }
  }
}

// Create fallback mockups for all sizes when real mockups aren't available
const createFallbackMockups = (productType: string, artworkUrl: string): Mockup[] => {
  const sizes = ['12x18', '18x24', '20x30']
  return sizes.map(size => ({
    type: productType,
    title: productType === 'art_print' ? `Premium Art Print (${size}")` : 
           productType === 'canvas_stretched' ? `Canvas Stretched (${size}")` : 
           `Canvas Framed (${size}")`,
    description: productType === 'art_print' ? 'Museum-quality paper' :
                productType === 'canvas_stretched' ? 'Gallery-wrapped, ready to hang' :
                'Professional framing included',
    mockupUrl: artworkUrl,
    productId: `fallback-${productType}-${size}`,
    size: size
  }))
}

export default function ProductPurchaseModal({ 
  isOpen, 
  onClose, 
  productType, 
  mockups, 
  artwork,
  onProductClick 
}: ProductPurchaseModalProps) {
  const [selectedSize, setSelectedSize] = useState('20x30')
  const [showUpsell, setShowUpsell] = useState(false)

  if (!isOpen) return null

  const productTitle = productType === 'art_print' ? 'Premium Art Print' : 
                      productType === 'canvas_stretched' ? 'Canvas Stretched' : 'Canvas Framed'
  
  const productDescription = productType === 'art_print' ? 'Museum-quality paper with archival inks' :
                            productType === 'canvas_stretched' ? 'Gallery-wrapped canvas, ready to hang' : 
                            'Professional framing with museum-quality canvas'

  // Use provided mockups or create fallbacks
  const allMockups = mockups.length > 0 ? mockups : createFallbackMockups(productType, artwork.generated_image_url)
  const selectedMockup = allMockups.find(m => m.size === selectedSize) || allMockups[0]
  const pricing = PRODUCT_PRICING[productType as keyof typeof PRODUCT_PRICING] || PRODUCT_PRICING.canvas_stretched

  const handlePurchase = () => {
    // Handle purchase logic here
    console.log('Purchase:', { productType, size: selectedSize, artwork: artwork.id })
  }

  const handleUpsell = () => {
    if (productType === 'canvas_stretched') {
      setShowUpsell(true)
    }
  }

  const handleUpsellAccept = () => {
    // Switch to framed canvas by closing current modal and opening framed canvas modal
    setShowUpsell(false)
    onClose()
    
    // Trigger parent component to open framed canvas modal
    if (onProductClick) {
      const framedMockups = createFallbackMockups('canvas_framed', artwork.generated_image_url)
      onProductClick('canvas_framed', framedMockups)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-playfair font-bold text-charcoal-frame">
            {productTitle}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Mockup Display */}
            <div className="space-y-4">
              <div className="bg-gray-100 rounded-lg p-6">
                {selectedMockup ? (
                  <img 
                    src={selectedMockup.mockupUrl}
                    alt={`${productTitle} - ${selectedSize}`}
                    className="w-full h-64 object-contain rounded"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-200 rounded flex items-center justify-center">
                    <p className="text-gray-500">Mockup preview</p>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 text-center">
                {productDescription}
              </p>
            </div>

            {/* Right: Size Selection & Purchase */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-charcoal-frame mb-4">
                  Choose Your Size
                </h3>
                <div className="space-y-3">
                  {Object.entries(pricing).map(([size, priceInfo]) => (
                    <div
                      key={size}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedSize === size 
                          ? 'border-mona-gold bg-mona-gold/10' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedSize(size)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{size.replace('x', '" x ')}"</p>
                          <p className="text-sm text-gray-600">
                            {size === '12x18' ? 'Perfect for desks & shelves' :
                             size === '18x24' ? 'Great for walls & galleries' :
                             'Statement piece for any room'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">${priceInfo.price}</p>
                          <p className="text-sm text-gray-500 line-through">
                            ${priceInfo.originalPrice}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upsell for Canvas Stretched */}
              {productType === 'canvas_stretched' && !showUpsell && (
                <div className="bg-mona-gold/10 border border-mona-gold/30 rounded-lg p-4">
                  <h4 className="font-semibold text-charcoal-frame mb-2">
                    ✨ Upgrade to Framed Canvas
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Add professional framing for a museum-quality finish. Perfect for gifting!
                  </p>
                  <button
                    onClick={handleUpsell}
                    className="text-sm text-mona-gold hover:text-mona-gold/80 font-medium"
                  >
                    See Framed Options →
                  </button>
                </div>
              )}

              {/* Purchase Button */}
              <div className="space-y-4">
                <button
                  onClick={handlePurchase}
                  className="w-full btn btn-primary btn-lg text-lg py-4"
                >
                  Add to Cart - ${pricing[selectedSize as keyof typeof pricing]?.price}
                </button>
                
                <div className="text-center text-sm text-gray-500">
                  <p>✓ Free shipping on all orders</p>
                  <p>✓ 30-day satisfaction guarantee</p>
                  <p>✓ Handcrafted with premium materials</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upsell Modal Overlay */}
        {showUpsell && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg max-w-md w-full m-4 p-6">
              <h3 className="text-xl font-playfair font-bold text-charcoal-frame mb-4">
                Upgrade to Framed Canvas?
              </h3>
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <img 
                    src={artwork.generated_image_url}
                    alt="Framed preview"
                    className="w-full h-32 object-contain rounded"
                  />
                </div>
                <div className="space-y-2">
                  <p className="font-medium">Professional Framing Included:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Museum-quality black frame</li>
                    <li>• Ready to hang hardware included</li>
                    <li>• Perfect for gifting</li>
                    <li>• Premium presentation</li>
                  </ul>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowUpsell(false)}
                    className="flex-1 btn btn-secondary"
                  >
                    Keep Stretched
                  </button>
                  <button
                    onClick={handleUpsellAccept}
                    className="flex-1 btn btn-primary"
                  >
                    Upgrade to Framed
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
