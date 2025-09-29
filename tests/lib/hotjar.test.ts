// tests/lib/hotjar.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  isHotjarAvailable,
  trackHotjarEvent,
  setHotjarUserAttributes,
  triggerHotjarSurvey,
  tagHotjarSession,
  hotjar
} from '@/lib/hotjar';

describe('Hotjar Integration', () => {
  beforeEach(() => {
    // Reset window.hj before each test
    delete (window as any).hj;
    vi.clearAllMocks();
  });

  describe('isHotjarAvailable', () => {
    it('should return false when Hotjar is not loaded', () => {
      expect(isHotjarAvailable()).toBe(false);
    });

    it('should return true when Hotjar is loaded', () => {
      (window as any).hj = vi.fn();
      expect(isHotjarAvailable()).toBe(true);
    });
  });

  describe('trackHotjarEvent', () => {
    it('should not track event when Hotjar is not available', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      trackHotjarEvent('test_event');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Hotjar] Not available, event not tracked:',
        'test_event'
      );
      consoleSpy.mockRestore();
    });

    it('should track event when Hotjar is available', () => {
      const mockHj = vi.fn();
      (window as any).hj = mockHj;
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      trackHotjarEvent('test_event');
      
      expect(mockHj).toHaveBeenCalledWith('event', 'test_event');
      expect(consoleSpy).toHaveBeenCalledWith('[Hotjar] Event tracked:', 'test_event');
      consoleSpy.mockRestore();
    });

    it('should handle errors gracefully', () => {
      const mockHj = vi.fn(() => {
        throw new Error('Hotjar error');
      });
      (window as any).hj = mockHj;
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      trackHotjarEvent('test_event');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Hotjar] Error tracking event:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('setHotjarUserAttributes', () => {
    it('should not set attributes when Hotjar is not available', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      setHotjarUserAttributes({ priceVariant: 'A' });
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Hotjar] Not available, attributes not set'
      );
      consoleSpy.mockRestore();
    });

    it('should set user attributes when Hotjar is available', () => {
      const mockHj = vi.fn();
      (window as any).hj = mockHj;
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const attributes = { priceVariant: 'A', hasPurchased: true };
      setHotjarUserAttributes(attributes);
      
      expect(mockHj).toHaveBeenCalledWith('identify', null, attributes);
      expect(consoleSpy).toHaveBeenCalledWith('[Hotjar] User attributes set:', attributes);
      consoleSpy.mockRestore();
    });
  });

  describe('triggerHotjarSurvey', () => {
    it('should not trigger survey when Hotjar is not available', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      triggerHotjarSurvey('survey_123');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Hotjar] Not available, survey not triggered'
      );
      consoleSpy.mockRestore();
    });

    it('should trigger survey when Hotjar is available', () => {
      const mockHj = vi.fn();
      (window as any).hj = mockHj;
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      triggerHotjarSurvey('survey_123');
      
      expect(mockHj).toHaveBeenCalledWith('trigger', 'survey_123');
      expect(consoleSpy).toHaveBeenCalledWith('[Hotjar] Survey triggered:', 'survey_123');
      consoleSpy.mockRestore();
    });
  });

  describe('tagHotjarSession', () => {
    it('should not tag session when Hotjar is not available', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      tagHotjarSession(['tag1', 'tag2']);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        '[Hotjar] Not available, tags not added'
      );
      consoleSpy.mockRestore();
    });

    it('should tag session when Hotjar is available', () => {
      const mockHj = vi.fn();
      (window as any).hj = mockHj;
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      tagHotjarSession(['tag1', 'tag2']);
      
      expect(mockHj).toHaveBeenCalledWith('tagRecording', ['tag1']);
      expect(mockHj).toHaveBeenCalledWith('tagRecording', ['tag2']);
      expect(consoleSpy).toHaveBeenCalledWith('[Hotjar] Session tagged with:', ['tag1', 'tag2']);
      consoleSpy.mockRestore();
    });
  });

  describe('hotjar helper object', () => {
    beforeEach(() => {
      (window as any).hj = vi.fn();
    });

    describe('landingPage events', () => {
      it('should track landing page viewed', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.landingPage.viewed();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'landing_page_viewed');
      });

      it('should track CTA clicked', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.landingPage.ctaClicked();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'landing_cta_clicked');
      });

      it('should track why PawPop opened', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.landingPage.whyPawPopOpened();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'why_pawpop_opened');
      });
    });

    describe('upload flow events', () => {
      it('should track modal opened', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.upload.modalOpened();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'upload_modal_opened');
      });

      it('should track photo uploaded', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.upload.photoUploaded();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'photo_uploaded');
      });

      it('should track form submitted', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.upload.formSubmitted();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'upload_form_submitted');
      });

      it('should track generation started', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.upload.generationStarted();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'generation_started');
      });

      it('should track generation completed', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.upload.generationCompleted();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'generation_completed');
      });

      it('should track errors with error type', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.upload.error('validation_error');
        
        expect(mockHj).toHaveBeenCalledWith('event', 'upload_error_validation_error');
      });
    });

    describe('artwork page events', () => {
      it('should track page viewed', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.artwork.pageViewed();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'artwork_page_viewed');
      });

      it('should track image loaded', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.artwork.imageLoaded();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'artwork_image_loaded');
      });

      it('should track CTA clicked', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.artwork.ctaClicked();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'artwork_cta_clicked');
      });
    });

    describe('purchase flow events', () => {
      it('should track modal opened', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.purchase.modalOpened();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'purchase_modal_opened');
      });

      it('should track product selected with type', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.purchase.productSelected('canvas_framed');
        
        expect(mockHj).toHaveBeenCalledWith('event', 'product_selected_canvas_framed');
      });

      it('should track checkout started', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.purchase.checkoutStarted();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'checkout_started');
      });

      it('should track checkout completed', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.purchase.checkoutCompleted();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'checkout_completed');
      });

      it('should track errors', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.purchase.error();
        
        expect(mockHj).toHaveBeenCalledWith('event', 'checkout_error');
      });
    });

    describe('user attributes and session tagging', () => {
      it('should set user attributes', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.setUser({
          priceVariant: 'A',
          customerEmail: 'test@example.com',
          hasCompletedGeneration: true,
          hasPurchased: false
        });
        
        expect(mockHj).toHaveBeenCalledWith('identify', null, {
          priceVariant: 'A',
          customerEmail: 'test@example.com',
          hasCompletedGeneration: true,
          hasPurchased: false
        });
      });

      it('should tag session with multiple tags', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.tagSession(['high_value', 'returning_customer']);
        
        expect(mockHj).toHaveBeenCalledWith('tagRecording', ['high_value']);
        expect(mockHj).toHaveBeenCalledWith('tagRecording', ['returning_customer']);
      });

      it('should trigger survey', () => {
        const mockHj = vi.fn();
        (window as any).hj = mockHj;
        
        hotjar.triggerSurvey('post_purchase_nps');
        
        expect(mockHj).toHaveBeenCalledWith('trigger', 'post_purchase_nps');
      });
    });
  });
});
