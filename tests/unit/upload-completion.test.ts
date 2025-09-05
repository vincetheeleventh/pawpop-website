// tests/unit/upload-completion.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock the email module
vi.mock('@/lib/email', () => ({
  sendMasterpieceCreatingEmail: vi.fn().mockResolvedValue({ success: true })
}))

// Mock the supabase-artworks module
vi.mock('@/lib/supabase-artworks', () => ({
  createArtwork: vi.fn().mockResolvedValue({
    artwork: { id: 'test-artwork-id' },
    access_token: 'test-access-token'
  })
}))

// Mock the utils module
vi.mock('@/lib/utils', () => ({
  isValidEmail: vi.fn().mockReturnValue(true)
}))

describe('/api/upload/complete', () => {
  let mockRequest: NextRequest

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should send confirmation email on successful upload completion', async () => {
    const { POST } = await import('@/app/api/upload/complete/route')
    const { sendMasterpieceCreatingEmail } = await import('@/lib/email')

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
    expect(sendMasterpieceCreatingEmail).toHaveBeenCalledWith({
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      petName: 'Fluffy',
      artworkUrl: expect.stringContaining('/artwork/test-access-token')
    })
  })

  it('should handle missing required fields', async () => {
    const { POST } = await import('@/app/api/upload/complete/route')

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
    const { POST } = await import('@/app/api/upload/complete/route')
    const { isValidEmail } = await import('@/lib/utils')
    
    vi.mocked(isValidEmail).mockReturnValue(false)

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
    const { POST } = await import('@/app/api/upload/complete/route')
    const { sendMasterpieceCreatingEmail } = await import('@/lib/email')
    const { createArtwork } = await import('@/lib/supabase-artworks')
    
    // Mock email to fail but artwork creation to succeed
    vi.mocked(sendMasterpieceCreatingEmail).mockRejectedValue(new Error('Email service down'))
    vi.mocked(createArtwork).mockResolvedValue({
      artwork: { id: 'test-artwork-id' },
      access_token: 'test-access-token'
    })

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
