import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductPurchaseModal from '@/components/modals/ProductPurchaseModal';

import { vi } from 'vitest';

// Mock Stripe
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    redirectToCheckout: vi.fn(() => Promise.resolve({ error: null }))
  }))
}));

// Mock fetch for shipping options
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({
      shippingMethods: [
        { id: 1, name: 'Standard Shipping', cost: 0, estimatedDays: '5-7 business days', isDefault: true }
      ]
    })
  })
) as any;

const mockArtwork = {
  id: 'test-artwork-123',
  pet_name: 'Buddy',
  customer_name: 'John Doe',
  customer_email: 'john@example.com',
  generated_images: {
    artwork_preview: 'https://example.com/artwork.jpg'
  }
};

const mockMockups = [
  {
    type: 'canvas_stretched',
    title: 'Canvas Stretched (20x30")',
    description: 'Gallery-wrapped, ready to hang',
    mockupUrl: 'https://example.com/mockup.jpg',
    productId: 'canvas-stretched-20x30',
    size: '20x30'
  }
];

describe('ProductPurchaseModal Upsell Functionality', () => {
  const mockOnClose = vi.fn();
  const mockOnProductClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show upsell section for canvas_stretched product type', async () => {
    render(
      <ProductPurchaseModal
        isOpen={true}
        onClose={mockOnClose}
        productType="canvas_stretched"
        mockups={mockMockups}
        artwork={mockArtwork}
        onProductClick={mockOnProductClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('✨ Upgrade to Framed Canvas')).toBeInTheDocument();
      expect(screen.getByText('See Framed Options →')).toBeInTheDocument();
    });
  });

  it('should not show upsell section for non-canvas_stretched product types', async () => {
    render(
      <ProductPurchaseModal
        isOpen={true}
        onClose={mockOnClose}
        productType="art_print"
        mockups={mockMockups}
        artwork={mockArtwork}
        onProductClick={mockOnProductClick}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('✨ Upgrade to Framed Canvas')).not.toBeInTheDocument();
      expect(screen.queryByText('See Framed Options →')).not.toBeInTheDocument();
    });
  });

  it('should directly switch to framed canvas modal when "See Framed Options →" is clicked', async () => {
    render(
      <ProductPurchaseModal
        isOpen={true}
        onClose={mockOnClose}
        productType="canvas_stretched"
        mockups={mockMockups}
        artwork={mockArtwork}
        onProductClick={mockOnProductClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('See Framed Options →')).toBeInTheDocument();
    });

    // Click the "See Framed Options →" button
    fireEvent.click(screen.getByText('See Framed Options →'));

    // Verify that onClose was called (modal closes)
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Verify that onProductClick was called with framed canvas parameters
    expect(mockOnProductClick).toHaveBeenCalledTimes(1);
    expect(mockOnProductClick).toHaveBeenCalledWith('canvas_framed', expect.any(Array));

    // Verify the mockups passed to onProductClick are for framed canvas
    const [productType, mockups] = mockOnProductClick.mock.calls[0];
    expect(productType).toBe('canvas_framed');
    expect(mockups).toHaveLength(3); // Should have 3 sizes
    expect(mockups[0].type).toBe('canvas_framed');
    expect(mockups[0].title).toContain('Canvas Framed');
  });

  it('should not show confirmation modal after clicking "See Framed Options →"', async () => {
    render(
      <ProductPurchaseModal
        isOpen={true}
        onClose={mockOnClose}
        productType="canvas_stretched"
        mockups={mockMockups}
        artwork={mockArtwork}
        onProductClick={mockOnProductClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('See Framed Options →')).toBeInTheDocument();
    });

    // Click the "See Framed Options →" button
    fireEvent.click(screen.getByText('See Framed Options →'));

    // Verify no confirmation modal appears
    expect(screen.queryByText('Upgrade to Framed Canvas?')).not.toBeInTheDocument();
    expect(screen.queryByText('Keep Stretched')).not.toBeInTheDocument();
    expect(screen.queryByText('Upgrade to Framed')).not.toBeInTheDocument();
  });
});
