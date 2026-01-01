/**
 * VironaX Sticky Elements Controller
 * Advanced scroll behaviors for header, announcement bar, promo bar, and trust badges
 *
 * Features:
 * - Hide on scroll down, show on scroll up header behavior
 * - Auto-show trust badges after scrolling X pixels
 * - Smooth transitions between states
 * - Proper z-index stacking
 * - Mobile touch scrolling support
 * - Performance-optimized with debounce/throttle
 */

(function() {
  'use strict';

  // Configuration - these values are overridden by section settings via data attributes
  const CONFIG = {
    headerHideThreshold: 100, // Scroll distance before hide behavior kicks in
    trustBadgesShowAt: 300, // Pixels scrolled before showing trust badges
    scrollDebounce: 10, // Debounce delay in ms
    animationDuration: 300, // Transition duration in ms
    zIndex: {
      announcementBar: 1003,
      promoBarTop: 1002,
      header: 1001,
      trustBadgesBottom: 1000,
      promoBarBottom: 999
    }
  };

  // State tracking
  let lastScrollY = 0;
  let ticking = false;
  let headerHidden = false;
  let trustBadgesVisible = false;

  // Element references
  let elements = {
    header: null,
    announcementBar: null,
    promoBar: null,
    trustBadges: null
  };

  // Throttle function for scroll performance
  function throttle(callback, limit) {
    let waiting = false;
    return function() {
      if (!waiting) {
        callback.apply(this, arguments);
        waiting = true;
        setTimeout(function() {
          waiting = false;
        }, limit);
      }
    };
  }

  // Debounce function
  function debounce(callback, delay) {
    let timeout;
    return function() {
      clearTimeout(timeout);
      timeout = setTimeout(() => callback.apply(this, arguments), delay);
    };
  }

  // Get scroll direction
  function getScrollDirection() {
    const currentScrollY = window.scrollY;
    const direction = currentScrollY > lastScrollY ? 'down' : 'up';
    lastScrollY = currentScrollY;
    return direction;
  }

  // Initialize element references
  function initElements() {
    elements.header = document.querySelector('.shopify-section--header, header, .header');
    elements.announcementBar = document.querySelector('.shopify-section--announcement-bar, .announcement-bar');
    elements.promoBar = document.querySelector('.vironax-promo-bar');
    elements.trustBadges = document.querySelector('.vironax-trust-badges');

    // Also look for the section wrappers
    if (!elements.header) {
      elements.header = document.querySelector('[class*="header"]');
    }
  }

  // Header scroll behavior: hide on scroll down, show on scroll up
  function handleHeaderScroll() {
    const header = elements.header;
    if (!header) return;

    // Check if this behavior is enabled via data attribute
    const stickyBehavior = header.dataset.stickyBehavior || 'always';
    if (stickyBehavior === 'always' || stickyBehavior === 'none') return;

    const currentScrollY = window.scrollY;
    const direction = getScrollDirection();

    // Only activate after scrolling past threshold
    if (currentScrollY < CONFIG.headerHideThreshold) {
      if (headerHidden) {
        showHeader();
      }
      return;
    }

    if (stickyBehavior === 'hide-on-scroll-down') {
      if (direction === 'down' && !headerHidden) {
        hideHeader();
      } else if (direction === 'up' && headerHidden) {
        showHeader();
      }
    }
  }

  // Hide header
  function hideHeader() {
    const header = elements.header;
    if (!header) return;

    header.classList.add('header--hidden');
    header.style.transform = 'translateY(-100%)';
    headerHidden = true;
  }

  // Show header
  function showHeader() {
    const header = elements.header;
    if (!header) return;

    header.classList.remove('header--hidden');
    header.style.transform = 'translateY(0)';
    headerHidden = false;
  }

  // Trust badges auto-show on scroll
  function handleTrustBadgesScroll() {
    const badges = elements.trustBadges;
    if (!badges) return;

    // Check if sticky is enabled
    const isSticky = badges.dataset.sticky === 'true';
    if (!isSticky) return;

    const showAfter = parseInt(badges.dataset.showAfter) || CONFIG.trustBadgesShowAt;
    const currentScrollY = window.scrollY;

    if (currentScrollY > showAfter && !trustBadgesVisible) {
      showTrustBadges();
    } else if (currentScrollY <= showAfter && trustBadgesVisible) {
      hideTrustBadges();
    }
  }

  // Show trust badges with animation
  function showTrustBadges() {
    const badges = elements.trustBadges;
    if (!badges) return;

    const animation = badges.dataset.animation || 'slide';

    badges.classList.add('vironax-trust-badges--visible');

    if (animation === 'slide') {
      badges.style.transform = 'translateY(0)';
    } else if (animation === 'fade') {
      badges.style.opacity = '1';
    }

    trustBadgesVisible = true;
  }

  // Hide trust badges
  function hideTrustBadges() {
    const badges = elements.trustBadges;
    if (!badges) return;

    const animation = badges.dataset.animation || 'slide';
    const position = badges.dataset.position || 'bottom';

    badges.classList.remove('vironax-trust-badges--visible');

    if (animation === 'slide') {
      if (position === 'bottom') {
        badges.style.transform = 'translateY(100%)';
      } else {
        badges.style.transform = 'translateY(-100%)';
      }
    } else if (animation === 'fade') {
      badges.style.opacity = '0';
    }

    trustBadgesVisible = false;
  }

  // Calculate proper offsets when multiple elements are sticky
  function calculateStickyOffsets() {
    let topOffset = 0;

    // Announcement bar
    if (elements.announcementBar) {
      const isSticky = elements.announcementBar.dataset.sticky === 'true' ||
                        window.getComputedStyle(elements.announcementBar).position === 'sticky';
      if (isSticky) {
        const height = elements.announcementBar.offsetHeight;
        document.documentElement.style.setProperty('--announcement-bar-offset', height + 'px');
        topOffset += height;
      }
    }

    // Promo bar (if at top)
    if (elements.promoBar) {
      const position = elements.promoBar.dataset.position || 'top';
      const isSticky = elements.promoBar.dataset.sticky === 'true';
      if (isSticky && position === 'top') {
        const height = elements.promoBar.offsetHeight;
        document.documentElement.style.setProperty('--promo-bar-offset', height + 'px');
        topOffset += height;
      }
    }

    // Header
    if (elements.header) {
      const isSticky = window.getComputedStyle(elements.header).position === 'sticky' ||
                        elements.header.dataset.sticky === 'true';
      if (isSticky) {
        elements.header.style.top = topOffset + 'px';
        const height = elements.header.offsetHeight;
        document.documentElement.style.setProperty('--header-offset', (topOffset + height) + 'px');
      }
    }
  }

  // Main scroll handler
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        handleHeaderScroll();
        handleTrustBadgesScroll();
        ticking = false;
      });
      ticking = true;
    }
  }

  // Handle resize
  function onResize() {
    calculateStickyOffsets();
  }

  // Initialize sticky behaviors
  function init() {
    initElements();
    calculateStickyOffsets();

    // Add base styles for transitions
    injectStyles();

    // Set up scroll listener with throttle
    window.addEventListener('scroll', throttle(onScroll, CONFIG.scrollDebounce), { passive: true });

    // Set up resize listener with debounce
    window.addEventListener('resize', debounce(onResize, 150));

    // Touch events for mobile
    let touchStartY = 0;
    document.addEventListener('touchstart', function(e) {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', throttle(function(e) {
      const touchY = e.touches[0].clientY;
      const diff = touchStartY - touchY;

      // Simulate scroll direction for mobile
      if (Math.abs(diff) > 5) {
        lastScrollY = window.scrollY + diff;
      }
    }, 50), { passive: true });

    console.log('[VironaX Sticky] Initialized');
  }

  // Inject CSS for transitions
  function injectStyles() {
    const style = document.createElement('style');
    style.id = 'vironax-sticky-styles';
    style.textContent = `
      /* Header hide/show transition */
      .shopify-section--header,
      header,
      .header {
        transition: transform ${CONFIG.animationDuration}ms ease-in-out;
      }

      .header--hidden {
        transform: translateY(-100%) !important;
      }

      /* Trust badges sticky styles */
      .vironax-trust-badges[data-sticky="true"] {
        position: fixed;
        left: 0;
        right: 0;
        z-index: ${CONFIG.zIndex.trustBadgesBottom};
        transition: transform ${CONFIG.animationDuration}ms ease-in-out,
                    opacity ${CONFIG.animationDuration}ms ease-in-out;
      }

      .vironax-trust-badges[data-sticky="true"][data-position="bottom"] {
        bottom: 0;
        transform: translateY(100%);
      }

      .vironax-trust-badges[data-sticky="true"][data-position="top"] {
        top: var(--header-offset, 60px);
        transform: translateY(-100%);
      }

      .vironax-trust-badges[data-sticky="true"][data-animation="fade"] {
        opacity: 0;
        transform: translateY(0);
      }

      .vironax-trust-badges--visible {
        transform: translateY(0) !important;
        opacity: 1 !important;
      }

      /* Promo bar sticky styles */
      .vironax-promo-bar[data-sticky="true"] {
        position: fixed;
        left: 0;
        right: 0;
        z-index: ${CONFIG.zIndex.promoBarTop};
      }

      .vironax-promo-bar[data-sticky="true"][data-position="top"] {
        top: var(--announcement-bar-offset, 0);
      }

      .vironax-promo-bar[data-sticky="true"][data-position="bottom"] {
        bottom: 0;
        z-index: ${CONFIG.zIndex.promoBarBottom};
      }

      /* Announcement bar sticky styles */
      .shopify-section--announcement-bar[data-sticky="true"],
      .announcement-bar[data-sticky="true"] {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: ${CONFIG.zIndex.announcementBar};
      }

      /* Blur effect for sticky elements */
      [data-blur="true"] {
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
      }

      /* Compact mode for trust badges */
      .vironax-trust-badges--compact {
        padding: var(--spacing-xs) 0 !important;
      }

      .vironax-trust-badges--compact .vironax-trust-badges__item svg {
        width: 16px !important;
        height: 16px !important;
      }

      .vironax-trust-badges--compact .vironax-trust-badges__item span {
        font-size: var(--text-xs) !important;
      }

      /* Body padding for fixed elements */
      body.has-fixed-header {
        padding-top: var(--header-offset, 0);
      }

      body.has-fixed-trust-badges-bottom {
        padding-bottom: var(--trust-badges-height, 0);
      }
    `;
    document.head.appendChild(style);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API
  window.VironaXSticky = {
    hideHeader: hideHeader,
    showHeader: showHeader,
    showTrustBadges: showTrustBadges,
    hideTrustBadges: hideTrustBadges,
    recalculateOffsets: calculateStickyOffsets,
    getConfig: function() { return CONFIG; }
  };

})();
