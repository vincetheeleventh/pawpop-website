import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PurchaseModalDigitalFirst } from '@/components/modals/PurchaseModalDigitalFirst';

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    redirectToCheckout: vi.fn(() => Promise.resolve({ error: null }))
  }))
}));

// Mock the pricing functions
vi.mock('@/lib/printify-products', () => ({
  ProductType: {
    DIGITAL: 'DIGITAL',
    ART_PRINT: 'ART_PRINT',
    CANVAS_STRETCHED: 'CANVAS_STRETCHED',
    CANVAS_FRAMED: 'CANVAS_FRAMED'
  },
  getProductPricing: vi.fn((type, size) => {
    if (type === 'DIGITAL') return 999; // $9.99
    if (type === 'ART_PRINT') return 2999; // $29.99
    if (type === 'CANVAS_STRETCHED') return 6499; // $64.99
    if (type === 'CANVAS_FRAMED') return 7999; // $79.99
    return 0;
  })
}));

// Mock fetch
global.fetch = vi.fn();

const mockArtwork = {
  id: 'test-artwork-123',
  generated_image_url: '/test-image.jpg',
  customer_name: 'Sarah',
  customer_email: 'sarah@example.com',
  pet_name: 'Bella'
};

describe('PurchaseModalDigitalFirst', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sessionId: 'test-session-id' })
    });
  });

  it('renders when open', () => {
    render(
      <PurchaseModalDigitalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    expect(screen.getByText('Get Your Masterpiece')).toBeInTheDocument();
    expect(screen.getByText('Sarah & Bella Masterpiece')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <PurchaseModalDigitalFirst
        isOpen={false}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    expect(screen.queryByText('Get Your Masterpiece')).not.toBeInTheDocument();
  });

  it('displays digital-first layout by default', () => {
    render(
      <PurchaseModalDigitalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    // Check digital-first specific elements
    expect(screen.getByText('Instant Download, Print it Yourself')).toBeInTheDocument();
    expect(screen.getByText('Download Now')).toBeInTheDocument();
    expect(screen.getByText('View Print Options')).toBeInTheDocument();
    expect(screen.getByText('$9.99')).toBeInTheDocument();
  });

  it('shows physical options when "View Print Options" is clicked', async () => {
    render(
      <PurchaseModalDigitalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    fireEvent.click(screen.getByText('View Print Options'));

    await waitFor(() => {
      expect(screen.getByText('Fine Art Print')).toBeInTheDocument();
      expect(screen.getByText('Framed Canvas')).toBeInTheDocument();
      expect(screen.getByText('← Back to Digital Download')).toBeInTheDocument();
    });
  });

  it('allows going back to digital view', async () => {
    render(
      <PurchaseModalDigitalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    // Go to physical options
    fireEvent.click(screen.getByText('View Print Options'));
    await waitFor(() => {
      expect(screen.getByText('← Back to Digital Download')).toBeInTheDocument();
    });

    // Go back to digital
    fireEvent.click(screen.getByText('← Back to Digital Download'));
    await waitFor(() => {
      expect(screen.getByText('Download Now')).toBeInTheDocument();
    });
  });

  it('handles digital purchase', async () => {
    render(
      <PurchaseModalDigitalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    fireEvent.click(screen.getByText('Download Now'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const digitalArgs = (global.fetch as any).mock.calls.at(-1);
    expect(digitalArgs?.[0]).toBe('/api/checkout/artwork');
    const digitalInit = digitalArgs?.[1];
    expect(digitalInit).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const digitalBody = JSON.parse(digitalInit.body);
    expect(digitalBody).toMatchObject({
      artworkId: 'test-artwork-123',
      productType: 'DIGITAL',
      size: 'digital',
      customerEmail: 'sarah@example.com',
      customerName: 'Sarah',
      petName: 'Bella',
      imageUrl: '/test-image.jpg',
      variant: 'digital-first'
    });
  });

  it('handles physical product selection and purchase', async () => {
    render(
      <PurchaseModalDigitalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    // Go to physical options
    fireEvent.click(screen.getByText('View Print Options'));
    
    await waitFor(() => {
      expect(screen.getByText('Fine Art Print')).toBeInTheDocument();
    });

    // Select art print
    fireEvent.click(screen.getByText('Fine Art Print').closest('div')!);
    
    await waitFor(() => {
      expect(screen.getByText('Order Physical Print')).toBeInTheDocument();
    });

    // Purchase
    fireEvent.click(screen.getByText('Order Physical Print'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const fetchArgs = (global.fetch as any).mock.calls.at(-1);
    expect(fetchArgs?.[0]).toBe('/api/checkout/artwork');
    const requestInit = fetchArgs?.[1];
    expect(requestInit).toMatchObject({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const parsedBody = JSON.parse(requestInit.body);
    expect(parsedBody).toMatchObject({
      productType: 'ART_PRINT',
      variant: 'digital-first'
    });
  });

  it('closes when close button is clicked', () => {
    render(
      <PurchaseModalDigitalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    const buttons = screen.getAllByRole('button');
    const closeButton = buttons.find(button => 
      button.className.includes('text-gray-400')
    );
    
    expect(closeButton).toBeTruthy();
    fireEvent.click(closeButton!);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state during purchase', async () => {
    // Mock a delayed response
    (global.fetch as any).mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ sessionId: 'test-session-id' })
      }), 100))
    );

    render(
      <PurchaseModalDigitalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    fireEvent.click(screen.getByText('Download Now'));
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('handles purchase errors gracefully', async () => {
    (global.fetch as any).mockRejectedValue(new Error('Network error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <PurchaseModalDigitalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    fireEvent.click(screen.getByText('Download Now'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Checkout error:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
