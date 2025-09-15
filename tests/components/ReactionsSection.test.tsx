// tests/components/ReactionsSection.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReactionsSection } from '@/components/landing/ReactionsSection';

// Mock timers for carousel auto-advance
vi.useFakeTimers();

describe('ReactionsSection', () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders the section title and subtitle', () => {
    render(<ReactionsSection />);
    
    expect(screen.getByText('The Look on Their Face Says It All')).toBeInTheDocument();
    expect(screen.getByText('Real reactions from pet moms who received their masterpieces')).toBeInTheDocument();
  });

  it('renders the first testimonial by default', () => {
    render(<ReactionsSection />);
    
    expect(screen.getByText(/The look on her face was priceless/)).toBeInTheDocument();
    expect(screen.getByText('Sarah M.')).toBeInTheDocument();
    expect(screen.getByText("Bella's Mom")).toBeInTheDocument();
    expect(screen.getByText('🎁')).toBeInTheDocument();
  });

  it('renders navigation arrows', () => {
    render(<ReactionsSection />);
    
    const prevButton = screen.getByLabelText('Previous testimonial');
    const nextButton = screen.getByLabelText('Next testimonial');
    
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('renders dot indicators for all testimonials', () => {
    render(<ReactionsSection />);
    
    const dots = screen.getAllByLabelText(/Go to testimonial \d+/);
    expect(dots).toHaveLength(5); // Should have 5 testimonials
  });

  it('navigates to next testimonial when next button is clicked', async () => {
    render(<ReactionsSection />);
    
    const nextButton = screen.getByLabelText('Next testimonial');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText(/I couldn't stop laughing and crying/)).toBeInTheDocument();
      expect(screen.getByText('Jennifer K.')).toBeInTheDocument();
    });
  });

  it('navigates to previous testimonial when previous button is clicked', async () => {
    render(<ReactionsSection />);
    
    // First go to next testimonial
    const nextButton = screen.getByLabelText('Next testimonial');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Jennifer K.')).toBeInTheDocument();
    });
    
    // Then go back to previous
    const prevButton = screen.getByLabelText('Previous testimonial');
    fireEvent.click(prevButton);
    
    await waitFor(() => {
      expect(screen.getByText('Sarah M.')).toBeInTheDocument();
    });
  });

  it('navigates to specific testimonial when dot is clicked', async () => {
    render(<ReactionsSection />);
    
    const thirdDot = screen.getByLabelText('Go to testimonial 3');
    fireEvent.click(thirdDot);
    
    await waitFor(() => {
      expect(screen.getByText(/My wife was speechless/)).toBeInTheDocument();
      expect(screen.getByText('David R.')).toBeInTheDocument();
    });
  });

  it('highlights the active dot indicator', () => {
    render(<ReactionsSection />);
    
    const firstDot = screen.getByLabelText('Go to testimonial 1');
    expect(firstDot).toHaveClass('bg-mona-gold', 'scale-125');
  });

  it('auto-advances to next testimonial after 4 seconds', async () => {
    render(<ReactionsSection />);
    
    // Initially shows first testimonial
    expect(screen.getByText('Sarah M.')).toBeInTheDocument();
    
    // Fast-forward 4 seconds
    vi.advanceTimersByTime(4000);
    
    await waitFor(() => {
      expect(screen.getByText('Jennifer K.')).toBeInTheDocument();
    });
  });

  it('stops auto-advance when user interacts with carousel', async () => {
    render(<ReactionsSection />);
    
    // Click next button to stop auto-advance
    const nextButton = screen.getByLabelText('Next testimonial');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Jennifer K.')).toBeInTheDocument();
    });
    
    // Fast-forward 4 seconds - should not auto-advance immediately
    vi.advanceTimersByTime(4000);
    
    // Should still show Jennifer (second testimonial)
    expect(screen.getByText('Jennifer K.')).toBeInTheDocument();
  });

  it('wraps around to first testimonial after last one', async () => {
    render(<ReactionsSection />);
    
    // Navigate to last testimonial (index 4)
    const lastDot = screen.getByLabelText('Go to testimonial 5');
    fireEvent.click(lastDot);
    
    await waitFor(() => {
      expect(screen.getByText('Alex T.')).toBeInTheDocument();
    });
    
    // Click next should wrap to first
    const nextButton = screen.getByLabelText('Next testimonial');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Sarah M.')).toBeInTheDocument();
    });
  });

  it('displays mobile swipe hint on mobile', () => {
    render(<ReactionsSection />);
    
    const swipeHint = screen.getByText(/👈 Swipe to see more reactions 👉/);
    expect(swipeHint).toBeInTheDocument();
    expect(swipeHint.closest('div')).toHaveClass('md:hidden');
  });

  it('renders all testimonial emojis correctly', async () => {
    render(<ReactionsSection />);
    
    const testimonialEmojis = ['🎁', '❤️', '🐾', '🎨', '👑'];
    
    for (let i = 0; i < testimonialEmojis.length; i++) {
      const dot = screen.getByLabelText(`Go to testimonial ${i + 1}`);
      fireEvent.click(dot);
      
      await waitFor(() => {
        expect(screen.getByText(testimonialEmojis[i])).toBeInTheDocument();
      });
    }
  });
});
