// tests/components/ProductPurchaseModal-shipping.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductPurchaseModal from '@/components/modals/ProductPurchaseModal';

// Mock fetch for shipping methods API
global.fetch = jest.fn();

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve({
    redirectToCheckout: jest.fn(() => Promise.resolve({ error: null }))
  }))
}));

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
    type: 'art_print',
    title: 'Art Print 16x24',
    description: 'Premium paper',
    mockupUrl: 'https://example.com/mockup.jpg',
    productId: 'product-123',
    size: '16x24'
  }
];

const mockShippingMethods = [
  {
    id: 1,
    name: 'Standard Shipping',
    cost: 0,
    estimatedDays: '5-7 business days',
    isDefault: true
  },
  {
    id: 2,
    name: 'Express Shipping',
    cost: 1000, // $10.00
    estimatedDays: '2-3 business days',
    isDefault: false
  }
];

describe('ProductPurchaseModal Shipping Selection', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('fetches and displays shipping options for physical products', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        shippingMethods: mockShippingMethods
      })
    });

    render(
      <ProductPurchaseModal
        isOpen={true}
        onClose={() => {}}
        productType="art_print"
        mockups={mockMockups}
        artwork={mockArtwork}
      />
    );

    // Wait for shipping options to load
    await waitFor(() => {
      expect(screen.getByText('Shipping Options')).toBeInTheDocument();
    });

    // Check that both shipping options are displayed
    expect(screen.getByText('Standard Shipping')).toBeInTheDocument();
    expect(screen.getByText('Express Shipping')).toBeInTheDocument();
    expect(screen.getByText('5-7 business days')).toBeInTheDocument();
    expect(screen.getByText('2-3 business days')).toBeInTheDocument();
    expect(screen.getByText('FREE')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });

  it('does not show shipping options for digital products', () => {
    render(
      <ProductPurchaseModal
        isOpen={true}
        onClose={() => {}}
        productType="digital"
        mockups={[]}
        artwork={mockArtwork}
      />
    );

    expect(screen.queryByText('Shipping Options')).not.toBeInTheDocument();
    expect(screen.getByText('✓ Instant digital download')).toBeInTheDocument();
  });

  it('allows selecting different shipping methods', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        shippingMethods: mockShippingMethods
      })
    });

    render(
      <ProductPurchaseModal
        isOpen={true}
        onClose={() => {}}
        productType="art_print"
        mockups={mockMockups}
        artwork={mockArtwork}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Shipping Options')).toBeInTheDocument();
    });

    // Standard shipping should be selected by default
    const standardOption = screen.getByText('Standard Shipping').closest('div');
    expect(standardOption).toHaveClass('border-cyclamen');

    // Click on Express shipping
    const expressOption = screen.getByText('Express Shipping').closest('div');
    fireEvent.click(expressOption!);

    // Express shipping should now be selected
    expect(expressOption).toHaveClass('border-cyclamen');
    
    // Delivery estimate should update
    expect(screen.getByText('✓ Estimated delivery: 2-3 business days')).toBeInTheDocument();
  });

  it('shows loading state while fetching shipping methods', () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <ProductPurchaseModal
        isOpen={true}
        onClose={() => {}}
        productType="art_print"
        mockups={mockMockups}
        artwork={mockArtwork}
      />
    );

    expect(screen.getByText('Loading shipping options...')).toBeInTheDocument();
  });

  it('falls back to default options when API fails', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    render(
      <ProductPurchaseModal
        isOpen={true}
        onClose={() => {}}
        productType="art_print"
        mockups={mockMockups}
        artwork={mockArtwork}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Standard Shipping')).toBeInTheDocument();
    });

    // Should show fallback shipping option
    expect(screen.getByText('5-7 business days')).toBeInTheDocument();
  });

  it('includes shipping method in checkout request', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          shippingMethods: mockShippingMethods
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          sessionId: 'test-session-123'
        })
      });

    render(
      <ProductPurchaseModal
        isOpen={true}
        onClose={() => {}}
        productType="art_print"
        mockups={mockMockups}
        artwork={mockArtwork}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Express Shipping')).toBeInTheDocument();
    });

    // Select express shipping
    fireEvent.click(screen.getByText('Express Shipping').closest('div')!);

    // Click buy now
    fireEvent.click(screen.getByText(/Buy Now/));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/checkout/artwork', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"shippingMethodId":2')
      }));
    });
  });

  it('updates delivery estimate when shipping method changes', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        shippingMethods: mockShippingMethods
      })
    });

    render(
      <ProductPurchaseModal
        isOpen={true}
        onClose={() => {}}
        productType="art_print"
        mockups={mockMockups}
        artwork={mockArtwork}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('✓ Estimated delivery: 5-7 business days')).toBeInTheDocument();
    });

    // Select express shipping
    fireEvent.click(screen.getByText('Express Shipping').closest('div')!);

    // Delivery estimate should update
    expect(screen.getByText('✓ Estimated delivery: 2-3 business days')).toBeInTheDocument();
  });
});
