import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clarity, setTag, setTags, trackEvent, identify, upgradeSession, consent } from '@/lib/clarity';

describe('Clarity Analytics', () => {
  beforeEach(() => {
    // Reset window.clarity
    delete (window as any).clarity;
    
    // Mock environment variable
    process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = 'test_project_id';
    
    // Reset clarity instance
    (clarity as any).config = {
      projectId: 'test_project_id',
      isEnabled: true
    };
    (clarity as any).isInitialized = false;
  });

  describe('Initialization', () => {
    it('should initialize when project ID is configured', () => {
      clarity.initialize();
      expect((clarity as any).isInitialized).toBe(true);
    });

    it('should not initialize without project ID', () => {
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID = '';
      (clarity as any).config.projectId = '';
      (clarity as any).config.isEnabled = false;
      
      clarity.initialize();
      expect((clarity as any).isInitialized).toBe(false);
    });

    it('should not double-initialize', () => {
      clarity.initialize();
      const firstInit = (clarity as any).isInitialized;
      clarity.initialize();
      expect((clarity as any).isInitialized).toBe(firstInit);
    });
  });

  describe('Custom Tags', () => {
    beforeEach(() => {
      // Mock clarity function
      (window as any).clarity = vi.fn();
    });

    it('should set single tag', () => {
      setTag('test_key', 'test_value');
      expect(window.clarity).toHaveBeenCalledWith('set', 'test_key', 'test_value');
    });

    it('should set multiple tags', () => {
      setTags({
        key1: 'value1',
        key2: 123,
        key3: true
      });
      
      expect(window.clarity).toHaveBeenCalledWith('set', 'key1', 'value1');
      expect(window.clarity).toHaveBeenCalledWith('set', 'key2', 123);
      expect(window.clarity).toHaveBeenCalledWith('set', 'key3', true);
    });

    it('should handle array values', () => {
      setTag('tags', ['tag1', 'tag2', 'tag3']);
      expect(window.clarity).toHaveBeenCalledWith('set', 'tags', ['tag1', 'tag2', 'tag3']);
    });

    it('should gracefully handle when clarity not available', () => {
      delete (window as any).clarity;
      expect(() => setTag('test', 'value')).not.toThrow();
    });
  });

  describe('Event Tracking', () => {
    beforeEach(() => {
      (window as any).clarity = vi.fn();
    });

    it('should track simple event', () => {
      trackEvent('test_event');
      expect(window.clarity).toHaveBeenCalledWith('event', 'test_event');
    });

    it('should track event with tags', () => {
      trackEvent('test_event', {
        tags: {
          category: 'test',
          value: 123
        }
      });
      
      expect(window.clarity).toHaveBeenCalledWith('set', 'category', 'test');
      expect(window.clarity).toHaveBeenCalledWith('set', 'value', 123);
      expect(window.clarity).toHaveBeenCalledWith('event', 'test_event');
    });

    it('should handle event tracking when disabled', () => {
      (clarity as any).config.isEnabled = false;
      expect(() => trackEvent('test')).not.toThrow();
    });
  });

  describe('User Identification', () => {
    beforeEach(() => {
      (window as any).clarity = vi.fn();
    });

    it('should identify user with ID only', () => {
      identify('user_123');
      expect(window.clarity).toHaveBeenCalledWith('identify', 'user_123', undefined, undefined, undefined);
    });

    it('should identify user with friendly name', () => {
      identify('user_123', 'John Doe');
      expect(window.clarity).toHaveBeenCalledWith('identify', 'user_123', undefined, undefined, 'John Doe');
    });

    it('should handle identification when disabled', () => {
      (clarity as any).config.isEnabled = false;
      expect(() => identify('user_123')).not.toThrow();
    });
  });

  describe('Session Upgrade', () => {
    beforeEach(() => {
      (window as any).clarity = vi.fn();
    });

    it('should upgrade session with reason', () => {
      upgradeSession('purchase_completed');
      expect(window.clarity).toHaveBeenCalledWith('upgrade', 'purchase_completed');
    });

    it('should handle multiple upgrade calls', () => {
      upgradeSession('reason1');
      upgradeSession('reason2');
      expect(window.clarity).toHaveBeenCalledTimes(2);
    });
  });

  describe('Consent', () => {
    beforeEach(() => {
      (window as any).clarity = vi.fn();
    });

    it('should grant consent', () => {
      consent();
      expect(window.clarity).toHaveBeenCalledWith('consent');
    });
  });

  describe('Configuration', () => {
    it('should return current config', () => {
      const config = clarity.getConfig();
      expect(config).toHaveProperty('projectId');
      expect(config).toHaveProperty('isEnabled');
    });

    it('should check if enabled', () => {
      expect(clarity.isEnabled()).toBe(true);
      
      (clarity as any).config.isEnabled = false;
      expect(clarity.isEnabled()).toBe(false);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Mock clarity to throw errors
      (window as any).clarity = vi.fn(() => {
        throw new Error('Clarity error');
      });
    });

    it('should handle errors in setTag gracefully', () => {
      expect(() => setTag('key', 'value')).not.toThrow();
    });

    it('should handle errors in trackEvent gracefully', () => {
      expect(() => trackEvent('event')).not.toThrow();
    });

    it('should handle errors in identify gracefully', () => {
      expect(() => identify('user')).not.toThrow();
    });

    it('should handle errors in upgradeSession gracefully', () => {
      expect(() => upgradeSession('reason')).not.toThrow();
    });
  });

  describe('SSR Safety', () => {
    it('should handle server-side rendering', () => {
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;
      
      expect(() => {
        setTag('test', 'value');
        trackEvent('test');
        identify('user');
        upgradeSession('reason');
        consent();
      }).not.toThrow();
      
      global.window = originalWindow;
    });
  });
});
