import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { GallerySection } from '@/components/landing/GallerySection';

// Mock react-responsive-carousel CSS import
vi.mock('react-responsive-carousel/lib/styles/carousel.min.css', () => ({}));

describe('GallerySection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders gallery section with title and description on desktop', () => {
    render(<GallerySection />);
    
    // Title should be hidden on mobile but visible on desktop
    const title = screen.getByText('Gallery');
    expect(title).toBeDefined();
    
    const description = screen.getByText(/See what we've created for other pet moms/);
    expect(description).toBeDefined();
  });

  it('renders all 5 gallery images', () => {
    render(<GallerySection />);
    
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThanOrEqual(5);
    
    // Check that all images have proper alt text
    expect(screen.getByAltText('PawPop artwork example 1')).toBeDefined();
    expect(screen.getByAltText('PawPop artwork example 2')).toBeDefined();
    expect(screen.getByAltText('PawPop artwork example 3')).toBeDefined();
    expect(screen.getByAltText('PawPop artwork example 4')).toBeDefined();
    expect(screen.getByAltText('PawPop artwork example 5')).toBeDefined();
  });

  it('renders navigation arrows', () => {
    render(<GallerySection />);
    
    const prevButton = screen.getByLabelText('Previous image');
    const nextButton = screen.getByLabelText('Next image');
    
    expect(prevButton).toBeDefined();
    expect(nextButton).toBeDefined();
  });

  it('renders dot indicators for navigation', () => {
    render(<GallerySection />);
    
    const dotButtons = screen.getAllByLabelText(/Go to slide \d/);
    expect(dotButtons.length).toBe(5);
  });

  it('has proper accessibility attributes', () => {
    render(<GallerySection />);
    
    const prevButton = screen.getByLabelText('Previous image');
    const nextButton = screen.getByLabelText('Next image');
    
    expect(prevButton.getAttribute('aria-label')).toBe('Previous image');
    expect(nextButton.getAttribute('aria-label')).toBe('Next image');
    
    const dotButtons = screen.getAllByLabelText(/Go to slide \d/);
    dotButtons.forEach((button, index) => {
      expect(button.getAttribute('aria-label')).toBe(`Go to slide ${index + 1}`);
    });
  });

  it('loads first image eagerly and others lazily', () => {
    render(<GallerySection />);
    
    const images = screen.getAllByRole('img');
    
    // First image should load eagerly
    expect(images[0].getAttribute('loading')).toBe('eager');
    
    // Other images should load lazily
    for (let i = 1; i < images.length; i++) {
      expect(images[i].getAttribute('loading')).toBe('lazy');
    }
  });

  it('applies correct CSS classes for mobile-first design', () => {
    render(<GallerySection />);
    
    // Check section has proper background
    const section = document.querySelector('section');
    expect(section?.classList.contains('bg-site-bg')).toBe(true);
    
    // Check images have proper responsive classes
    const images = screen.getAllByRole('img');
    images.forEach(img => {
      expect(img.classList.contains('w-full')).toBe(true);
      expect(img.classList.contains('object-contain')).toBe(true);
    });
  });

  it('has touch-friendly navigation buttons', () => {
    render(<GallerySection />);
    
    const prevButton = screen.getByLabelText('Previous image');
    const nextButton = screen.getByLabelText('Next image');
    
    // Check buttons have touch-friendly classes
    expect(prevButton.classList.contains('touch-manipulation')).toBe(true);
    expect(nextButton.classList.contains('touch-manipulation')).toBe(true);
  });

  it('can navigate to next image', () => {
    render(<GallerySection />);
    
    const nextButton = screen.getByLabelText('Next image');
    
    // Should be able to click without throwing errors
    expect(() => {
      fireEvent.click(nextButton);
    }).not.toThrow();
  });

  it('can navigate to previous image', () => {
    render(<GallerySection />);
    
    const prevButton = screen.getByLabelText('Previous image');
    
    // Should be able to click without throwing errors
    expect(() => {
      fireEvent.click(prevButton);
    }).not.toThrow();
  });

  it('can navigate using dot indicators', () => {
    render(<GallerySection />);
    
    const dotButtons = screen.getAllByLabelText(/Go to slide \d/);
    
    // Should be able to click dots without throwing errors
    expect(() => {
      fireEvent.click(dotButtons[2]); // Click third dot
    }).not.toThrow();
  });

  it('has proper image dimensions for mobile', () => {
    render(<GallerySection />);
    
    const images = screen.getAllByRole('img');
    
    images.forEach(img => {
      // Check that images have auto height with no height constraints
      expect(img.classList.contains('h-auto')).toBe(true);
      expect(img.classList.contains('w-full')).toBe(true);
      // Should not have max-height constraints
      expect(img.className).not.toMatch(/max-h-\[/);
    });
  });
});
