import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useClarityTracking } from '@/hooks/useClarityTracking';
import * as clarityLib from '@/lib/clarity';
import * as plausibleLib from '@/lib/plausible';

// Mock the clarity and plausible libraries
vi.mock('@/lib/clarity', () => ({
  clarity: {
    isEnabled: vi.fn(() => true)
  },
  setTag: vi.fn(),
  setTags: vi.fn(),
  trackEvent: vi.fn(),
  upgradeSession: vi.fn()
}));

vi.mock('@/lib/plausible', () => ({
  plausible: {
    getPriceVariant: vi.fn(() => 'A'),
    getPriceConfig: vi.fn(() => ({
      variant: 'A',
      digital: 15,
      print: 39,
      canvas: 59,
      label: 'Standard Pricing'
    }))
  }
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => '/test-path'
}));

describe('useClarityTracking Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize hook successfully', () => {
      const { result } = renderHook(() => useClarityTracking());
      
      expect(result.current).toHaveProperty('setTag');
      expect(result.current).toHaveProperty('setTags');
      expect(result.current).toHaveProperty('trackEvent');
      expect(result.current).toHaveProperty('trackFunnel');
      expect(result.current).toHaveProperty('trackInteraction');
      expect(result.current).toHaveProperty('trackPerformance');
    });

    it('should provide current path', () => {
      const { result } = renderHook(() => useClarityTracking());
      expect(result.current.currentPath).toBe('/test-path');
    });

    it('should indicate if enabled', () => {
      const { result } = renderHook(() => useClarityTracking());
      expect(result.current.isEnabled).toBe(true);
    });
  });

  describe('Price Variant Tags', () => {
    it('should set price variant tags from Plausible', () => {
      const { result } = renderHook(() => useClarityTracking());
      
      result.current.setPriceVariantTags();
      
      expect(clarityLib.setTags).toHaveBeenCalledWith({
        price_variant: 'A',
        variant_label: 'Standard Pricing',
        digital_price: 15,
        print_price: 39,
        canvas_price: 59
      });
    });
  });

  describe('Funnel Tracking', () => {
    it('should track upload modal opened', () => {
      const { result } = renderHook(() => useClarityTracking());
      
      result.current.trackFunnel.uploadModalOpened();
      
      expect(clarityLib.trackEvent).toHaveBeenCalledWith('upload_modal_opened');
      expect(clarityLib.setTag).toHaveBeenCalledWith('funnel_step', 'upload_modal');
    });

    it('should track photo uploaded', () => {
      const { result } = renderHook(() => useClarityTracking());
      
      result.current.trackFunnel.photoUploaded('image/jpeg', 5000000);
      
      expect(clarityLib.trackEvent).toHaveBeenCalledWith('photo_uploaded');
      expect(clarityLib.setTag).toHaveBeenCalledWith('funnel_step', 'photo_uploaded');
      expect(clarityLib.setTag).toHaveBeenCalledWith('upload_file_type', 'image/jpeg');
      expect(clarityLib.setTag).toHaveBeenCalledWith('upload_file_size_mb', 5);
    });

    it('should track artwork completed and upgrade session', () => {
      const { result } = renderHook(() => useClarityTracking());
      
      result.current.trackFunnel.artworkCompleted(15);
      
      expect(clarityLib.trackEvent).toHaveBeenCalledWith('artwork_completed');
      expect(clarityLib.setTag).toHaveBeenCalledWith('funnel_step', 'artwork_completed');
      expect(clarityLib.setTag).toHaveBeenCalledWith('generation_time_seconds', 15);
      expect(clarityLib.upgradeSession).toHaveBeenCalledWith('artwork_completed');
    });

    it('should track purchase completed and upgrade session', () => {
      const { result } = renderHook(() => useClarityTracking());
      
      result.current.trackFunnel.purchaseCompleted('order_123', 'canvas_framed', 99);
      
      expect(clarityLib.trackEvent).toHaveBeenCalledWith('purchase_completed');
      expect(clarityLib.setTags).toHaveBeenCalledWith({
        funnel_step: 'purchase_completed',
        order_id: 'order_123',
        purchased_product_type: 'canvas_framed',
        purchased_price: 99,
        is_customer: 'true'
      });
      expect(clarityLib.upgradeSession).toHaveBeenCalledWith('purchase_completed');
    });
  });

  describe('Interaction Tracking', () => {
    it('should track button clicks', () => {
      const { result } = renderHook(() => useClarityTracking());
      
      result.current.trackInteraction.buttonClick('Upload Photo', 'Hero Section');
      
      expect(clarityLib.trackEvent).toHaveBeenCalledWith('button_clicked');
      expect(clarityLib.setTags).toHaveBeenCalledWith({
        last_button_clicked: 'Upload Photo',
        button_location: 'Hero Section'
      });
    });

    it('should track modal opened', () => {
      const { result } = renderHook(() => useClarityTracking());
      
      result.current.trackInteraction.modalOpened('Purchase Modal');
      
      expect(clarityLib.trackEvent).toHaveBeenCalledWith('modal_opened_Purchase Modal');
      expect(clarityLib.setTag).toHaveBeenCalledWith('current_modal', 'Purchase Modal');
    });

    it('should track errors and upgrade session', () => {
      const { result } = renderHook(() => useClarityTracking());
      
      result.current.trackInteraction.errorOccurred('upload_error', 'File too large');
      
      expect(clarityLib.trackEvent).toHaveBeenCalledWith('error_occurred');
      expect(clarityLib.setTags).toHaveBeenCalled();
      expect(clarityLib.upgradeSession).toHaveBeenCalledWith('error_occurred');
    });
  });

  describe('Performance Tracking', () => {
    it('should track slow page load', () => {
      const { result } = renderHook(() => useClarityTracking());
      
      result.current.trackPerformance.slowLoad(5000);
      
      expect(clarityLib.trackEvent).toHaveBeenCalledWith('slow_page_load');
      expect(clarityLib.setTags).toHaveBeenCalledWith({
        slow_load: 'true',
        page_load_time_seconds: 5
      });
      expect(clarityLib.upgradeSession).toHaveBeenCalledWith('slow_page_load');
    });

    it('should not track fast page loads', () => {
      const { result } = renderHook(() => useClarityTracking());
      
      result.current.trackPerformance.slowLoad(2000);
      
      expect(clarityLib.trackEvent).not.toHaveBeenCalled();
    });

    it('should track slow API calls', () => {
      const { result } = renderHook(() => useClarityTracking());
      
      result.current.trackPerformance.slowApiCall('/api/artwork', 6000);
      
      expect(clarityLib.trackEvent).toHaveBeenCalledWith('slow_api_call');
      expect(clarityLib.setTags).toHaveBeenCalled();
    });

    it('should track generation timeout', () => {
      const { result } = renderHook(() => useClarityTracking());
      
      result.current.trackPerformance.generationTimeout('monalisa');
      
      expect(clarityLib.trackEvent).toHaveBeenCalledWith('generation_timeout');
      expect(clarityLib.upgradeSession).toHaveBeenCalledWith('generation_timeout');
    });
  });

  describe('User Segmentation', () => {
    it('should set user segment', () => {
      const { result } = renderHook(() => useClarityTracking());
      
      result.current.setUserSegment('high_value');
      
      expect(clarityLib.setTag).toHaveBeenCalledWith('user_segment', 'high_value');
    });
  });
});
