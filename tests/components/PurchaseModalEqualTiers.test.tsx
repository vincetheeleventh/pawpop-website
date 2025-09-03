import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PurchaseModalEqualTiers } from '@/components/modals/PurchaseModalEqualTiers';

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
    FRAMED_CANVAS: 'FRAMED_CANVAS'
  },
  getProductPricing: vi.fn((type, size) => {
    if (type === 'DIGITAL') return 999;
    if (type === 'ART_PRINT') return 2999;
    if (type === 'FRAMED_CANVAS') return 7999;
    return 0;
  })
}));

global.fetch = vi.fn();

const mockArtwork = {
  id: 'test-artwork-123',
  generated_image_url: '/test-image.jpg',
  customer_name: 'Sarah',
  customer_email: 'sarah@example.com',
  pet_name: 'Bella'
};

describe('PurchaseModalEqualTiers', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sessionId: 'test-session-id' })
    });
  });

  it('renders three equal tiers', () => {
    render(
      <PurchaseModalEqualTiers
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    expect(screen.getByText('Choose Your Format')).toBeInTheDocument();
    expect(screen.getByText('Digital Download')).toBeInTheDocument();
    expect(screen.getByText('Premium Art Print')).toBeInTheDocument();
    expect(screen.getByText('Framed Canvas')).toBeInTheDocument();
  });

  it('shows "Best Value" badge on art print', () => {
    render(
      <PurchaseModalEqualTiers
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    expect(screen.getByText('Best Value')).toBeInTheDocument();
  });

  it('displays pricing for all tiers', () => {
    render(
      <PurchaseModalEqualTiers
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    expect(screen.getByText('$9.99')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('$79.99')).toBeInTheDocument();
  });

  it('shows feature lists with checkmarks', () => {
    render(
      <PurchaseModalEqualTiers
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    expect(screen.getByText('Instant delivery')).toBeInTheDocument();
    expect(screen.getByText('Museum-quality paper')).toBeInTheDocument();
    expect(screen.getByText('Gallery-wrapped canvas')).toBeInTheDocument();
    expect(screen.getByText('Premium wood frame')).toBeInTheDocument();
  });

  it('allows tier selection', async () => {
    render(
      <PurchaseModalEqualTiers
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    // Click on art print tier
    const artPrintTier = screen.getByText('Premium Art Print').closest('div')!;
    fireEvent.click(artPrintTier);

    await waitFor(() => {
      expect(screen.getByText('Get My Masterpiece')).toBeInTheDocument();
    });
  });

  it('shows selection indicator when tier is selected', async () => {
    render(
      <PurchaseModalEqualTiers
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    const digitalTier = screen.getByText('Digital Download').closest('div')!;
    fireEvent.click(digitalTier);

    await waitFor(() => {
      // Check for selection styling (border-mona-gold class)
      expect(digitalTier).toHaveClass('border-mona-gold');
    });
  });

  it('enables purchase button only when tier is selected', async () => {
    render(
      <PurchaseModalEqualTiers
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    // Purchase button should not be visible initially
    expect(screen.queryByText('Get My Masterpiece')).not.toBeInTheDocument();

    // Select a tier
    fireEvent.click(screen.getByText('Digital Download').closest('div')!);

    await waitFor(() => {
      expect(screen.getByText('Get My Masterpiece')).toBeInTheDocument();
    });
  });

  it('handles purchase with correct variant tracking', async () => {
    render(
      <PurchaseModalEqualTiers
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    // Select and purchase
    fireEvent.click(screen.getByText('Premium Art Print').closest('div')!);
    
    await waitFor(() => {
      expect(screen.getByText('Get My Masterpiece')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Get My Masterpiece'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/checkout/artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artworkId: 'test-artwork-123',
          productType: 'ART_PRINT',
          size: '16x20',
          customerEmail: 'sarah@example.com',
          customerName: 'Sarah',
          petName: 'Bella',
          imageUrl: '/test-image.jpg',
          variant: 'equal-tiers'
        })
      });
    });
  });

  it('shows delivery timeframes', () => {
    render(
      <PurchaseModalEqualTiers
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    expect(screen.getByText('Ships in Instant')).toBeInTheDocument();
    expect(screen.getByText('Ships in 3-5 days')).toBeInTheDocument();
    expect(screen.getByText('Ships in 5-7 days')).toBeInTheDocument();
  });

  it('displays artwork preview', () => {
    render(
      <PurchaseModalEqualTiers
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    const artworkImage = screen.getByAltText('Your masterpiece');
    expect(artworkImage).toBeInTheDocument();
    expect(artworkImage).toHaveAttribute('src', '/test-image.jpg');
  });

  it('shows security messaging', async () => {
    render(
      <PurchaseModalEqualTiers
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    // Select a tier to show purchase button
    fireEvent.click(screen.getByText('Digital Download').closest('div')!);

    await waitFor(() => {
      expect(screen.getByText('Secure checkout • 30-day money-back guarantee')).toBeInTheDocument();
    });
  });

  it('handles demo mode when Stripe is not available', async () => {
    // Mock no Stripe available
    const { loadStripe } = await import('@stripe/stripe-js');
    vi.mocked(loadStripe).mockResolvedValue(null);
    
    // Mock window.alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <PurchaseModalEqualTiers
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    fireEvent.click(screen.getByText('Digital Download').closest('div')!);
    
    await waitFor(() => {
      expect(screen.getByText('Get My Masterpiece')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Get My Masterpiece'));

    // Should show demo alert after timeout
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('Demo: Would purchase DIGITAL')
      );
    }, { timeout: 2000 });

    alertSpy.mockRestore();
  });
});
