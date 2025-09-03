import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PurchaseModalRouter, getModalVariant, trackModalVariant } from '@/components/modals/PurchaseModalRouter';

// Mock the individual modal components
vi.mock('@/components/modals/PurchaseModalDigitalFirst', () => ({
  PurchaseModalDigitalFirst: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="digital-first-modal" onClick={onClose}>Digital First Modal</div> : null
}));

vi.mock('@/components/modals/PurchaseModalEqualTiers', () => ({
  PurchaseModalEqualTiers: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="equal-tiers-modal" onClick={onClose}>Equal Tiers Modal</div> : null
}));

vi.mock('@/components/modals/PurchaseModalPhysicalFirst', () => ({
  PurchaseModalPhysicalFirst: ({ isOpen, onClose }: any) => 
    isOpen ? <div data-testid="physical-first-modal" onClick={onClose}>Physical First Modal</div> : null
}));

// Mock crypto for consistent testing
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn(() => new Uint8Array([1, 2, 3, 4]))
  }
});

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Mock window.gtag for analytics
Object.defineProperty(window, 'gtag', {
  value: vi.fn()
});

const mockArtwork = {
  id: 'test-artwork-123',
  generated_image_url: '/test-image.jpg',
  customer_name: 'Test Customer',
  customer_email: 'test@example.com',
  pet_name: 'Buddy'
};

describe('PurchaseModalRouter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('renders digital-first modal when variant is digital-first', () => {
    render(
      <PurchaseModalRouter
        isOpen={true}
        onClose={() => {}}
        variant="digital-first"
        artwork={mockArtwork}
      />
    );

    expect(screen.getByTestId('digital-first-modal')).toBeInTheDocument();
  });

  it('renders equal-tiers modal when variant is equal-tiers', () => {
    render(
      <PurchaseModalRouter
        isOpen={true}
        onClose={() => {}}
        variant="equal-tiers"
        artwork={mockArtwork}
      />
    );

    expect(screen.getByTestId('equal-tiers-modal')).toBeInTheDocument();
  });

  it('renders physical-first modal when variant is physical-first', () => {
    render(
      <PurchaseModalRouter
        isOpen={true}
        onClose={() => {}}
        variant="physical-first"
        artwork={mockArtwork}
      />
    );

    expect(screen.getByTestId('physical-first-modal')).toBeInTheDocument();
  });

  it('defaults to equal-tiers modal for unknown variant', () => {
    render(
      <PurchaseModalRouter
        isOpen={true}
        onClose={() => {}}
        variant={'unknown-variant' as any}
        artwork={mockArtwork}
      />
    );

    expect(screen.getByTestId('equal-tiers-modal')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <PurchaseModalRouter
        isOpen={false}
        onClose={() => {}}
        variant="digital-first"
        artwork={mockArtwork}
      />
    );

    expect(screen.queryByTestId('digital-first-modal')).not.toBeInTheDocument();
  });

  it('calls onClose when modal is clicked', () => {
    const onClose = vi.fn();
    render(
      <PurchaseModalRouter
        isOpen={true}
        onClose={onClose}
        variant="digital-first"
        artwork={mockArtwork}
      />
    );

    fireEvent.click(screen.getByTestId('digital-first-modal'));
    expect(onClose).toHaveBeenCalled();
  });
});

describe('getModalVariant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('returns stored variant from sessionStorage', () => {
    mockSessionStorage.getItem.mockReturnValue('physical-first');
    
    const variant = getModalVariant();
    
    expect(variant).toBe('physical-first');
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith('modal-variant');
  });

  it('generates and stores new variant when none exists', () => {
    mockSessionStorage.getItem.mockReturnValue(null);
    
    const variant = getModalVariant();
    
    expect(['digital-first', 'equal-tiers', 'physical-first']).toContain(variant);
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith('modal-variant', variant);
  });

  it('returns equal-tiers when window is undefined (SSR)', () => {
    const originalWindow = global.window;
    // @ts-ignore
    delete global.window;
    
    const variant = getModalVariant();
    
    expect(variant).toBe('equal-tiers');
    
    global.window = originalWindow;
  });
});

describe('trackModalVariant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('logs to console', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    trackModalVariant('equal-tiers', 'purchase_completed');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      'Modal A/B Test - equal-tiers: purchase_completed',
      undefined
    );
    
    consoleSpy.mockRestore();
  });

  it('handles function call without errors', () => {
    expect(() => {
      trackModalVariant('physical-first', 'modal_closed');
    }).not.toThrow();
  });
});
