'use client'

import { useState, useEffect } from 'react'

interface Mockup {
  type: string
  title: string
  description: string
  mockupUrl: string
  productId: string
  size: string
}

interface MockupDisplayProps {
  artwork: {
    id: string
    generated_images?: {
      artwork_preview?: string
      artwork_full_res?: string
    }
    mockup_urls?: Mockup[] | Record<string, any>
    mockup_generated_at?: string
    delivery_images?: {
      mockups?: Record<string, any>
    }
    processing_status?: {
      mockup_generation?: string
    }
  }
  onProductClick?: (productType: string, mockups: Mockup[]) => void
}

export default function MockupDisplay({ artwork, onProductClick }: MockupDisplayProps) {
  const [mockups, setMockups] = useState<Mockup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMockups = async () => {
      const artworkImageUrl = artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res
      if (!artworkImageUrl) {
        setError('No artwork image available')
        setLoading(false)
        return
      }

      // Check if we have pre-generated mockups in Supabase
      // Check if mockups are already cached in delivery_images.mockups (current schema)
      if (artwork.delivery_images?.mockups && typeof artwork.delivery_images.mockups === 'object') {
        console.log('✅ Using cached mockups from delivery_images.mockups')
        const cachedMockups: Mockup[] = []
        
        // Extract mockups from JSONB structure
        Object.entries(artwork.delivery_images.mockups).forEach(([productType, productMockups]) => {
          if (Array.isArray(productMockups)) {
            productMockups.forEach((mockup: any) => {
              cachedMockups.push({
                type: productType,
                title: mockup.title || `${productType} mockup`,
                description: mockup.description || '',
                mockupUrl: mockup.mockupUrl || mockup.url || '',
                productId: mockup.productId || `${productType}-${mockup.size || 'default'}`,
                size: mockup.size || '20x30'
              })
            })
          }
        })
        
        if (cachedMockups.length > 0) {
          console.log('✅ Loading mockups from Supabase cache:', cachedMockups.length)
          setMockups(cachedMockups)
          setLoading(false)
          return
        }
      }

      // Fallback: Generate mockups in real-time
      try {
        setLoading(true)
        console.log('🖼️ No cached mockups found, generating from Printify API for artwork:', artwork.id)
        
        const response = await fetch('/api/printify/generate-mockups', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: artworkImageUrl,
            artworkId: artwork.id
          })
        })

        if (!response.ok) {
          throw new Error('Failed to generate mockups')
        }

        const data = await response.json()
        
        if (data.success && data.mockups && data.mockups.length > 0) {
          console.log('✅ Generated real-time Printify mockups:', data.mockups.length)
          // Add size property to generated mockups
          const mocksWithSize = data.mockups.map((m: any) => ({
            ...m,
            size: m.size || '20x30'
          }))
          setMockups(mocksWithSize)
        } else {
          throw new Error('No mockups generated')
        }
      } catch (err) {
        console.error('❌ Error generating mockups:', err)
        setError(err instanceof Error ? err.message : 'Failed to load mockups')
        
        // Final fallback: Use artwork image directly
        console.log('⚠️ Using artwork image as mockup fallback')
        setMockups([
          {
            type: 'art_print',
            title: 'Premium Art Print',
            description: 'Museum-quality paper',
            mockupUrl: artworkImageUrl,
            productId: 'fallback-print',
            size: '20x30'
          },
          {
            type: 'canvas_stretched',
            title: 'Canvas Stretched',
            description: 'Gallery-wrapped, ready to hang',
            mockupUrl: artworkImageUrl,
            productId: 'fallback-canvas-stretched',
            size: '20x30'
          },
          {
            type: 'canvas_framed',
            title: 'Canvas Framed',
            description: 'Professional framing included',
            mockupUrl: artworkImageUrl,
            productId: 'fallback-canvas-framed',
            size: '20x30'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    loadMockups()
  }, [artwork.generated_images?.artwork_preview, artwork.id, artwork.mockup_urls])

  // Filter to show art print, canvas stretched, and canvas framed, prioritize 20x30 size
  const getDisplayMockups = () => {
    const artPrintMockups = mockups.filter(m => m.type === 'art_print')
    const canvasStretchedMockups = mockups.filter(m => m.type === 'canvas_stretched')
    const canvasFramedMockups = mockups.filter(m => m.type === 'canvas_framed')
    
    // Get 20x30 mockups first, fallback to any available size
    const artPrint20x30 = artPrintMockups.find(m => m.size === '20x30') || artPrintMockups[0]
    const canvasStretched20x30 = canvasStretchedMockups.find(m => m.size === '20x30') || canvasStretchedMockups[0]
    const canvasFramed20x30 = canvasFramedMockups.find(m => m.size === '20x30') || canvasFramedMockups[0]
    
    const displayMockups = []
    
    // Always include art print (create fallback if none exists)
    if (artPrint20x30) {
      displayMockups.push(artPrint20x30)
    } else {
      displayMockups.push({
        type: 'art_print',
        title: 'Premium Art Print',
        description: 'Museum-quality paper',
        mockupUrl: artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res || '',
        productId: 'fallback-art-print',
        size: '20x30'
      })
    }
    
    // Always include canvas stretched
    if (canvasStretched20x30) {
      displayMockups.push(canvasStretched20x30)
    }
    
    // Always include canvas framed
    if (canvasFramed20x30) {
      displayMockups.push(canvasFramed20x30)
    }
    
    return displayMockups.filter(Boolean)
  }

  const handleProductClick = (productType: string) => {
    if (onProductClick) {
      const productMockups = mockups.filter(m => m.type === productType)
      onProductClick(productType, productMockups)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const displayMockups = getDisplayMockups()

  return (
    <div className="space-y-6">
      {displayMockups.map((mockup, index) => (
        <div 
          key={`${mockup.type}-${index}`} 
          className="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors"
          onClick={() => handleProductClick(mockup.type)}
        >
          <div className="bg-gray-100 rounded-lg p-4 mb-3">
            <img 
              src={mockup.mockupUrl}
              alt={mockup.title}
              className="w-full h-48 object-contain rounded"
              onError={(e) => {
                // Fallback to artwork image if mockup fails to load
                const artworkImageUrl = artwork.generated_images?.artwork_preview || artwork.generated_images?.artwork_full_res;
                if (artworkImageUrl && e.currentTarget.src !== artworkImageUrl) {
                  e.currentTarget.src = artworkImageUrl;
                }
              }}
            />
          </div>
          <h4 className="font-semibold text-charcoal-frame">{mockup.title}</h4>
          <p className="text-sm text-gray-600">{mockup.description}</p>
          <p className="text-xs text-gray-500 mt-1">Click to see all sizes</p>
        </div>
      ))}
      
    </div>
  )
}
