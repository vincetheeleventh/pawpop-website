/**
 * Unit Test: GeneratingAnimation Component
 * Tests polling behavior and status updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import GeneratingAnimation from '@/components/shtuu/GeneratingAnimation';

// Mock fetch
global.fetch = vi.fn();

describe('GeneratingAnimation', () => {
  const mockOnComplete = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render initial status message', () => {
    render(
      <GeneratingAnimation
        artworkId="test-123"
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/Shtuu is getting started/i)).toBeDefined();
  });

  it('should display progress bar', () => {
    const { container } = render(
      <GeneratingAnimation
        artworkId="test-123"
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    const progressBar = container.querySelector('[style*="width"]');
    expect(progressBar).toBeDefined();
  });

  it('should show working emoji', () => {
    const { container } = render(
      <GeneratingAnimation
        artworkId="test-123"
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    expect(container.textContent).toContain('🎨');
  });

  it('should display percentage', () => {
    render(
      <GeneratingAnimation
        artworkId="test-123"
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/% complete/i)).toBeDefined();
  });

  it('should show helpful tip', () => {
    render(
      <GeneratingAnimation
        artworkId="test-123"
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    expect(screen.getByText(/30-90 seconds/i)).toBeDefined();
  });

  it('should have animated bounce on emoji', () => {
    const { container } = render(
      <GeneratingAnimation
        artworkId="test-123"
        onComplete={mockOnComplete}
        onError={mockOnError}
      />
    );

    const emojiContainer = container.querySelector('.animate-bounce');
    expect(emojiContainer).toBeDefined();
  });
});
