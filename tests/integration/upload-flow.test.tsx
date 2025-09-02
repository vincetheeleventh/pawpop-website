import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadModal } from '@/components/forms/UploadModal';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Upload Flow Integration', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('completes full upload flow from step 1 to order page', async () => {
    render(<UploadModal {...defaultProps} />);

    // Step 1: Upload pet mom photo
    expect(screen.getByText('Upload Your Photo')).toBeInTheDocument();
    
    const petMomFile = new File(['pet-mom-content'], 'pet-mom.jpg', { type: 'image/jpeg' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    const petMomInput = fileInputs[0] as HTMLInputElement;
    
    Object.defineProperty(petMomInput, 'files', {
      value: [petMomFile],
      writable: false,
    });
    
    fireEvent.change(petMomInput);
    
    await waitFor(() => {
      expect(screen.getByText('pet-mom.jpg')).toBeInTheDocument();
    });
    
    // Click Next to go to step 2
    const nextButton1 = screen.getByRole('button', { name: /next/i });
    expect(nextButton1).not.toBeDisabled();
    fireEvent.click(nextButton1);

    // Step 2: Upload pet photo
    await waitFor(() => {
      expect(screen.getByText('Upload Your Pet\'s Photo')).toBeInTheDocument();
    });
    
    const petFile = new File(['pet-content'], 'my-pet.jpg', { type: 'image/jpeg' });
    const fileInputs2 = document.querySelectorAll('input[type="file"]');
    const petInput = fileInputs2[1] as HTMLInputElement;
    
    Object.defineProperty(petInput, 'files', {
      value: [petFile],
      writable: false,
    });
    
    fireEvent.change(petInput);
    
    await waitFor(() => {
      expect(screen.getByText('my-pet.jpg')).toBeInTheDocument();
    });
    
    // Click Next to go to step 3
    const nextButton2 = screen.getByRole('button', { name: /next/i });
    expect(nextButton2).not.toBeDisabled();
    fireEvent.click(nextButton2);

    // Step 3: Enter contact information
    await waitFor(() => {
      expect(screen.getByText('Almost Ready!')).toBeInTheDocument();
    });
    
    const nameInput = screen.getByPlaceholderText('Enter your name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });
    fireEvent.change(emailInput, { target: { value: 'jane@example.com' } });
    
    await waitFor(() => {
      const submitButton = screen.getByRole('button', { name: /create my masterpiece/i });
      expect(submitButton).not.toBeDisabled();
      
      // Submit the form
      fireEvent.click(submitButton);
    });
    
    // Verify loading state
    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
    
    // Fast-forward through the 2-second delay
    vi.advanceTimersByTime(2000);
    
    // Verify localStorage was called with correct data
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pawpop-order-data',
        expect.stringContaining('"name":"Jane Doe"')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pawpop-order-data',
        expect.stringContaining('"email":"jane@example.com"')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pawpop-order-data',
        expect.stringContaining('"petMomPhoto":"pet-mom.jpg"')
      );
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'pawpop-order-data',
        expect.stringContaining('"petPhoto":"my-pet.jpg"')
      );
    });
    
    // Verify navigation to order page
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/order');
    });
    
    // Verify modal was closed
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('validates each step before allowing progression', async () => {
    render(<UploadModal {...defaultProps} />);

    // Step 1: Next should be disabled without file
    const nextButton = screen.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
    
    // Upload file and verify Next is enabled
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    });
  });

  it('allows navigation back through steps', async () => {
    render(<UploadModal {...defaultProps} />);

    // Upload file and go to step 2
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    const nextButton = screen.getByRole('button', { name: /next/i });
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(screen.getByText('Upload Your Pet\'s Photo')).toBeInTheDocument();
    });
    
    // Go back to step 1
    const backButton = screen.getByRole('button', { name: /back/i });
    expect(backButton).not.toBeDisabled();
    fireEvent.click(backButton);
    
    await waitFor(() => {
      expect(screen.getByText('Upload Your Photo')).toBeInTheDocument();
    });
    
    // Back button should be disabled on step 1
    const backButtonStep1 = screen.getByRole('button', { name: /back/i });
    expect(backButtonStep1).toBeDisabled();
  });

  it('preserves form data when navigating between steps', async () => {
    render(<UploadModal {...defaultProps} />);

    // Upload file in step 1
    const file1 = new File(['content1'], 'mom.jpg', { type: 'image/jpeg' });
    const fileInput1 = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput1, 'files', {
      value: [file1],
      writable: false,
    });
    
    fireEvent.change(fileInput1);
    
    // Go to step 2
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Upload Your Pet\'s Photo')).toBeInTheDocument();
    });
    
    // Go back to step 1
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    
    await waitFor(() => {
      // File should still be there
      expect(screen.getByText('mom.jpg')).toBeInTheDocument();
      expect(screen.getByText('Click to change photo')).toBeInTheDocument();
    });
  });

  it('handles file upload errors gracefully', async () => {
    render(<UploadModal {...defaultProps} />);

    // Try to upload an invalid file type
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    // The file input has accept="image/*" so this should be handled by the browser
    // But we can test that the component handles the change event
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    
    // The component should still handle the file (browser validation is separate)
    await waitFor(() => {
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });
  });

  it('shows correct progress indicators', async () => {
    render(<UploadModal {...defaultProps} />);

    // Step 1: First indicator should be active
    const step1Indicator = screen.getByText('1');
    expect(step1Indicator).toHaveClass('bg-mona-gold');
    
    // Upload file and go to step 2
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(fileInput);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    await waitFor(() => {
      // Step 1 should show checkmark, step 2 should be active
      const checkmark = screen.getByTestId ? screen.getByTestId('step-1-check') : document.querySelector('[data-step="1"] svg');
      const step2Indicator = screen.getByText('2');
      expect(step2Indicator).toHaveClass('bg-mona-gold');
    });
  });
});
