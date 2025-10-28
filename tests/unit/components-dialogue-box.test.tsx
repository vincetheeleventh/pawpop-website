/**
 * Unit Test: DialogueBox Component
 * Tests dialogue display and interaction
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DialogueBox from '@/components/shtuu/DialogueBox';

describe('DialogueBox', () => {
  it('should render message', () => {
    render(<DialogueBox message="Hello, test!" />);
    expect(screen.getByText('Hello, test!')).toBeDefined();
  });

  it('should render options when provided', () => {
    const options = [
      { id: 'opt1', label: 'Option 1', emoji: '🎨' },
      { id: 'opt2', label: 'Option 2', emoji: '🐕' }
    ];

    render(<DialogueBox message="Choose one" options={options} />);
    
    expect(screen.getByText(/Option 1/i)).toBeDefined();
    expect(screen.getByText(/Option 2/i)).toBeDefined();
  });

  it('should call onSelectOption when button clicked', () => {
    const handleSelect = vi.fn();
    const options = [{ id: 'test', label: 'Test Option' }];

    render(
      <DialogueBox 
        message="Choose" 
        options={options} 
        onSelectOption={handleSelect} 
      />
    );

    const button = screen.getByRole('button', { name: /Test Option/i });
    fireEvent.click(button);

    expect(handleSelect).toHaveBeenCalledWith('test');
  });

  it('should not show options while typing', () => {
    const options = [{ id: 'test', label: 'Test' }];

    render(
      <DialogueBox 
        message="Hello" 
        options={options} 
        isTyping={true} 
      />
    );

    expect(screen.queryByRole('button')).toBeNull();
  });

  it('should show typing indicator', () => {
    const { container } = render(
      <DialogueBox message="Hello" isTyping={true} />
    );

    const typingIndicator = container.querySelector('.animate-pulse');
    expect(typingIndicator).toBeDefined();
  });

  it('should render emoji in options', () => {
    const options = [{ id: 'dog', label: 'Dog', emoji: '🐕' }];

    const { container } = render(
      <DialogueBox message="Test" options={options} />
    );

    expect(container.textContent).toContain('🐕');
  });

  it('should handle disabled options', () => {
    const handleSelect = vi.fn();
    const options = [{ id: 'disabled', label: 'Disabled', disabled: true }];

    render(
      <DialogueBox 
        message="Test" 
        options={options} 
        onSelectOption={handleSelect} 
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(handleSelect).not.toHaveBeenCalled();
  });

  it('should render speech bubble styling', () => {
    const { container } = render(<DialogueBox message="Test" />);
    
    const speechBubble = container.querySelector('.bg-card-surface');
    expect(speechBubble).toBeDefined();
  });
});
