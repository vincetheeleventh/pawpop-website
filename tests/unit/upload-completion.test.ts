// tests/unit/upload-completion.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Create mock functions
const mockSendMasterpieceCreatingEmail = vi.fn().mockResolvedValue({ success: true })
const mockCreateArtwork = vi.fn()
const mockIsValidEmail = vi.fn().mockReturnValue(true)

// Mock the email module
vi.mock('../../src/lib/email', () => ({
  sendMasterpieceCreatingEmail: mockSendMasterpieceCreatingEmail
}))

// Mock the supabase-artworks module
vi.mock('../../src/lib/supabase-artworks', () => ({
  createArtwork: mockCreateArtwork
}))

// Mock the utils module
vi.mock('../../src/lib/utils', () => ({
  isValidEmail: mockIsValidEmail
}))

describe.skip('/api/upload/complete', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Set up default mock return values
    mockCreateArtwork.mockResolvedValue({
      artwork: { 
        id: 'test-artwork-id',
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        source_images: {
          pet_photo: 'https://example.com/pet.jpg',
          pet_mom_photo: 'https://example.com/mom.jpg',
          uploadthing_keys: {}
        },
        generated_images: {
          monalisa_base: 'https://example.com/monalisa.jpg',
          artwork_preview: 'https://example.com/preview.jpg',
          artwork_full_res: 'https://example.com/fullres.jpg',
          generation_steps: []
        },
        generation_step: 'pending',
        processing_status: {
          artwork_generation: 'pending',
          upscaling: 'pending',
          mockup_generation: 'pending'
        },
        delivery_images: {
          digital_download: 'https://example.com/digital.jpg',
          print_ready: 'https://example.com/print.jpg',
          mockups: {}
        },
        generation_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        access_token: 'test-access-token'
      },
      access_token: 'test-access-token'
    })
  })

  it('should send confirmation email on successful upload completion', async () => {
    const { POST } = await import('../../src/app/api/upload/complete/route')

    mockRequest = new NextRequest('http://localhost:3000/api/upload/complete', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        uploaded_file_url: 'https://example.com/image.jpg',
        pet_name: 'Fluffy'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Upload completed successfully')
    expect(mockSendMasterpieceCreatingEmail).toHaveBeenCalledWith({
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      petName: 'Fluffy',
      artworkUrl: expect.stringContaining('/artwork/test-access-token')
    })
  })

  it('should handle missing required fields', async () => {
    const { POST } = await import('../../src/app/api/upload/complete/route')

    mockRequest = new NextRequest('http://localhost:3000/api/upload/complete', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: 'Test User'
        // Missing email and uploaded_file_url
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Missing required fields')
  })

  it('should handle invalid email format', async () => {
    const { POST } = await import('../../src/app/api/upload/complete/route')
    
    mockIsValidEmail.mockReturnValue(false)

    mockRequest = new NextRequest('http://localhost:3000/api/upload/complete', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: 'Test User',
        customer_email: 'invalid-email',
        uploaded_file_url: 'https://example.com/image.jpg'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid email format')
  })

  it('should continue processing even if email fails', async () => {
    const { POST } = await import('../../src/app/api/upload/complete/route')
    
    // Mock email to fail but artwork creation to succeed
    mockSendMasterpieceCreatingEmail.mockRejectedValue(new Error('Email service down'))

    mockRequest = new NextRequest('http://localhost:3000/api/upload/complete', {
      method: 'POST',
      body: JSON.stringify({
        customer_name: 'Test User',
        customer_email: 'test@example.com',
        uploaded_file_url: 'https://example.com/image.jpg'
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    const response = await POST(mockRequest)
    const data = await response.json()

    // Should still succeed even if email fails
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Upload completed successfully')
    expect(data.access_token).toBe('test-access-token')
  })
})
