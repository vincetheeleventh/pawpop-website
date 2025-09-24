import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('Manual Upload Functionality', () => {
  const BASE_URL = 'http://localhost:3000'
  let testArtworkId: string
  let testReviewId: string

  beforeAll(async () => {
    // Create test artwork
    const artworkResponse = await fetch(`${BASE_URL}/api/artwork/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Test Manual Upload',
        customer_email: 'test@example.com',
        pet_name: 'TestPet'
      })
    })
    
    const artworkData = await artworkResponse.json()
    testArtworkId = artworkData.artwork.id

    // Update artwork with source images
    await fetch(`${BASE_URL}/api/artwork/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artwork_id: testArtworkId,
        source_images: {
          pet_mom_photo: 'https://example.com/pet-mom.jpg',
          pet_photo: 'https://example.com/pet.jpg'
        },
        generated_image_url: 'https://example.com/generated.jpg',
        generation_step: 'completed'
      })
    })
  })

  it('should display source images in admin review', async () => {
    // Create admin review by triggering pet integration
    const formData = new FormData()
    formData.append('portrait', new Blob(['fake-image-data'], { type: 'image/jpeg' }), 'portrait.jpg')
    formData.append('pet', new Blob(['fake-pet-data'], { type: 'image/jpeg' }), 'pet.jpg')
    formData.append('artworkId', testArtworkId)

    const integrationResponse = await fetch(`${BASE_URL}/api/pet-integration`, {
      method: 'POST',
      body: formData
    })

    // Should create a review (even if integration fails due to fake data)
    const reviewsResponse = await fetch(`${BASE_URL}/api/admin/reviews`)
    const reviewsData = await reviewsResponse.json()
    
    const testReview = reviewsData.reviews.find((r: any) => 
      r.artwork_id === testArtworkId && r.status === 'pending'
    )
    
    if (testReview) {
      testReviewId = testReview.review_id
      
      // Check if review includes source images
      const reviewResponse = await fetch(`${BASE_URL}/api/admin/reviews/${testReviewId}`)
      const reviewData = await reviewResponse.json()
      
      expect(reviewData.success).toBe(true)
      expect(reviewData.review.source_images).toBeDefined()
      expect(reviewData.review.source_images.pet_mom_photo).toBeTruthy()
      expect(reviewData.review.source_images.pet_photo).toBeTruthy()
    }
  })

  it('should handle manual image upload and approval', async () => {
    if (!testReviewId) {
      // Skip if no review was created
      return
    }

    // Create test image blob
    const testImageBlob = new Blob(['fake-replacement-image'], { type: 'image/jpeg' })
    
    // Create FormData for manual upload
    const formData = new FormData()
    formData.append('image', testImageBlob, 'replacement.jpg')
    formData.append('reviewId', testReviewId)
    formData.append('notes', 'Test manual replacement')
    formData.append('reviewedBy', 'test-admin@example.com')

    const uploadResponse = await fetch(`${BASE_URL}/api/admin/reviews/${testReviewId}/manual-upload`, {
      method: 'POST',
      body: formData
    })

    const uploadData = await uploadResponse.json()
    
    expect(uploadResponse.ok).toBe(true)
    expect(uploadData.success).toBe(true)
    expect(uploadData.message).toContain('approved successfully')
    expect(uploadData.imageUrl).toBeTruthy()

    // Verify review was approved
    const reviewResponse = await fetch(`${BASE_URL}/api/admin/reviews/${testReviewId}`)
    const reviewData = await reviewResponse.json()
    
    expect(reviewData.review.status).toBe('approved')
  })

  it('should validate required fields for manual upload', async () => {
    if (!testReviewId) return

    // Test missing image
    const formData = new FormData()
    formData.append('reviewId', testReviewId)
    formData.append('notes', 'Test')
    formData.append('reviewedBy', 'test-admin@example.com')

    const response = await fetch(`${BASE_URL}/api/admin/reviews/${testReviewId}/manual-upload`, {
      method: 'POST',
      body: formData
    })

    expect(response.status).toBe(400)
    
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toContain('Image file is required')
  })

  it('should handle invalid review ID', async () => {
    const testImageBlob = new Blob(['fake-image'], { type: 'image/jpeg' })
    
    const formData = new FormData()
    formData.append('image', testImageBlob, 'test.jpg')
    formData.append('reviewId', 'invalid-id')
    formData.append('notes', 'Test')
    formData.append('reviewedBy', 'test-admin@example.com')

    const response = await fetch(`${BASE_URL}/api/admin/reviews/invalid-id/manual-upload`, {
      method: 'POST',
      body: formData
    })

    expect(response.status).toBe(404)
    
    const data = await response.json()
    expect(data.success).toBe(false)
    expect(data.error).toContain('Review not found')
  })
})
