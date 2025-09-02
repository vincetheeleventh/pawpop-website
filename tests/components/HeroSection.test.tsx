import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeroSection } from '@/components/landing/HeroSection';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock the UploadModal component
vi.mock('@/components/forms/UploadModal', () => ({
  UploadModal: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="upload-modal" style={{ display: isOpen ? 'block' : 'none' }}>
      <button onClick={onClose} data-testid="modal-close">Close Modal</button>
      <div>Upload Modal Content</div>
    </div>
  ),
}));

describe('HeroSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders hero content correctly', () => {
    render(<HeroSection />);
    
    expect(screen.getByText('The Unforgettable Gift for Pet Moms')).toBeInTheDocument();
    expect(screen.getByText('Upload Photo Now')).toBeInTheDocument();
    expect(screen.getByAltText('Pet mom transformed into Mona Lisa with her dog')).toBeInTheDocument();
  });

  it('opens upload modal when CTA button is clicked', () => {
    render(<HeroSection />);
    
    const ctaButton = screen.getByText('Upload Photo Now');
    fireEvent.click(ctaButton);
    
    expect(screen.getByTestId('upload-modal')).toBeVisible();
    expect(screen.getByText('Upload Modal Content')).toBeInTheDocument();
  });

  it('closes upload modal when close is triggered', () => {
    render(<HeroSection />);
    
    // Open modal
    const ctaButton = screen.getByText('Upload Photo Now');
    fireEvent.click(ctaButton);
    
    expect(screen.getByTestId('upload-modal')).toBeVisible();
    
    // Close modal
    const closeButton = screen.getByTestId('modal-close');
    fireEvent.click(closeButton);
    
    expect(screen.getByTestId('upload-modal')).not.toBeVisible();
  });

  it('has proper button styling and accessibility', () => {
    render(<HeroSection />);
    
    const ctaButton = screen.getByText('Upload Photo Now');
    
    expect(ctaButton).toHaveClass('bg-mona-gold');
    expect(ctaButton).toHaveClass('hover:bg-yellow-600');
    expect(ctaButton).toHaveClass('touch-manipulation');
    expect(ctaButton.tagName).toBe('BUTTON');
  });

  it('displays character intro text', () => {
    render(<HeroSection />);
    
    // The character intro should be present
    const characterText = screen.getByText(/Bonjour! I am Monsieur Brush/);
    expect(characterText).toBeInTheDocument();
  });

  it('has responsive image styling', () => {
    render(<HeroSection />);
    
    const heroImage = screen.getByAltText('Pet mom transformed into Mona Lisa with her dog');
    expect(heroImage).toHaveClass('w-full');
    expect(heroImage).toHaveClass('rounded-2xl');
    expect(heroImage).toHaveClass('shadow-2xl');
  });
});
