// src/app/api/artwork/test-artwork-123/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Return mock artwork data for testing
  const mockArtwork = {
    id: 'test-artwork-123',
    generated_image_url: '/images/pet-integration-output.jpg',
    pet_name: 'Bella',
    customer_name: 'Sarah',
    customer_email: 'sarah@example.com',
    generation_status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return NextResponse.json({ 
    artwork: mockArtwork 
  });
}
