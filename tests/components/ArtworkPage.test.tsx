import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import ArtworkPage from '@/app/artwork/[token]/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the PurchaseModalRouter component
jest.mock('@/components/modals/PurchaseModalRouter', () => ({
  PurchaseModalRouter: ({ isOpen, onClose, variant, artwork }: any) => (
    <div data-testid="purchase-modal" data-variant={variant} data-open={isOpen}>
      <button onClick={onClose}>Close Modal</button>
      <span>Modal Variant: {variant}</span>
    </div>
  ),
  getModalVariant: jest.fn(() => 'equal-tiers'),
  trackModalVariant: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockPush = jest.fn();
const mockRouter = {
  push: mockPush,
};

describe('ArtworkPage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (global.fetch as jest.Mock).mockClear();
    mockPush.mockClear();
  });

  const mockArtwork = {
    id: 'artwork-123',
    generated_image_url: 'https://example.com/artwork.jpg',
    pet_name: 'Fluffy',
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    generation_status: 'completed'
  };

  it('renders loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    
    render(<ArtworkPage params={{ token: 'test-token' }} />);
    
    expect(screen.getByText('Loading your masterpiece...')).toBeInTheDocument();
  });

  it('renders error state when artwork fetch fails', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<ArtworkPage params={{ token: 'test-token' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Oops!')).toBeInTheDocument();
    });
  });

  it('renders "artwork not found" when response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404
    });
    
    render(<ArtworkPage params={{ token: 'test-token' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Artwork not found or link expired')).toBeInTheDocument();
    });
  });

  it('renders artwork confirmed state when generation is not completed', async () => {
    const incompleteArtwork = { ...mockArtwork, generation_status: 'processing' };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ artwork: incompleteArtwork })
    });
    
    render(<ArtworkPage params={{ token: 'test-token' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Artwork Confirmed!')).toBeInTheDocument();
      expect(screen.getByText('Check if Ready')).toBeInTheDocument();
    });
  });

  it('renders completed artwork with "Make it Real" CTA', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ artwork: mockArtwork })
    });
    
    render(<ArtworkPage params={{ token: 'test-token' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('Your Masterpiece is Ready!')).toBeInTheDocument();
      expect(screen.getByText('Make it Real')).toBeInTheDocument();
      expect(screen.getByText('John Doe & Fluffy in the style of the Mona Lisa')).toBeInTheDocument();
    });
  });

  it('displays artwork image when completed', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ artwork: mockArtwork })
    });
    
    render(<ArtworkPage params={{ token: 'test-token' }} />);
    
    await waitFor(() => {
      const artworkImage = screen.getByAltText('Your PawPop Masterpiece');
      expect(artworkImage).toBeInTheDocument();
      expect(artworkImage).toHaveAttribute('src', mockArtwork.generated_image_url);
    });
  });

  it('opens physical-first modal when "Make it Real" is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ artwork: mockArtwork })
    });
    
    render(<ArtworkPage params={{ token: 'test-token' }} />);
    
    await waitFor(() => {
      const makeItRealButton = screen.getByText('Make it Real');
      fireEvent.click(makeItRealButton);
    });
    
    // Check that modal opens with physical-first variant
    const modal = screen.getByTestId('purchase-modal');
    expect(modal).toHaveAttribute('data-variant', 'physical-first');
    expect(modal).toHaveAttribute('data-open', 'true');
  });

  it('closes modal when close button is clicked', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ artwork: mockArtwork })
    });
    
    render(<ArtworkPage params={{ token: 'test-token' }} />);
    
    await waitFor(() => {
      const makeItRealButton = screen.getByText('Make it Real');
      fireEvent.click(makeItRealButton);
    });
    
    const closeButton = screen.getByText('Close Modal');
    fireEvent.click(closeButton);
    
    const modal = screen.getByTestId('purchase-modal');
    expect(modal).toHaveAttribute('data-open', 'false');
  });

  it('handles artwork without pet name', async () => {
    const artworkNoPet = { ...mockArtwork, pet_name: undefined };
    
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ artwork: artworkNoPet })
    });
    
    render(<ArtworkPage params={{ token: 'test-token' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe in the style of the Mona Lisa')).toBeInTheDocument();
    });
  });

  it('refetches artwork when "Check if Ready" is clicked', async () => {
    const incompleteArtwork = { ...mockArtwork, generation_status: 'processing' };
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ artwork: incompleteArtwork })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ artwork: mockArtwork })
      });
    
    render(<ArtworkPage params={{ token: 'test-token' }} />);
    
    await waitFor(() => {
      const checkButton = screen.getByText('Check if Ready');
      fireEvent.click(checkButton);
    });
    
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch).toHaveBeenCalledWith('/api/artwork/test-token');
  });

  it('navigates home when return home button is clicked in error state', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(<ArtworkPage params={{ token: 'test-token' }} />);
    
    await waitFor(() => {
      const returnHomeButton = screen.getByText('Return Home');
      fireEvent.click(returnHomeButton);
    });
    
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});
