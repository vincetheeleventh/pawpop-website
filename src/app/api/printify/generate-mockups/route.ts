import { NextRequest, NextResponse } from 'next/server'

const BASE_URL = 'https://api.printify.com/v1'
const TOKEN = process.env.PRINTIFY_API_TOKEN!
const SHOP_ID = process.env.PRINTIFY_SHOP_ID!

// Product configuration from PRODUCTS.md
const PRODUCT_CONFIG = {
  FRAMED_CANVAS: {
    blueprint_id: 1191, // Photo Art Paper Posters
    print_provider_id: 27, // Print Geek
    variants: [
      { id: 91677, size: '12x18', price: 7999 }, // 12″ × 18″ (Vertical) / Satin
      { id: 91693, size: '18x24', price: 9999 }, // 18″ × 24″ (Vertical) / Satin
      { id: 91695, size: '20x30', price: 12999 } // 20″ × 30″ (Vertical) / Satin
    ]
  },
  ART_PRINT: {
    US_CA: {
      blueprint_id: 1191, // Photo Art Paper Posters
      print_provider_id: 1, // Generic Brand
      variants: [
        { id: 'poster_12x18', size: '12x18', price: 2999 },
        { id: 'poster_18x24', size: '18x24', price: 3999 },
        { id: 'poster_20x30', size: '20x30', price: 4999 }
      ]
    },
    EUROPE: {
      blueprint_id: 494, // Giclee Art Print
      print_provider_id: 1, // Generic Brand
      variants: [
        { id: 'giclee_12x18', size: '12x18', price: 3499 },
        { id: 'giclee_18x24', size: '18x24', price: 4499 },
        { id: 'giclee_20x30', size: '20x30', price: 5499 }
      ]
    }
  }
}

// Cache for resolved variant IDs to avoid repeated catalog calls
let catalogCache: {
  framedCanvasVariants?: number[]
  artPrintVariants?: number[]
} = {}

async function fetchFromPrintify(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'PawPop-NextJS',
      ...options.headers
    }
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Printify API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

async function resolveVariantIds() {
  if (catalogCache.framedCanvasVariants && catalogCache.artPrintVariants) {
    return catalogCache
  }

  console.log('🔍 Resolving Printify variant IDs using known blueprint IDs...')

  // Get variants for framed canvas (Blueprint 1191, Print Geek provider 27)
  try {
    const framedCanvasVariants = await fetchFromPrintify(
      `/catalog/blueprints/${PRODUCT_CONFIG.FRAMED_CANVAS.blueprint_id}/print_providers/${PRODUCT_CONFIG.FRAMED_CANVAS.print_provider_id}/variants.json`
    )
    
    // Use the known variant IDs from PRODUCTS.md
    catalogCache.framedCanvasVariants = PRODUCT_CONFIG.FRAMED_CANVAS.variants.map(v => v.id)
    console.log('✅ Using framed canvas variants:', catalogCache.framedCanvasVariants)
  } catch (error) {
    console.error('❌ Failed to resolve framed canvas variants:', error)
    // Fallback to configured variant IDs
    catalogCache.framedCanvasVariants = PRODUCT_CONFIG.FRAMED_CANVAS.variants.map(v => v.id)
  }

  // Get variants for art prints (Blueprint 1191, Generic Brand provider 1)
  try {
    const artPrintVariants = await fetchFromPrintify(
      `/catalog/blueprints/${PRODUCT_CONFIG.ART_PRINT.US_CA.blueprint_id}/print_providers/${PRODUCT_CONFIG.ART_PRINT.US_CA.print_provider_id}/variants.json`
    )
    
    // For art prints, we'll use the actual variant IDs from the API response
    // since the PRODUCTS.md has string IDs that need to be mapped
    catalogCache.artPrintVariants = artPrintVariants.variants?.slice(0, 3).map((v: any) => v.id) || []
    console.log('✅ Using art print variants:', catalogCache.artPrintVariants)
  } catch (error) {
    console.error('❌ Failed to resolve art print variants:', error)
    // Fallback: Use the same variants as framed canvas since they use the same blueprint
    // This ensures art print mockups are still generated
    catalogCache.artPrintVariants = PRODUCT_CONFIG.FRAMED_CANVAS.variants.map(v => v.id)
    console.log('🔄 Using fallback art print variants (same as canvas):', catalogCache.artPrintVariants)
  }

  console.log('✅ Variant IDs resolved:', catalogCache)
  return catalogCache
}

async function uploadImageToPrintify(imageUrl: string, fileName: string) {
  console.log('📤 Uploading image to Printify...')
  
  // Fetch the image and convert to base64
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.statusText}`)
  }
  
  const imageBuffer = await imageResponse.arrayBuffer()
  const base64Image = Buffer.from(imageBuffer).toString('base64')
  
  const uploadResponse = await fetchFromPrintify('/uploads/images.json', {
    method: 'POST',
    body: JSON.stringify({
      file_name: fileName,
      contents: base64Image
    })
  })
  
  console.log('✅ Image uploaded to Printify:', uploadResponse.id)
  return uploadResponse.id
}

async function createProductWithMockups(
  uploadId: string,
  blueprintId: number,
  printProviderId: number,
  variantIds: number[],
  title: string,
  description: string,
  targetSize?: string
) {
  console.log(`🏭 Creating product: ${title}`)
  
  // Filter variants to get the 20"x30" vertical size if specified
  let selectedVariants = variantIds
  if (targetSize === '20x30') {
    // For framed canvas, use the specific 20x30 vertical variant from PRODUCTS.md
    if (blueprintId === PRODUCT_CONFIG.FRAMED_CANVAS.blueprint_id && 
        printProviderId === PRODUCT_CONFIG.FRAMED_CANVAS.print_provider_id) {
      const variant20x30 = PRODUCT_CONFIG.FRAMED_CANVAS.variants.find(v => v.size === '20x30')
      if (variant20x30) {
        selectedVariants = [variant20x30.id]
        console.log(`📏 Using 20x30 vertical variant: ${variant20x30.size} (ID: ${variant20x30.id})`)
      }
    } else {
      // For other products, try to find 20x30 variant dynamically
      const variantDetails = await fetchFromPrintify(
        `/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`
      )
      
      const variant20x30 = variantDetails.variants?.find((v: any) => 
        v.title?.includes('20') && v.title?.includes('30') && 
        (v.title?.toLowerCase().includes('vertical') || !v.title?.toLowerCase().includes('horizontal'))
      ) || variantDetails.variants?.find((v: any) => 
        v.title?.includes('20') && v.title?.includes('30')
      )
      
      if (variant20x30) {
        selectedVariants = [variant20x30.id]
        console.log(`📏 Using 20x30 variant: ${variant20x30.title} (ID: ${variant20x30.id})`)
      }
    }
  }
  
  // Get the correct pricing based on blueprint and provider
  const getVariantPrice = (variantId: number) => {
    // For framed canvas (Blueprint 1191 + Print Geek 27)
    if (blueprintId === PRODUCT_CONFIG.FRAMED_CANVAS.blueprint_id && 
        printProviderId === PRODUCT_CONFIG.FRAMED_CANVAS.print_provider_id) {
      const variant = PRODUCT_CONFIG.FRAMED_CANVAS.variants.find(v => v.id === variantId)
      if (variant) {
        return variant.price
      }
      // Fallback pricing for unknown canvas variants based on size
      // Larger variants get higher prices
      if (variantId > 91690) return 12999 // $129.99 for large sizes
      if (variantId > 91680) return 9999  // $99.99 for medium sizes
      return 7999 // $79.99 for smaller sizes
    }
    
    // For art prints, use a reasonable default since we don't have exact variant mapping
    return 4999 // $49.99 default for art prints
  }

  // Create product draft with print areas
  const productData = {
    title,
    description,
    blueprint_id: blueprintId,
    print_provider_id: printProviderId,
    variants: selectedVariants.map(id => ({ 
      id, 
      price: getVariantPrice(id), 
      is_enabled: true 
    })),
    print_areas: [{
      variant_ids: selectedVariants,
      placeholders: [{
        position: 'front',
        images: [{
          id: uploadId,
          x: 0.5,
          y: 0.5,
          scale: 1.0,
          angle: 0
        }]
      }]
    }],
    tags: ['preview', 'pawpop']
  }
  
  const product = await fetchFromPrintify(`/shops/${SHOP_ID}/products.json`, {
    method: 'POST',
    body: JSON.stringify(productData)
  })
  
  console.log('✅ Product created:', product.id)
  
  // Fetch the product to get generated mockups
  const fullProduct = await fetchFromPrintify(`/shops/${SHOP_ID}/products/${product.id}.json`)
  
  console.log('🖼️ Available mockup images:', fullProduct.images?.length || 0)
  
  // Filter mockups to get context 2 (lifestyle/in-situ views) and proper product views
  const contextMockups = fullProduct.images?.filter((img: any) => {
    // Look for context 2 mockups or lifestyle shots
    const isContextMockup = img.position === 'context2' || 
                           img.position === 'lifestyle' ||
                           img.position === 'front' ||
                           !img.is_default // Non-default images are often lifestyle shots
    
    // Ensure it's for our selected variants
    const hasCorrectVariant = selectedVariants.some(variantId => 
      img.variant_ids?.includes(variantId)
    )
    
    return isContextMockup && hasCorrectVariant
  }) || []
  
  console.log(`🎯 Found ${contextMockups.length} context mockups`)
  
  // If no context mockups, fall back to any available mockups
  const mockupUrls = contextMockups.length > 0 
    ? contextMockups.map((img: any) => img.src)
    : fullProduct.images?.map((img: any) => img.src) || []
  
  return {
    productId: product.id,
    mockupUrls,
    mockupDetails: contextMockups.length > 0 ? contextMockups : fullProduct.images
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { imageUrl, artworkId } = body

    if (!imageUrl || !artworkId) {
      return NextResponse.json(
        { error: 'Missing required fields: imageUrl, artworkId' },
        { status: 400 }
      )
    }

    if (!TOKEN || !SHOP_ID) {
      console.log('⚠️ Printify not configured - using fallback mockups')
      // Return fallback mockups when Printify isn't configured
      return NextResponse.json({
        success: true,
        mockups: [
          {
            type: 'framed_canvas',
            title: 'Framed Canvas',
            description: 'Gallery-wrapped, ready to hang',
            mockupUrl: imageUrl, // Use the actual artwork image
            productId: 'fallback-canvas'
          },
          {
            type: 'art_print',
            title: 'Premium Art Print',
            description: 'Museum-quality paper',
            mockupUrl: imageUrl, // Use the actual artwork image
            productId: 'fallback-print'
          }
        ]
      })
    }

    console.log('🖼️ Generating Printify mockups for artwork:', artworkId)

    // Resolve variant IDs using known blueprint IDs
    const catalog = await resolveVariantIds()
    
    // Upload image to Printify
    const uploadId = await uploadImageToPrintify(imageUrl, `pawpop-artwork-${artworkId}.jpg`)
    
    const mockups = []

    // Generate Framed Canvas mockup using Blueprint 1191 + Print Geek (27)
    if (catalog.framedCanvasVariants?.length) {
      try {
        const framedCanvas = await createProductWithMockups(
          uploadId,
          PRODUCT_CONFIG.FRAMED_CANVAS.blueprint_id,
          PRODUCT_CONFIG.FRAMED_CANVAS.print_provider_id,
          catalog.framedCanvasVariants,
          `PawPop Framed Canvas - ${artworkId}`,
          'Custom Mona Lisa style framed canvas',
          '20x30'
        )
        
        if (framedCanvas.mockupUrls.length > 0) {
          mockups.push({
            type: 'framed_canvas',
            title: 'Framed Canvas (20"×30")',
            description: 'Gallery-wrapped, ready to hang',
            mockupUrl: framedCanvas.mockupUrls[0],
            productId: framedCanvas.productId,
            mockupDetails: framedCanvas.mockupDetails?.[0]
          })
        }
      } catch (error) {
        console.error('❌ Failed to create framed canvas mockup:', error)
      }
    }

    // Generate Art Print mockup using Blueprint 1191 + Generic Brand (1)
    if (catalog.artPrintVariants?.length) {
      try {
        const artPrint = await createProductWithMockups(
          uploadId,
          PRODUCT_CONFIG.ART_PRINT.US_CA.blueprint_id,
          PRODUCT_CONFIG.ART_PRINT.US_CA.print_provider_id,
          catalog.artPrintVariants,
          `PawPop Art Print - ${artworkId}`,
          'Custom Mona Lisa style art print',
          '20x30'
        )
        
        if (artPrint.mockupUrls.length > 0) {
          mockups.push({
            type: 'art_print',
            title: 'Premium Art Print (20"×30")',
            description: 'Museum-quality paper',
            mockupUrl: artPrint.mockupUrls[0],
            productId: artPrint.productId,
            mockupDetails: artPrint.mockupDetails?.[0]
          })
        }
      } catch (error) {
        console.error('❌ Failed to create art print mockup:', error)
      }
    }

    if (mockups.length === 0) {
      return NextResponse.json(
        { error: 'Failed to generate any mockups' },
        { status: 500 }
      )
    }

    console.log(`✅ Generated ${mockups.length} mockups successfully`)

    // Store mockups in Supabase for faster future loading
    try {
      const { supabase } = await import('@/lib/supabase')
      
      const mockupData = {
        mockup_urls: mockups,
        mockup_generated_at: new Date().toISOString()
      }
      
      const { error: updateError } = await supabase
        .from('artworks')
        .update(mockupData)
        .eq('id', artworkId)
      
      if (updateError) {
        console.error('❌ Failed to store mockups in Supabase:', updateError)
      } else {
        console.log('✅ Mockups stored in Supabase successfully')
      }
    } catch (dbError) {
      console.error('❌ Error storing mockups in database:', dbError)
    }

    return NextResponse.json({
      success: true,
      mockups
    })

  } catch (error) {
    console.error('❌ Error generating Printify mockups:', error)
    return NextResponse.json(
      { error: 'Failed to generate mockups', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
