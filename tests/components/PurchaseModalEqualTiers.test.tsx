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

// Mock pricing utilities
vi.mock('@/lib/printify-products', () => ({
  ProductType: {
    DIGITAL: 'DIGITAL',
    ART_PRINT: 'ART_PRINT',
    CANVAS_FRAMED: 'CANVAS_FRAMED'
  },
  getProductPricing: vi.fn((type, size) => {
    if (type === 'DIGITAL') return 999; // $9.99
    if (type === 'ART_PRINT') return 2999; // $29.99
    if (type === 'CANVAS_FRAMED') return 7999; // $79.99
    return 0;
  })
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

function mockCouponPreviewResponse(original: number, final: number, code = 'EQUAL1') {
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

describe('PurchaseModalEqualTiers', () => {
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
          if (body.productType === 'ART_PRINT') {
            return Promise.resolve(mockCouponPreviewResponse(2999, 100));
          }
        }
        return Promise.resolve(mockCouponPreviewResponse(7999, 500));
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ sessionId: 'test-session-id' })
      } as Response);
    });
  });

  it('renders equal tiers layout with pricing options', () => {
    render(
      <PurchaseModalEqualTiers isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    expect(screen.getByText('Choose Your Format')).toBeInTheDocument();
    expect(screen.getByText('Digital Download')).toBeInTheDocument();
    expect(screen.getByText('Fine Art Print')).toBeInTheDocument();
    expect(screen.getByText('Framed Canvas')).toBeInTheDocument();
  });

  it('shows coupon controls after selecting an option', async () => {
    render(
      <PurchaseModalEqualTiers isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    fireEvent.click(screen.getByText('Fine Art Print').closest('div')!);

    await waitFor(() => {
      expect(document.getElementById('equal-tiers-coupon')).toBeTruthy();
    });
  });

  it('applies coupon and displays savings message for art print', async () => {
    render(
      <PurchaseModalEqualTiers isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    fireEvent.click(screen.getByText('Fine Art Print').closest('div')!);

    await waitFor(() => {
      expect(document.getElementById('equal-tiers-coupon')).toBeTruthy();
    });

    const couponInput = document.getElementById('equal-tiers-coupon') as HTMLInputElement;
    fireEvent.change(couponInput, { target: { value: 'tierdeal' } });
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      const couponCall = fetchMock.mock.calls.find((call) => call[0] === '/api/coupons/validate');
      expect(couponCall).toBeTruthy();
    });

    await waitFor(() => {
      expect(screen.getByTestId('coupon-success-message')).toHaveTextContent(
        'Coupon applied! Checkout price: $1.00 (saved $28.99).'
      );
    });
  });

  it('includes coupon metadata when completing checkout', async () => {
    render(
      <PurchaseModalEqualTiers isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    fireEvent.click(screen.getByText('Fine Art Print').closest('div')!);
    await waitFor(() => {
      expect(document.getElementById('equal-tiers-coupon')).toBeTruthy();
    });

    const couponInput = document.getElementById('equal-tiers-coupon') as HTMLInputElement;
    fireEvent.change(couponInput, { target: { value: 'tierdeal' } });
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => screen.getByText('Get My Masterpiece'));
    fireEvent.click(screen.getByText('Get My Masterpiece'));

    await waitFor(() => {
      const checkoutCall = [...fetchMock.mock.calls].reverse().find((call) => call[0] === '/api/checkout/artwork');
      expect(checkoutCall).toBeTruthy();
      const [, init] = checkoutCall!;
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body).toMatchObject({ couponCode: 'EQUAL1', variant: 'equal-tiers' });
    });
  });

  it('shows discounted price inside selected tier when coupon applied', async () => {
    render(
      <PurchaseModalEqualTiers isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    fireEvent.click(screen.getByText('Fine Art Print').closest('div')!);
    await waitFor(() => document.getElementById('equal-tiers-coupon'));

    const couponInput = document.getElementById('equal-tiers-coupon') as HTMLInputElement;
    fireEvent.change(couponInput, { target: { value: 'tierdeal' } });
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      const priceText = screen.getByText('$1.00');
      expect(priceText).toBeInTheDocument();
      const container = priceText.closest('div');
      expect(container?.textContent).toContain('$29.99');
    });
  });

  it('supports digital tier coupon application', async () => {
    render(
      <PurchaseModalEqualTiers isOpen={true} onClose={mockOnClose} artwork={mockArtwork} />
    );

    fireEvent.click(screen.getByText('Digital Download').closest('div')!);
    await waitFor(() => document.getElementById('equal-tiers-coupon'));

    const couponInput = document.getElementById('equal-tiers-coupon') as HTMLInputElement;
    fireEvent.change(couponInput, { target: { value: 'digitaldeal' } });
    fireEvent.click(screen.getByText('Apply'));

    await waitFor(() => {
      expect(screen.getByTestId('coupon-success-message')).toHaveTextContent(
        'Coupon applied! Checkout price: $1.00 (saved $8.99).'
      );
    });

    fireEvent.click(screen.getByText('Get My Masterpiece'));

    await waitFor(() => {
      const checkoutCall = [...fetchMock.mock.calls].reverse().find((call) => call[0] === '/api/checkout/artwork');
      const [, init] = checkoutCall!;
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body).toMatchObject({ productType: 'DIGITAL', couponCode: 'EQUAL1' });
    });
  });
});
