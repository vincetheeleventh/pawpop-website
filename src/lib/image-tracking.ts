// src/lib/image-tracking.ts

/**
 * Comprehensive image interaction tracking for Plausible Analytics
 * Tracks right-clicks, drags, keyboard shortcuts, and other save behaviors
 */

interface ImageTrackingProps {
  imageType: string;
  artworkId?: string;
  orderId?: string;
  customerName?: string;
  petName?: string;
  productType?: string;
  customerEmail?: string;
}

interface ImageTrackingOptions {
  trackRightClick?: boolean;
  trackDragStart?: boolean;
  trackKeyboardShortcuts?: boolean;
  trackLongPress?: boolean; // Mobile
  trackImageLoad?: boolean;
}

export class ImageTracker {
  private props: ImageTrackingProps;
  private options: ImageTrackingOptions;
  private element: HTMLImageElement | null = null;
  private longPressTimer: NodeJS.Timeout | null = null;
  private keyboardListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(props: ImageTrackingProps, options: ImageTrackingOptions = {}) {
    this.props = props;
    this.options = {
      trackRightClick: true,
      trackDragStart: true,
      trackKeyboardShortcuts: true,
      trackLongPress: true,
      trackImageLoad: true,
      ...options
    };
  }

  /**
   * Track event to Plausible with consistent props
   */
  private trackEvent(eventName: string, additionalProps: Record<string, any> = {}) {
    if (typeof window !== 'undefined' && window.plausible) {
      const eventProps: Record<string, string | number | boolean> = {
        image_type: this.props.imageType,
        timestamp: Date.now(),
        user_agent: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'
      };

      // Add optional props only if defined
      if (this.props.artworkId) eventProps.artwork_id = this.props.artworkId;
      if (this.props.orderId) eventProps.order_id = this.props.orderId;
      if (this.props.customerName) eventProps.customer_name = this.props.customerName;
      if (this.props.petName) eventProps.pet_name = this.props.petName;
      if (this.props.productType) eventProps.product_type = this.props.productType;
      if (this.props.customerEmail) eventProps.customer_email = this.props.customerEmail;

      // Add additional props, filtering out undefined values
      Object.entries(additionalProps).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          eventProps[key] = value;
        }
      });

      window.plausible(eventName, { props: eventProps });
      console.log(`[ImageTracker] ${eventName}:`, eventProps);
    }
  }

  /**
   * Handle right-click context menu
   */
  private handleContextMenu = (e: MouseEvent) => {
    this.trackEvent('Image Right Click', {
      action_type: 'context_menu',
      mouse_button: 'right',
      page_url: window.location.href
    });
    // Don't prevent default - allow right-click menu
  };

  /**
   * Handle drag start (drag to save)
   */
  private handleDragStart = (e: DragEvent) => {
    this.trackEvent('Image Drag Start', {
      action_type: 'drag_save',
      drag_effect: e.dataTransfer?.effectAllowed || 'unknown',
      page_url: window.location.href
    });
  };

  /**
   * Handle image load
   */
  private handleImageLoad = (e: Event) => {
    const img = e.target as HTMLImageElement;
    this.trackEvent('Artwork Image Loaded', {
      action_type: 'image_loaded',
      image_width: img.naturalWidth,
      image_height: img.naturalHeight,
      image_size: `${img.naturalWidth}x${img.naturalHeight}`,
      page_url: window.location.href
    });
  };

  /**
   * Handle keyboard shortcuts (Ctrl+S, Ctrl+Shift+S, etc.)
   */
  private handleKeyboardShortcut = (e: KeyboardEvent) => {
    // Only track if image is focused or if we're on the artwork page
    const isArtworkPage = window.location.pathname.includes('/artwork/');
    const isSuccessPage = window.location.pathname.includes('/success');
    
    if (!isArtworkPage && !isSuccessPage) return;

    // Common save shortcuts
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      this.trackEvent('Keyboard Save Attempt', {
        action_type: 'keyboard_shortcut',
        shortcut: e.shiftKey ? 'ctrl_shift_s' : 'ctrl_s',
        prevented: e.defaultPrevented,
        page_url: window.location.href
      });
    }

    // Print shortcuts (sometimes used to save as PDF)
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      this.trackEvent('Print Attempt', {
        action_type: 'keyboard_shortcut',
        shortcut: 'ctrl_p',
        page_url: window.location.href
      });
    }
  };

  /**
   * Handle mobile long press (touch and hold)
   */
  private handleTouchStart = (e: TouchEvent) => {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }

    this.longPressTimer = setTimeout(() => {
      this.trackEvent('Image Long Press', {
        action_type: 'long_press',
        device_type: 'mobile',
        touch_count: e.touches.length,
        page_url: window.location.href
      });
    }, 500); // 500ms for long press
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    // Cancel long press if user moves finger
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  };

  /**
   * Attach tracking to an image element
   */
  public attachToImage(imageElement: HTMLImageElement): void {
    this.element = imageElement;

    // Right-click tracking
    if (this.options.trackRightClick) {
      imageElement.addEventListener('contextmenu', this.handleContextMenu);
    }

    // Drag tracking
    if (this.options.trackDragStart) {
      imageElement.addEventListener('dragstart', this.handleDragStart);
    }

    // Image load tracking
    if (this.options.trackImageLoad) {
      if (imageElement.complete) {
        // Image already loaded
        this.handleImageLoad({ target: imageElement } as unknown as Event);
      } else {
        imageElement.addEventListener('load', this.handleImageLoad);
      }
    }

    // Mobile long press tracking
    if (this.options.trackLongPress) {
      imageElement.addEventListener('touchstart', this.handleTouchStart, { passive: true });
      imageElement.addEventListener('touchend', this.handleTouchEnd, { passive: true });
      imageElement.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    }

    // Keyboard shortcut tracking (global)
    if (this.options.trackKeyboardShortcuts && !this.keyboardListener) {
      this.keyboardListener = this.handleKeyboardShortcut;
      document.addEventListener('keydown', this.keyboardListener);
    }
  }

  /**
   * Remove all event listeners
   */
  public detach(): void {
    if (!this.element) return;

    this.element.removeEventListener('contextmenu', this.handleContextMenu);
    this.element.removeEventListener('dragstart', this.handleDragStart);
    this.element.removeEventListener('load', this.handleImageLoad);
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchmove', this.handleTouchMove);

    if (this.keyboardListener) {
      document.removeEventListener('keydown', this.keyboardListener);
      this.keyboardListener = null;
    }

    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    this.element = null;
  }

  /**
   * Track manual download link click
   */
  public trackDownloadClick(downloadUrl: string, fileName?: string): void {
    this.trackEvent('Download Link Clicked', {
      action_type: 'download_link',
      download_url: downloadUrl,
      file_name: fileName || 'unknown',
      page_url: window.location.href
    });
  }

  /**
   * Track image sharing
   */
  public trackImageShare(shareMethod: string, shareUrl?: string): void {
    this.trackEvent('Image Shared', {
      action_type: 'share',
      share_method: shareMethod,
      share_url: shareUrl || window.location.href,
      page_url: window.location.href
    });
  }
}

/**
 * React hook for image tracking
 */
export function useImageTracking(props: ImageTrackingProps, options?: ImageTrackingOptions) {
  const tracker = new ImageTracker(props, options);

  const attachToRef = (element: HTMLImageElement | null) => {
    if (element) {
      tracker.attachToImage(element);
    }
  };

  const detach = () => {
    tracker.detach();
  };

  return {
    attachToRef,
    detach,
    trackDownloadClick: tracker.trackDownloadClick.bind(tracker),
    trackImageShare: tracker.trackImageShare.bind(tracker)
  };
}

/**
 * Simple function to add basic tracking to any image
 */
export function addImageTracking(
  imageElement: HTMLImageElement, 
  props: ImageTrackingProps, 
  options?: ImageTrackingOptions
): () => void {
  const tracker = new ImageTracker(props, options);
  tracker.attachToImage(imageElement);
  
  // Return cleanup function
  return () => tracker.detach();
}

export default ImageTracker;
