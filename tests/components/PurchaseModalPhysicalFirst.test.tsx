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
    CANVAS_STRETCHED: 'CANVAS_STRETCHED',
    CANVAS_FRAMED: 'CANVAS_FRAMED'
  },
  getProductPricing: vi.fn((type, size, _country, frameUpgrade = false) => {
    if (type === 'DIGITAL') return 999; // $9.99
    if (type === 'ART_PRINT') {
      if (size === '12x18') return 2499; // $24.99
      if (size === '16x24') return 2999; // $29.99
      if (size === '20x30') return 3499; // $34.99
    }
    if (type === 'CANVAS_STRETCHED') {
      if (frameUpgrade) return 8999; // $89.99 when upgraded
      if (size === '12x18') return 6499; // $64.99
      if (size === '16x24') return 7499; // $74.99
      if (size === '20x30') return 8499; // $84.99
    }
    if (type === 'CANVAS_FRAMED') {
      if (size === '12x18') return 8999; // $89.99
      if (size === '16x24') return 9999; // $99.99
      if (size === '20x30') return 10999; // $109.99
    }
    return 0;
  }),
  getAvailableSizes: vi.fn(() => ['12x18', '16x24', '20x30'])
}));

const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

const mockArtwork = {
  id: 'test-artwork-123',
  generated_image_url: '/test-image.jpg',
  customer_name: 'Sarah',
  customer_email: 'sarah@example.com',
  pet_name: 'Bella'
};

function mockCouponPreviewResponse(original: number, final: number, code = 'TEST1') {
  return {
    ok: true,
    json: () =>
      Promise.resolve({
        coupon: { code },
        originalUnitPriceCents: original,
        finalUnitPriceCents: final,
        discountPerUnitCents: original - final,
        totalDiscountCents: original - final,
        quantity: 1
      })
  } as Response;
}

describe('PurchaseModalPhysicalFirst', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockImplementation((url: RequestInfo, init?: RequestInit) => {
      if (url === '/api/coupons/validate') {
        if (init?.body && typeof init.body === 'string') {
          const body = JSON.parse(init.body);
          if (body.productType === 'DIGITAL') {
            return Promise.resolve(mockCouponPreviewResponse(999, 100));
          }
        }
        return Promise.resolve(mockCouponPreviewResponse(2999, 100));
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ sessionId: 'test-session-id' })
      } as Response);
    });
  });

  it('renders physical-first layout with product options', () => {
    render(
      <PurchaseModalPhysicalFirst isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    expect(screen.getByText('The Perfect Gift')).toBeInTheDocument();
    expect(screen.getByText('Fine Art Print')).toBeInTheDocument();
    expect(screen.getByText('Canvas (Stretched)')).toBeInTheDocument();
    expect(screen.getByText('Canvas (Framed)')).toBeInTheDocument();
  });

  it('shows free digital copy highlight on physical options', () => {
    render(
      <PurchaseModalPhysicalFirst isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    expect(screen.getAllByText('Free digital copy included')[0]).toBeInTheDocument();
  });

  it('displays pricing with CAD currency', () => {
    render(
      <PurchaseModalPhysicalFirst isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    expect(screen.getByText('$29.99 CAD')).toBeInTheDocument();
    expect(screen.getByText('$74.99 CAD')).toBeInTheDocument();
  });

  it('reveals purchase controls after selecting a product', async () => {
    render(
      <PurchaseModalPhysicalFirst isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    expect(screen.queryByText('Order My Masterpiece')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Fine Art Print').closest('div')!);

    await waitFor(() => {
      expect(screen.getByText('Order My Masterpiece')).toBeInTheDocument();
      expect(document.getElementById('physical-first-coupon')).toBeTruthy();
    });
  });

  it('applies coupon for selected physical product', async () => {
    render(
      <PurchaseModalPhysicalFirst isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    fireEvent.click(screen.getByText('Fine Art Print').closest('div')!);

    await waitFor(() => {
      expect(document.getElementById('physical-first-coupon')).toBeTruthy();
    });
    const physicalInput = document.getElementById('physical-first-coupon') as HTMLInputElement;
    fireEvent.change(physicalInput, { target: { value: 'testcoupon' } });
    fireEvent.click(screen.getAllByText('Apply')[0]);

    await waitFor(() => {
      const couponCall = fetchMock.mock.calls.find((call) => call[0] === '/api/coupons/validate');
      expect(couponCall).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByTestId('coupon-success-message')).toHaveTextContent(
        'Coupon applied! Checkout price: $1.00 CAD (saved $28.99 CAD).'
      );
    });
  });

  it('sends coupon code metadata when purchasing after applying coupon', async () => {
    render(
      <PurchaseModalPhysicalFirst isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    fireEvent.click(screen.getByText('Fine Art Print').closest('div')!);
    await waitFor(() => {
      expect(document.getElementById('physical-first-coupon')).toBeTruthy();
    });
    const physicalInput = document.getElementById('physical-first-coupon') as HTMLInputElement;
    fireEvent.change(physicalInput, { target: { value: 'testcoupon' } });
    fireEvent.click(screen.getAllByText('Apply')[0]);

    await waitFor(() => screen.getByText('Order My Masterpiece'));

    fireEvent.click(screen.getByText('Order My Masterpiece'));

    await waitFor(() => {
      const checkoutCall = [...fetchMock.mock.calls].reverse().find((call) => call[0] === '/api/checkout/artwork');
      expect(checkoutCall).toBeTruthy();
      const [, init] = checkoutCall!;
      expect(init).toMatchObject({ method: 'POST' });
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body).toMatchObject({
        artworkId: 'test-artwork-123',
        productType: 'ART_PRINT',
        size: '16x24',
        couponCode: 'TEST1'
      });
    });
  });

  it('applies coupon to digital download flow', async () => {
    render(
      <PurchaseModalPhysicalFirst isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    const digitalInput = document.getElementById('physical-first-digital-coupon') as HTMLInputElement;
    fireEvent.change(digitalInput, { target: { value: 'digitaldeal' } });
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(screen.getByTestId('coupon-success-message')).toHaveTextContent(
        'Coupon applied! Checkout price: $1.00 CAD (saved $8.99 CAD).'
      );
    });

    fireEvent.click(screen.getByText(/Download digital copy only/));

    await waitFor(() => {
      const checkoutCall = [...fetchMock.mock.calls].reverse().find((call) => call[0] === '/api/checkout/artwork');
      const [, init] = checkoutCall!;
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body).toMatchObject({
        productType: 'DIGITAL',
        size: 'digital',
        couponCode: 'TEST1'
      });
    });
  });

  it('updates checkout payload when selecting different size', async () => {
    render(
      <PurchaseModalPhysicalFirst isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    fireEvent.click(screen.getByText('Fine Art Print').closest('div')!);
    fireEvent.click(screen.getByText('20x30"').closest('button')!);

    await waitFor(() => screen.getByText('Order My Masterpiece'));
    fireEvent.click(screen.getByText('Order My Masterpiece'));

    await waitFor(() => {
      const checkoutCall = [...fetchMock.mock.calls].reverse().find((call) => call[0] === '/api/checkout/artwork');
      const [, init] = checkoutCall!;
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.size).toBe('20x30');
    });
  });

  it('shows frame upgrade toggle for canvas stretched selection', async () => {
    render(
      <PurchaseModalPhysicalFirst isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    fireEvent.click(screen.getByText('Canvas (Stretched)').closest('div')!);

    await waitFor(() => {
      expect(screen.getByText(/Add Professional Frame/)).toBeInTheDocument();
    });
  });
});
