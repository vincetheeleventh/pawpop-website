// tests/components/ExamplesSection.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ExamplesSection } from '@/components/landing/ExamplesSection';

describe('ExamplesSection', () => {
  it('renders the section title and subtitle', () => {
    render(<ExamplesSection />);
    
    expect(screen.getByText('From Photo to Masterpiece')).toBeInTheDocument();
    expect(screen.getByText('See the magic happen with real transformations')).toBeInTheDocument();
  });

  it('renders all example pairs', () => {
    render(<ExamplesSection />);
    
    // Check that all alt texts are present
    expect(screen.getByText('Sarah & Bella → Renaissance Masterpiece')).toBeInTheDocument();
    expect(screen.getByText('Jennifer & Muffin → Classical Portrait')).toBeInTheDocument();
    expect(screen.getByText('Lisa & Charlie → Artistic Transformation')).toBeInTheDocument();
  });

  it('displays before images by default', () => {
    render(<ExamplesSection />);
    
    const beforeImages = screen.getAllByAltText(/^Before:/);
    expect(beforeImages).toHaveLength(3);
    
    beforeImages.forEach(img => {
      expect(img).toHaveClass('opacity-100');
    });
  });

  it('shows after images on hover', () => {
    render(<ExamplesSection />);
    
    const firstContainer = screen.getByText('Sarah & Bella → Renaissance Masterpiece').closest('.relative');
    expect(firstContainer).toBeInTheDocument();
    
    if (firstContainer) {
      fireEvent.mouseEnter(firstContainer);
      
      const afterImage = screen.getByAltText('After: Renaissance Masterpiece');
      expect(afterImage).toHaveClass('opacity-100');
    }
  });

  it('shows before images when not hovering', () => {
    render(<ExamplesSection />);
    
    const firstContainer = screen.getByText('Sarah & Bella → Renaissance Masterpiece').closest('.relative');
    expect(firstContainer).toBeInTheDocument();
    
    if (firstContainer) {
      fireEvent.mouseLeave(firstContainer);
      
      const beforeImage = screen.getByAltText('Before: Sarah & Bella');
      expect(beforeImage).toHaveClass('opacity-100');
    }
  });

  it('renders the call to action button', () => {
    render(<ExamplesSection />);
    
    const ctaButton = screen.getByRole('button', { name: 'Make My Masterpiece' });
    expect(ctaButton).toBeInTheDocument();
    expect(ctaButton).toHaveClass('bg-mona-gold');
  });

  it('displays hover overlay with sparkle icon', () => {
    render(<ExamplesSection />);
    
    const sparkleIcons = screen.getAllByText('✨');
    expect(sparkleIcons).toHaveLength(3);
  });

  it('shows correct labels for before/after states', () => {
    render(<ExamplesSection />);
    
    // Should show "Before" labels by default
    const beforeLabels = screen.getAllByText('Before');
    expect(beforeLabels).toHaveLength(3);
  });

  it('has proper responsive grid layout classes', () => {
    render(<ExamplesSection />);
    
    const gridContainer = screen.getByText('Sarah & Bella → Renaissance Masterpiece').closest('.grid');
    expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
  });
});
