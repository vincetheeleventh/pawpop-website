'use client'

import { useState, useEffect } from 'react'

interface Mockup {
  type: string
  title: string
  description: string
  mockupUrl: string
  productId: string
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
}

export default function MockupDisplay({ artwork }: MockupDisplayProps) {
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

      // Check if we have pre-generated mockups in Supabase (new schema)
      let cachedMockups: Mockup[] = []
      
      // Handle both old array format and new JSONB format
      if (artwork.mockup_urls) {
        if (Array.isArray(artwork.mockup_urls)) {
          cachedMockups = artwork.mockup_urls
        } else if (typeof artwork.mockup_urls === 'object') {
          // Convert new schema format to array
          cachedMockups = Object.entries(artwork.mockup_urls).map(([key, value]) => ({
            type: key,
            title: key === 'framed_canvas' ? 'Framed Canvas' : 'Premium Art Print',
            description: key === 'framed_canvas' ? 'Gallery-wrapped, ready to hang' : 'Museum-quality paper',
            mockupUrl: typeof value === 'string' ? value : value?.mockupUrl || '',
            productId: `cached-${key}`
          })).filter(m => m.mockupUrl)
        }
      }
      
      if (cachedMockups.length > 0) {
        console.log('✅ Loading mockups from Supabase cache:', cachedMockups.length)
        
        // Preload mockup images for faster display
        cachedMockups.forEach(mockup => {
          if (mockup.mockupUrl) {
            const img = new Image()
            img.src = mockup.mockupUrl
          }
        })
        
        setMockups(cachedMockups)
        setLoading(false)
        return
      }

      // Fallback: Generate mockups in real-time (slower)
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
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          console.error('❌ Mockup API error:', errorData)
          throw new Error(errorData.error || 'Failed to generate mockups')
        }

        const data = await response.json()
        
        if (data.success && data.mockups && data.mockups.length > 0) {
          console.log('✅ Generated real-time Printify mockups:', data.mockups.length)
          setMockups(data.mockups)
        } else {
          throw new Error('No mockups generated')
        }
      } catch (err) {
        console.error('❌ Error generating mockups:', err)
        setError(err instanceof Error ? err.message : 'Failed to load mockups')
        
        // Final fallback: Use artwork image as placeholder
        console.log('🎨 Using artwork-based mockups as final fallback')
        setMockups([
          {
            type: 'framed_canvas',
            title: 'Framed Canvas',
            description: 'Gallery-wrapped, ready to hang',
            mockupUrl: artworkImageUrl,
            productId: 'fallback-canvas'
          },
          {
            type: 'art_print',
            title: 'Premium Art Print',
            description: 'Museum-quality paper',
            mockupUrl: artworkImageUrl,
            productId: 'fallback-print'
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    loadMockups()
  }, [artwork.generated_images?.artwork_preview, artwork.id, artwork.delivery_images?.mockups])

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

  return (
    <div className="space-y-6">
      {mockups.map((mockup, index) => (
        <div key={`${mockup.type}-${index}`} className="text-center">
          <div className="bg-gray-100 rounded-lg p-4 mb-3">
            <img 
              src={mockup.mockupUrl}
              alt={mockup.title}
              className="w-full h-48 object-cover rounded"
              onError={(e) => {
                // Fallback to placeholder if mockup image fails to load
                e.currentTarget.src = mockup.type === 'framed_canvas' 
                  ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjUwIiB5PSI0MCIgd2lkdGg9IjIwMCIgaGVpZ2h0PSIxMjAiIGZpbGw9IiNFNUU3RUIiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTA1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+RnJhbWVkIENhbnZhczwvdGV4dD4KPC9zdmc+'
                  : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxyZWN0IHg9IjgwIiB5PSI1MCIgd2lkdGg9IjE0MCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIxIi8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTA1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNkI3MjgwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCI+QXJ0IFByaW50PC90ZXh0Pgo8L3N2Zz4='
              }}
            />
          </div>
          <h4 className="font-semibold text-charcoal-frame">{mockup.title}</h4>
          <p className="text-sm text-gray-600">{mockup.description}</p>
        </div>
      ))}
      
      {error && (
        <div className="text-center text-sm text-gray-500 mt-4">
          <p>Using preview mockups - full integration coming soon!</p>
        </div>
      )}
    </div>
  )
}
