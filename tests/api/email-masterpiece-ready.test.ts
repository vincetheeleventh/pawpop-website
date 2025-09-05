import { NextRequest } from 'next/server';
import { POST } from '@/app/api/email/masterpiece-ready/route';
import { sendMasterpieceReadyEmail } from '@/lib/email';
import { isValidEmail } from '@/lib/utils';

// Mock dependencies
jest.mock('@/lib/email');
jest.mock('@/lib/utils');

const mockSendMasterpieceReadyEmail = sendMasterpieceReadyEmail as jest.MockedFunction<typeof sendMasterpieceReadyEmail>;
const mockIsValidEmail = isValidEmail as jest.MockedFunction<typeof isValidEmail>;

describe('/api/email/masterpiece-ready', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsValidEmail.mockReturnValue(true);
  });

  const validRequestBody = {
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    artworkUrl: 'https://pawpopart.com/artwork/token123',
    generatedImageUrl: 'https://example.com/artwork.jpg',
    petName: 'Fluffy'
  };

  it('sends masterpiece ready email successfully', async () => {
    mockSendMasterpieceReadyEmail.mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost:3000/api/email/masterpiece-ready', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'Masterpiece ready email sent successfully'
    });

    expect(mockSendMasterpieceReadyEmail).toHaveBeenCalledWith({
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      artworkUrl: 'https://pawpopart.com/artwork/token123',
      generatedImageUrl: 'https://example.com/artwork.jpg',
      petName: 'Fluffy'
    });
  });

  it('handles missing required fields', async () => {
    const incompleteBody = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com'
      // Missing artworkUrl and generatedImageUrl
    };

    const request = new NextRequest('http://localhost:3000/api/email/masterpiece-ready', {
      method: 'POST',
      body: JSON.stringify(incompleteBody),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Missing required fields: customerName, customerEmail, artworkUrl, generatedImageUrl');
  });

  it('handles invalid email format', async () => {
    mockIsValidEmail.mockReturnValue(false);

    const request = new NextRequest('http://localhost:3000/api/email/masterpiece-ready', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid email format');
  });

  it('handles email sending failure', async () => {
    mockSendMasterpieceReadyEmail.mockResolvedValue({ 
      success: false, 
      error: 'SMTP connection failed' 
    });

    const request = new NextRequest('http://localhost:3000/api/email/masterpiece-ready', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to send email');
    expect(data.details).toBe('SMTP connection failed');
  });

  it('handles request without petName (optional field)', async () => {
    const bodyWithoutPet = {
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      artworkUrl: 'https://pawpopart.com/artwork/token123',
      generatedImageUrl: 'https://example.com/artwork.jpg'
    };

    mockSendMasterpieceReadyEmail.mockResolvedValue({ success: true });

    const request = new NextRequest('http://localhost:3000/api/email/masterpiece-ready', {
      method: 'POST',
      body: JSON.stringify(bodyWithoutPet),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockSendMasterpieceReadyEmail).toHaveBeenCalledWith({
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      artworkUrl: 'https://pawpopart.com/artwork/token123',
      generatedImageUrl: 'https://example.com/artwork.jpg',
      petName: undefined
    });
  });

  it('handles JSON parsing errors', async () => {
    const request = new NextRequest('http://localhost:3000/api/email/masterpiece-ready', {
      method: 'POST',
      body: 'invalid json',
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to send masterpiece ready email');
  });

  it('handles unexpected errors during email sending', async () => {
    mockSendMasterpieceReadyEmail.mockRejectedValue(new Error('Unexpected error'));

    const request = new NextRequest('http://localhost:3000/api/email/masterpiece-ready', {
      method: 'POST',
      body: JSON.stringify(validRequestBody),
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Failed to send masterpiece ready email');
  });
});
