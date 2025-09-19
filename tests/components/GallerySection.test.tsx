import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GallerySection } from '@/components/landing/GallerySection';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ChevronLeft: ({ className, ...props }: any) => (
    <div data-testid="chevron-left" className={className} {...props}>
      ←
    </div>
  ),
  ChevronRight: ({ className, ...props }: any) => (
    <div data-testid="chevron-right" className={className} {...props}>
      →
    </div>
  ),
}));

describe('GallerySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders gallery section with title and description', () => {
    render(<GallerySection />);
    
    expect(screen.getByText('Gallery')).toBeInTheDocument();
    expect(screen.getByText(/See how we transform beloved pets into timeless masterpieces/)).toBeInTheDocument();
  });

  it('renders all 5 gallery images', () => {
    render(<GallerySection />);
    
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(5);
    
    // Check that all images have proper alt text
    expect(screen.getByAltText('PawPop artwork example 1')).toBeInTheDocument();
    expect(screen.getByAltText('PawPop artwork example 2')).toBeInTheDocument();
    expect(screen.getByAltText('PawPop artwork example 3')).toBeInTheDocument();
    expect(screen.getByAltText('PawPop artwork example 4')).toBeInTheDocument();
    expect(screen.getByAltText('PawPop artwork example 5')).toBeInTheDocument();
  });

  it('renders navigation arrows', () => {
    render(<GallerySection />);
    
    const prevButton = screen.getByLabelText('Previous image');
    const nextButton = screen.getByLabelText('Next image');
    
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
    expect(screen.getByTestId('chevron-left')).toBeInTheDocument();
    expect(screen.getByTestId('chevron-right')).toBeInTheDocument();
  });

  it('renders dot indicators for all images', () => {
    render(<GallerySection />);
    
    const dotButtons = screen.getAllByLabelText(/Go to image \d/);
    expect(dotButtons).toHaveLength(5);
    
    // First dot should be active (highlighted)
    expect(dotButtons[0]).toHaveClass('bg-mona-gold');
    expect(dotButtons[1]).toHaveClass('bg-gray-300');
  });

  it('displays image counter', () => {
    render(<GallerySection />);
    
    expect(screen.getByText('1 of 5')).toBeInTheDocument();
  });

  it('navigates to next image when next button is clicked', async () => {
    vi.useFakeTimers();
    render(<GallerySection />);
    
    const nextButton = screen.getByLabelText('Next image');
    const imageCounter = screen.getByText('1 of 5');
    
    fireEvent.click(nextButton);
    
    // Fast-forward timers to complete transition
    vi.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('2 of 5')).toBeInTheDocument();
    });
    
    vi.useRealTimers();
  });

  it('navigates to previous image when previous button is clicked', async () => {
    vi.useFakeTimers();
    render(<GallerySection />);
    
    const nextButton = screen.getByLabelText('Next image');
    const prevButton = screen.getByLabelText('Previous image');
    
    // First go to second image
    fireEvent.click(nextButton);
    vi.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('2 of 5')).toBeInTheDocument();
    });
    
    // Then go back to first image
    fireEvent.click(prevButton);
    vi.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('1 of 5')).toBeInTheDocument();
    });
    
    vi.useRealTimers();
  });

  it('wraps around to first image when clicking next on last image', async () => {
    vi.useFakeTimers();
    render(<GallerySection />);
    
    const nextButton = screen.getByLabelText('Next image');
    
    // Navigate to last image (click next 4 times)
    for (let i = 0; i < 4; i++) {
      fireEvent.click(nextButton);
      vi.advanceTimersByTime(300);
    }
    
    await waitFor(() => {
      expect(screen.getByText('5 of 5')).toBeInTheDocument();
    });
    
    // Click next again to wrap to first image
    fireEvent.click(nextButton);
    vi.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('1 of 5')).toBeInTheDocument();
    });
    
    vi.useRealTimers();
  });

  it('wraps around to last image when clicking previous on first image', async () => {
    vi.useFakeTimers();
    render(<GallerySection />);
    
    const prevButton = screen.getByLabelText('Previous image');
    
    // Should start at first image, clicking previous should go to last
    fireEvent.click(prevButton);
    vi.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('5 of 5')).toBeInTheDocument();
    });
    
    vi.useRealTimers();
  });

  it('navigates to specific image when dot indicator is clicked', async () => {
    vi.useFakeTimers();
    render(<GallerySection />);
    
    const thirdDot = screen.getByLabelText('Go to image 3');
    
    fireEvent.click(thirdDot);
    vi.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(screen.getByText('3 of 5')).toBeInTheDocument();
    });
    
    // Check that the third dot is now active
    const dotButtons = screen.getAllByLabelText(/Go to image \d/);
    expect(dotButtons[2]).toHaveClass('bg-mona-gold');
    expect(dotButtons[0]).toHaveClass('bg-gray-300');
    
    vi.useRealTimers();
  });

  it('disables navigation during transitions', async () => {
    vi.useFakeTimers();
    render(<GallerySection />);
    
    const nextButton = screen.getByLabelText('Next image');
    const prevButton = screen.getByLabelText('Previous image');
    const dotButtons = screen.getAllByLabelText(/Go to image \d/);
    
    // Start a transition
    fireEvent.click(nextButton);
    
    // Buttons should be disabled during transition
    expect(nextButton).toBeDisabled();
    expect(prevButton).toBeDisabled();
    dotButtons.forEach(button => {
      expect(button).toBeDisabled();
    });
    
    // Complete transition
    vi.advanceTimersByTime(300);
    
    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
      expect(prevButton).not.toBeDisabled();
      dotButtons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });
    
    vi.useRealTimers();
  });

  it('handles touch swipe gestures', async () => {
    vi.useFakeTimers();
    render(<GallerySection />);
    
    const galleryContainer = screen.getByRole('img').closest('[data-testid]') || 
                           screen.getByRole('img').parentElement?.parentElement;
    
    if (!galleryContainer) {
      // Find the container with touch handlers
      const container = document.querySelector('[style*="touch-action"]');
      expect(container).toBeInTheDocument();
      
      if (container) {
        // Simulate left swipe (next image)
        fireEvent.touchStart(container, {
          touches: [{ clientX: 100 }]
        });
        fireEvent.touchMove(container, {
          touches: [{ clientX: 50 }]
        });
        fireEvent.touchEnd(container);
        
        vi.advanceTimersByTime(300);
        
        await waitFor(() => {
          expect(screen.getByText('2 of 5')).toBeInTheDocument();
        });
      }
    }
    
    vi.useRealTimers();
  });

  it('ignores small touch movements', () => {
    render(<GallerySection />);
    
    const container = document.querySelector('[style*="touch-action"]');
    
    if (container) {
      // Simulate small movement (should not trigger navigation)
      fireEvent.touchStart(container, {
        touches: [{ clientX: 100 }]
      });
      fireEvent.touchMove(container, {
        touches: [{ clientX: 90 }] // Only 10px movement
      });
      fireEvent.touchEnd(container);
      
      // Should still be on first image
      expect(screen.getByText('1 of 5')).toBeInTheDocument();
    }
  });

  it('applies correct CSS classes for styling', () => {
    render(<GallerySection />);
    
    // Check section has proper background
    const section = screen.getByRole('region') || 
                   document.querySelector('section');
    expect(section).toHaveClass('bg-site-bg');
    
    // Check gallery container has proper styling
    const container = document.querySelector('[style*="touch-action"]');
    expect(container).toHaveClass('rounded-2xl', 'shadow-2xl', 'bg-white');
  });

  it('has proper accessibility attributes', () => {
    render(<GallerySection />);
    
    const prevButton = screen.getByLabelText('Previous image');
    const nextButton = screen.getByLabelText('Next image');
    
    expect(prevButton).toHaveAttribute('aria-label', 'Previous image');
    expect(nextButton).toHaveAttribute('aria-label', 'Next image');
    
    const dotButtons = screen.getAllByLabelText(/Go to image \d/);
    dotButtons.forEach((button, index) => {
      expect(button).toHaveAttribute('aria-label', `Go to image ${index + 1}`);
    });
  });

  it('loads first image eagerly and others lazily', () => {
    render(<GallerySection />);
    
    const images = screen.getAllByRole('img');
    
    // First image should load eagerly
    expect(images[0]).toHaveAttribute('loading', 'eager');
    
    // Other images should load lazily
    for (let i = 1; i < images.length; i++) {
      expect(images[i]).toHaveAttribute('loading', 'lazy');
    }
  });
});
