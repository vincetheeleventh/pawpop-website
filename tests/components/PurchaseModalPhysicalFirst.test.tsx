import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PurchaseModalPhysicalFirst } from '@/components/modals/PurchaseModalPhysicalFirst';

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

describe('PurchaseModalPhysicalFirst', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sessionId: 'test-session-id' })
    });
  });

  it('renders physical-first layout', () => {
    render(
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    expect(screen.getByText('Choose Your Physical Masterpiece')).toBeInTheDocument();
    expect(screen.getByText('Premium Art Print')).toBeInTheDocument();
    expect(screen.getByText('Framed Canvas')).toBeInTheDocument();
  });

  it('emphasizes physical products as primary options', () => {
    render(
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    // Physical products should be prominently displayed
    expect(screen.getByText('Museum-quality paper')).toBeInTheDocument();
    expect(screen.getByText('Gallery-wrapped canvas')).toBeInTheDocument();
    expect(screen.getByText('Premium wood frame')).toBeInTheDocument();
  });

  it('shows digital file as bonus/freebie', () => {
    render(
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    expect(screen.getByText('+ FREE Digital File')).toBeInTheDocument();
  });

  it('displays physical product pricing', () => {
    render(
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('$79.99')).toBeInTheDocument();
  });

  it('allows physical product selection', async () => {
    render(
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    const artPrintOption = screen.getByText('Premium Art Print').closest('div')!;
    fireEvent.click(artPrintOption);

    await waitFor(() => {
      expect(screen.getByText('Order My Masterpiece')).toBeInTheDocument();
    });
  });

  it('shows selection indicator when product is selected', async () => {
    render(
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    const framedCanvasOption = screen.getByText('Framed Canvas').closest('div')!;
    fireEvent.click(framedCanvasOption);

    await waitFor(() => {
      expect(framedCanvasOption).toHaveClass('border-mona-gold');
    });
  });

  it('handles art print purchase with correct variant', async () => {
    render(
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    // Select art print
    fireEvent.click(screen.getByText('Premium Art Print').closest('div')!);
    
    await waitFor(() => {
      expect(screen.getByText('Order My Masterpiece')).toBeInTheDocument();
    });

    // Purchase
    fireEvent.click(screen.getByText('Order My Masterpiece'));

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
          variant: 'physical-first'
        })
      });
    });
  });

  it('handles framed canvas purchase with correct variant', async () => {
    render(
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    // Select framed canvas
    fireEvent.click(screen.getByText('Framed Canvas').closest('div')!);
    
    await waitFor(() => {
      expect(screen.getByText('Order My Masterpiece')).toBeInTheDocument();
    });

    // Purchase
    fireEvent.click(screen.getByText('Order My Masterpiece'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/checkout/artwork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.objectContaining({
          productType: 'FRAMED_CANVAS',
          variant: 'physical-first'
        })
      });
    });
  });

  it('shows shipping timeframes for physical products', () => {
    render(
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    expect(screen.getByText('Ships in 3-5 business days')).toBeInTheDocument();
    expect(screen.getByText('Ships in 5-7 business days')).toBeInTheDocument();
  });

  it('displays quality messaging for physical products', () => {
    render(
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    expect(screen.getByText('Gallery-wrapped stretched canvas')).toBeInTheDocument();
    expect(screen.getByText('Premium wooden frame')).toBeInTheDocument();
  });

  it('shows purchase button only when product is selected', async () => {
    render(
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    // Purchase button should not be visible initially
    expect(screen.queryByText('Order My Masterpiece')).not.toBeInTheDocument();

    // Select a product
    fireEvent.click(screen.getByText('Premium Art Print').closest('div')!);

    await waitFor(() => {
      expect(screen.getByText('Order My Masterpiece')).toBeInTheDocument();
    });
  });

  it('displays artwork preview', () => {
    render(
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    const artworkImage = screen.getByAltText('Your masterpiece');
    expect(artworkImage).toBeInTheDocument();
    expect(artworkImage).toHaveAttribute('src', '/test-image.jpg');
  });

  it('shows security and guarantee messaging', async () => {
    render(
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    // Select a product to show purchase section
    fireEvent.click(screen.getByText('Premium Art Print').closest('div')!);

    await waitFor(() => {
      expect(screen.getByText('✓ Free shipping • ✓ 30-day guarantee • ✓ Digital copy included')).toBeInTheDocument();
    });
  });

  it('closes when close button is clicked', () => {
    render(
      <PurchaseModalPhysicalFirst
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
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    fireEvent.click(screen.getByText('Premium Art Print').closest('div')!);
    
    await waitFor(() => {
      expect(screen.getByText('Order My Masterpiece')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Order My Masterpiece'));
    
    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('handles demo mode when Stripe is not available', async () => {
    // Mock no Stripe available
    const { loadStripe } = await import('@stripe/stripe-js');
    vi.mocked(loadStripe).mockResolvedValue(null);
    
    // Mock window.alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(
      <PurchaseModalPhysicalFirst
        isOpen={true}
        onClose={mockOnClose}
        artwork={mockArtwork}
      />
    );

    fireEvent.click(screen.getByText('Premium Art Print').closest('div')!);
    
    await waitFor(() => {
      expect(screen.getByText('Order My Masterpiece')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Order My Masterpiece'));

    // Should show demo alert after timeout
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('Demo: Would purchase ART_PRINT')
      );
    }, { timeout: 2000 });

    alertSpy.mockRestore();
  });
});
