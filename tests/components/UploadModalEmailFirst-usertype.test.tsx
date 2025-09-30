// Tests for user type tracking (gifter vs self-purchaser) in UploadModalEmailFirst

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadModalEmailFirst } from '@/components/forms/UploadModalEmailFirst';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  })),
  usePathname: jest.fn(() => '/')
}));

// Mock analytics hooks
jest.mock('@/hooks/usePlausibleTracking', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    trackFunnel: {
      emailCaptured: jest.fn(),
      uploadModalOpened: jest.fn(),
      photoUploaded: jest.fn(),
      artworkGenerationStarted: jest.fn(),
      artworkCompleted: jest.fn()
    },
    trackInteraction: {
      modalOpen: jest.fn(),
      buttonClick: jest.fn(),
      formStart: jest.fn(),
      formComplete: jest.fn(),
      featureUsed: jest.fn()
    },
    trackPerformance: {
      imageGeneration: jest.fn()
    },
    trackEvent: jest.fn()
  }))
}));

jest.mock('@/hooks/useClarityTracking', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    trackFunnel: {
      uploadModalOpened: jest.fn(),
      photoUploaded: jest.fn(),
      artworkGenerationStarted: jest.fn()
    },
    trackInteraction: {
      formStarted: jest.fn(),
      formCompleted: jest.fn(),
      buttonClick: jest.fn(),
      errorOccurred: jest.fn()
    },
    setTag: jest.fn()
  }))
}));

// Mock Google Ads
jest.mock('@/lib/google-ads', () => ({
  trackPhotoUpload: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

describe('UploadModalEmailFirst - User Type Tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders email input and gift toggle', () => {
    render(
      <UploadModalEmailFirst isOpen={true} onClose={jest.fn()} />
    );

    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument();
    expect(screen.getByText('Is this a gift?')).toBeInTheDocument();
    expect(screen.getByLabelText('Toggle gift status')).toBeInTheDocument();
  });

  it('does not render name input (frictionless email capture)', () => {
    render(
      <UploadModalEmailFirst isOpen={true} onClose={jest.fn()} />
    );

    expect(screen.queryByPlaceholderText(/pet mom's name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
  });

  it('toggles gift status when clicked', () => {
    render(
      <UploadModalEmailFirst isOpen={true} onClose={jest.fn()} />
    );

    const toggle = screen.getByLabelText('Toggle gift status');
    
    // Initially off (self-purchaser)
    expect(toggle).toHaveClass('bg-gray-300');
    
    // Click to turn on (gifter)
    fireEvent.click(toggle);
    expect(toggle).toHaveClass('bg-atomic-tangerine');
    
    // Click again to turn off
    fireEvent.click(toggle);
    expect(toggle).toHaveClass('bg-gray-300');
  });

  it('tracks self-purchaser user type on email capture', async () => {
    const usePlausibleTracking = require('@/hooks/usePlausibleTracking').default;
    const trackEventMock = jest.fn();
    usePlausibleTracking.mockReturnValue({
      trackFunnel: {
        emailCaptured: jest.fn()
      },
      trackInteraction: {
        formStart: jest.fn(),
        formComplete: jest.fn()
      },
      trackPerformance: {},
      trackEvent: trackEventMock
    });

    const useClarityTracking = require('@/hooks/useClarityTracking').default;
    const setTagMock = jest.fn();
    useClarityTracking.mockReturnValue({
      trackFunnel: {},
      trackInteraction: {
        formStarted: jest.fn(),
        formCompleted: jest.fn()
      },
      setTag: setTagMock
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ artwork: { id: 'test-artwork-123' }, access_token: 'test-token' })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ uploadToken: 'test-upload-token' })
    });

    render(
      <UploadModalEmailFirst isOpen={true} onClose={jest.fn()} />
    );

    // Fill email (gift toggle OFF = self-purchaser)
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Check Plausible tracking
      expect(trackEventMock).toHaveBeenCalledWith('Email Captured', {
        user_type: 'self_purchaser',
        is_gift: false
      });

      // Check Clarity tagging
      expect(setTagMock).toHaveBeenCalledWith('user_type', 'self_purchaser');
      expect(setTagMock).toHaveBeenCalledWith('is_gift', false);
    });
  });

  it('tracks gifter user type when gift toggle is on', async () => {
    const usePlausibleTracking = require('@/hooks/usePlausibleTracking').default;
    const trackEventMock = jest.fn();
    usePlausibleTracking.mockReturnValue({
      trackFunnel: {
        emailCaptured: jest.fn()
      },
      trackInteraction: {
        formStart: jest.fn(),
        formComplete: jest.fn()
      },
      trackPerformance: {},
      trackEvent: trackEventMock
    });

    const useClarityTracking = require('@/hooks/useClarityTracking').default;
    const setTagMock = jest.fn();
    useClarityTracking.mockReturnValue({
      trackFunnel: {},
      trackInteraction: {
        formStarted: jest.fn(),
        formCompleted: jest.fn()
      },
      setTag: setTagMock
    });

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ artwork: { id: 'test-artwork-123' }, access_token: 'test-token' })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ uploadToken: 'test-upload-token' })
    });

    render(
      <UploadModalEmailFirst isOpen={true} onClose={jest.fn()} />
    );

    // Fill email
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'gifter@example.com' } });

    // Turn ON gift toggle
    const toggle = screen.getByLabelText('Toggle gift status');
    fireEvent.click(toggle);

    // Submit
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Check Plausible tracking
      expect(trackEventMock).toHaveBeenCalledWith('Email Captured', {
        user_type: 'gifter',
        is_gift: true
      });

      // Check Clarity tagging
      expect(setTagMock).toHaveBeenCalledWith('user_type', 'gifter');
      expect(setTagMock).toHaveBeenCalledWith('is_gift', true);
    });
  });

  it('sends higher conversion value to Google Ads for gifters', async () => {
    const { trackPhotoUpload } = require('@/lib/google-ads');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ artwork: { id: 'test-artwork-123' }, access_token: 'test-token' })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ uploadToken: 'test-upload-token' })
    });

    render(
      <UploadModalEmailFirst isOpen={true} onClose={jest.fn()} />
    );

    // Fill email and enable gift toggle
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'gifter@example.com' } });
    
    const toggle = screen.getByLabelText('Toggle gift status');
    fireEvent.click(toggle);

    // Submit
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Gifters should have $3 CAD conversion value (higher than $2 for self-purchasers)
      expect(trackPhotoUpload).toHaveBeenCalledWith(3, {
        email: 'gifter@example.com'
      });
    });
  });

  it('sends standard conversion value to Google Ads for self-purchasers', async () => {
    const { trackPhotoUpload } = require('@/lib/google-ads');

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ artwork: { id: 'test-artwork-123' }, access_token: 'test-token' })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ uploadToken: 'test-upload-token' })
    });

    render(
      <UploadModalEmailFirst isOpen={true} onClose={jest.fn()} />
    );

    // Fill email (gift toggle OFF)
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'self@example.com' } });

    // Submit
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Self-purchasers should have $2 CAD conversion value
      expect(trackPhotoUpload).toHaveBeenCalledWith(2, {
        email: 'self@example.com'
      });
    });
  });

  it('sends user_type to artwork creation API', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ artwork: { id: 'test-artwork-123' }, access_token: 'test-token' })
    }).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ uploadToken: 'test-upload-token' })
    });

    render(
      <UploadModalEmailFirst isOpen={true} onClose={jest.fn()} />
    );

    // Fill email and enable gift toggle
    const emailInput = screen.getByPlaceholderText('your@email.com');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    
    const toggle = screen.getByLabelText('Toggle gift status');
    fireEvent.click(toggle);

    // Submit
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/artwork/create',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_name: '',
            customer_email: 'test@example.com',
            email_captured_at: expect.any(String),
            upload_deferred: false,
            user_type: 'gifter'
          })
        })
      );
    });
  });

  it('shows validation error when email is empty', async () => {
    render(
      <UploadModalEmailFirst isOpen={true} onClose={jest.fn()} />
    );

    // Try to submit without email
    const submitButton = screen.getByRole('button', { name: /continue/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter your email')).toBeInTheDocument();
    });
  });

  it('autofocuses email input for better UX', () => {
    render(
      <UploadModalEmailFirst isOpen={true} onClose={jest.fn()} />
    );

    const emailInput = screen.getByPlaceholderText('your@email.com');
    expect(emailInput).toHaveAttribute('autoFocus');
  });
});
