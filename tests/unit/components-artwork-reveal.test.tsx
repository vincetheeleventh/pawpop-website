/**
 * Unit Test: ArtworkReveal Component
 * Tests artwork display and actions
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ArtworkReveal from '@/components/shtuu/ArtworkReveal';

describe('ArtworkReveal', () => {
  const mockOnDownload = vi.fn();
  const mockOnShare = vi.fn();

  it('should render artwork image', () => {
    const { container } = render(
      <ArtworkReveal
        imageUrl="https://example.com/artwork.jpg"
        parodyStyle="wizard"
        onDownload={mockOnDownload}
      />
    );

    const image = container.querySelector('img');
    expect(image).toBeDefined();
    expect(image?.getAttribute('alt')).toContain('artwork');
  });

  it('should display success message', () => {
    render(
      <ArtworkReveal
        imageUrl="https://example.com/artwork.jpg"
        parodyStyle="wizard"
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/Ta-da!/i)).toBeDefined();
  });

  it('should show parody style name', () => {
    render(
      <ArtworkReveal
        imageUrl="https://example.com/artwork.jpg"
        parodyStyle="wizard"
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/Wizarding Portrait/i)).toBeDefined();
  });

  it('should render download button', () => {
    render(
      <ArtworkReveal
        imageUrl="https://example.com/artwork.jpg"
        parodyStyle="paws"
        onDownload={mockOnDownload}
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /download/i });
    expect(downloadBtn).toBeDefined();
  });

  it('should call onDownload when download button clicked', () => {
    render(
      <ArtworkReveal
        imageUrl="https://example.com/artwork.jpg"
        parodyStyle="popstar"
        onDownload={mockOnDownload}
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /download/i });
    fireEvent.click(downloadBtn);

    expect(mockOnDownload).toHaveBeenCalledTimes(1);
  });

  it('should show share button when provided', () => {
    render(
      <ArtworkReveal
        imageUrl="https://example.com/artwork.jpg"
        parodyStyle="dogfather"
        onDownload={mockOnDownload}
        onShare={mockOnShare}
      />
    );

    const shareBtn = screen.getByRole('button', { name: /share/i });
    expect(shareBtn).toBeDefined();
  });

  it('should call onShare when share button clicked', () => {
    render(
      <ArtworkReveal
        imageUrl="https://example.com/artwork.jpg"
        parodyStyle="wizard"
        onDownload={mockOnDownload}
        onShare={mockOnShare}
      />
    );

    const shareBtn = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareBtn);

    expect(mockOnShare).toHaveBeenCalledTimes(1);
  });

  it('should display upgrade message', () => {
    render(
      <ArtworkReveal
        imageUrl="https://example.com/artwork.jpg"
        parodyStyle="wizard"
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/high-resolution/i)).toBeDefined();
    expect(screen.getByText(/Coming soon/i)).toBeDefined();
  });

  it('should show option to make another', () => {
    render(
      <ArtworkReveal
        imageUrl="https://example.com/artwork.jpg"
        parodyStyle="wizard"
        onDownload={mockOnDownload}
      />
    );

    expect(screen.getByText(/different style/i)).toBeDefined();
  });
});
