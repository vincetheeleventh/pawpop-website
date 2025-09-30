// Microsoft Clarity analytics integration
// Provides session recording, heatmaps, and UX insights

declare global {
  interface Window {
    clarity?: {
      (command: 'identify', userId: string, sessionId?: string, pageId?: string, friendlyName?: string): void;
      (command: 'consent'): void;
      (command: 'set', key: string, value: string | number | boolean | string[]): void;
      (command: 'event', eventName: string): void;
      (command: 'upgrade', upgradeReason: string): void;
      q?: any[];
    };
  }
}

interface ClarityConfig {
  projectId: string;
  isEnabled: boolean;
}

interface ClarityCustomTag {
  key: string;
  value: string | number | boolean | string[];
}

interface ClarityEventOptions {
  tags?: Record<string, string | number | boolean>;
}

class ClarityAnalytics {
  private config: ClarityConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.config = {
      projectId: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || '',
      isEnabled: typeof window !== 'undefined' && !!process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID
    };
  }

  /**
   * Initialize Clarity (called automatically by ClarityScript component)
   */
  initialize(): void {
    if (typeof window === 'undefined' || !this.config.isEnabled) {
      console.log('[Clarity] Disabled - no project ID configured');
      return;
    }

    if (this.isInitialized) {
      console.log('[Clarity] Already initialized');
      return;
    }

    this.isInitialized = true;
    console.log('[Clarity] Initialized with project ID:', this.config.projectId);
  }

  /**
   * Ensure Clarity is available
   */
  private ensureClarity(): boolean {
    if (typeof window === 'undefined' || !window.clarity) {
      console.warn('[Clarity] Not available yet');
      return false;
    }
    return true;
  }

  /**
   * Set custom tag for current session
   * Useful for A/B test variants, user segments, etc.
   */
  setTag(key: string, value: string | number | boolean | string[]): void {
    if (!this.config.isEnabled) {
      console.log('[Clarity] Tag:', key, value);
      return;
    }

    if (!this.ensureClarity()) return;

    try {
      window.clarity!('set', key, value);
      console.log('[Clarity] Tag set:', key, value);
    } catch (error) {
      console.error('[Clarity] Error setting tag:', error);
    }
  }

  /**
   * Set multiple tags at once
   */
  setTags(tags: Record<string, string | number | boolean | string[]>): void {
    Object.entries(tags).forEach(([key, value]) => {
      this.setTag(key, value);
    });
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, options?: ClarityEventOptions): void {
    if (!this.config.isEnabled) {
      console.log('[Clarity] Event:', eventName, options);
      return;
    }

    if (!this.ensureClarity()) return;

    try {
      // Set tags if provided
      if (options?.tags) {
        this.setTags(options.tags);
      }

      // Track event
      window.clarity!('event', eventName);
      console.log('[Clarity] Event tracked:', eventName, options);
    } catch (error) {
      console.error('[Clarity] Error tracking event:', error);
    }
  }

  /**
   * Identify user (optional - use for logged-in users)
   */
  identify(userId: string, friendlyName?: string): void {
    if (!this.config.isEnabled) {
      console.log('[Clarity] Identify:', userId, friendlyName);
      return;
    }

    if (!this.ensureClarity()) return;

    try {
      window.clarity!('identify', userId, undefined, undefined, friendlyName);
      console.log('[Clarity] User identified:', userId);
    } catch (error) {
      console.error('[Clarity] Error identifying user:', error);
    }
  }

  /**
   * Upgrade session (mark as important for priority processing)
   */
  upgradeSession(reason: string): void {
    if (!this.config.isEnabled) {
      console.log('[Clarity] Upgrade session:', reason);
      return;
    }

    if (!this.ensureClarity()) return;

    try {
      window.clarity!('upgrade', reason);
      console.log('[Clarity] Session upgraded:', reason);
    } catch (error) {
      console.error('[Clarity] Error upgrading session:', error);
    }
  }

  /**
   * Consent (GDPR compliance)
   */
  consent(): void {
    if (!this.config.isEnabled) {
      console.log('[Clarity] Consent granted');
      return;
    }

    if (!this.ensureClarity()) return;

    try {
      window.clarity!('consent');
      console.log('[Clarity] Consent granted');
    } catch (error) {
      console.error('[Clarity] Error granting consent:', error);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ClarityConfig {
    return { ...this.config };
  }

  /**
   * Check if Clarity is enabled
   */
  isEnabled(): boolean {
    return this.config.isEnabled;
  }
}

// Singleton instance
export const clarity = new ClarityAnalytics();

// Convenience functions
export const setTag = (key: string, value: string | number | boolean | string[]) =>
  clarity.setTag(key, value);

export const setTags = (tags: Record<string, string | number | boolean | string[]>) =>
  clarity.setTags(tags);

export const trackEvent = (eventName: string, options?: ClarityEventOptions) =>
  clarity.trackEvent(eventName, options);

export const identify = (userId: string, friendlyName?: string) =>
  clarity.identify(userId, friendlyName);

export const upgradeSession = (reason: string) =>
  clarity.upgradeSession(reason);

export const consent = () =>
  clarity.consent();

export const isEnabled = () =>
  clarity.isEnabled();

export default clarity;
