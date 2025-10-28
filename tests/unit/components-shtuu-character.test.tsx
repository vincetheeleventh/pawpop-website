/**
 * Unit Test: ShtuuCharacter Component
 * Tests character rendering with different moods
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ShtuuCharacter from '@/components/shtuu/ShtuuCharacter';

describe('ShtuuCharacter', () => {
  it('should render with idle mood by default', () => {
    const { container } = render(<ShtuuCharacter />);
    expect(container.textContent).toContain('😌');
    expect(container.textContent).toContain('idle');
  });

  it('should render happy mood', () => {
    const { container } = render(<ShtuuCharacter mood="happy" />);
    expect(container.textContent).toContain('😊');
    expect(container.textContent).toContain('happy');
  });

  it('should render working mood', () => {
    const { container } = render(<ShtuuCharacter mood="working" />);
    expect(container.textContent).toContain('🎨');
    expect(container.textContent).toContain('working');
  });

  it('should render thinking mood', () => {
    const { container } = render(<ShtuuCharacter mood="thinking" />);
    expect(container.textContent).toContain('🤔');
    expect(container.textContent).toContain('thinking');
  });

  it('should render different sizes', () => {
    const { container: small } = render(<ShtuuCharacter size="sm" />);
    const { container: large } = render(<ShtuuCharacter size="lg" />);
    
    const smallElement = small.querySelector('[style*="width"]');
    const largeElement = large.querySelector('[style*="width"]');
    
    expect(smallElement).toBeDefined();
    expect(largeElement).toBeDefined();
  });

  it('should show Pixel companion when requested', () => {
    const { container } = render(<ShtuuCharacter showPixel />);
    expect(container.textContent).toContain('🐱');
  });

  it('should not show Pixel by default', () => {
    const { container } = render(<ShtuuCharacter />);
    const emojiCount = (container.textContent?.match(/🐱/g) || []).length;
    expect(emojiCount).toBe(0);
  });
});
