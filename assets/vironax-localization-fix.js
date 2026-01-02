/**
 * VironaX Localization Selector Fix
 * Version: 2.0
 *
 * This script provides robust click handling for language/currency selectors.
 * It uses 4 strategies to ensure the selectors work:
 *
 * Scenario 1: Native custom element integration (primary)
 * Scenario 2: Direct popover show/hide manipulation
 * Scenario 3: Fallback click event delegation
 * Scenario 4: Form submission handling
 */

(function() {
  'use strict';

  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLocalizationFix);
  } else {
    initLocalizationFix();
  }

  function initLocalizationFix() {
    console.log('[VironaX] Initializing localization fix...');

    // Strategy 1: Enhance existing toggle buttons
    enhanceToggleButtons();

    // Strategy 2: Add click delegation for popovers
    addClickDelegation();

    // Strategy 3: Handle form submissions
    handleFormSubmissions();

    // Strategy 4: Close on outside click
    handleOutsideClicks();

    // Re-initialize on dynamic content
    observeDOMChanges();

    console.log('[VironaX] Localization fix initialized');
  }

  /**
   * Strategy 1: Enhance existing toggle buttons
   * Adds explicit click handlers to localization toggle buttons
   */
  function enhanceToggleButtons() {
    const toggleButtons = document.querySelectorAll(
      '.vironax-localization-toggle, .localization-toggle, [aria-controls*="localization"], [aria-controls*="popover-localization"]'
    );

    toggleButtons.forEach(function(button) {
      // Skip if already enhanced
      if (button.hasAttribute('data-vironax-enhanced')) return;
      button.setAttribute('data-vironax-enhanced', 'true');

      button.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const popoverId = button.getAttribute('aria-controls');
        if (!popoverId) {
          console.warn('[VironaX] No aria-controls found on toggle button');
          return;
        }

        const popover = document.getElementById(popoverId);
        if (!popover) {
          console.warn('[VironaX] Popover not found:', popoverId);
          return;
        }

        togglePopover(popover, button);
      });

      // Also handle keyboard events
      button.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });
  }

  /**
   * Toggle popover visibility using multiple strategies
   */
  function togglePopover(popover, button) {
    const isOpen = popover.hasAttribute('open') ||
                   popover.classList.contains('is-open') ||
                   getComputedStyle(popover).display !== 'none';

    if (isOpen) {
      hidePopover(popover, button);
    } else {
      // Close all other popovers first
      closeAllPopovers();
      showPopover(popover, button);
    }
  }

  /**
   * Show a popover using multiple methods
   */
  function showPopover(popover, button) {
    // Method 1: Try native show method
    if (typeof popover.show === 'function') {
      try {
        popover.show();
        return;
      } catch (e) {
        console.log('[VironaX] Native show failed, using fallback');
      }
    }

    // Method 2: Set attributes and classes
    popover.setAttribute('open', '');
    popover.classList.add('is-open');
    popover.style.display = 'block';
    popover.style.visibility = 'visible';
    popover.style.opacity = '1';
    popover.style.pointerEvents = 'auto';

    // Update button state
    if (button) {
      button.setAttribute('aria-expanded', 'true');
    }

    // Position the popover below the button
    positionPopover(popover, button);

    // Dispatch custom event
    popover.dispatchEvent(new CustomEvent('dialog:after-show', { bubbles: true }));
  }

  /**
   * Hide a popover using multiple methods
   */
  function hidePopover(popover, button) {
    // Method 1: Try native hide method
    if (typeof popover.hide === 'function') {
      try {
        popover.hide();
        return;
      } catch (e) {
        console.log('[VironaX] Native hide failed, using fallback');
      }
    }

    // Method 2: Remove attributes and classes
    popover.removeAttribute('open');
    popover.classList.remove('is-open');
    popover.style.display = '';
    popover.style.visibility = '';
    popover.style.opacity = '';
    popover.style.pointerEvents = '';

    // Update button state
    if (button) {
      button.setAttribute('aria-expanded', 'false');
    }

    // Dispatch custom event
    popover.dispatchEvent(new CustomEvent('dialog:after-hide', { bubbles: true }));
  }

  /**
   * Position popover relative to its trigger button
   */
  function positionPopover(popover, button) {
    if (!button) return;

    const buttonRect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    // Position below and aligned to button
    popover.style.position = 'absolute';
    popover.style.top = '100%';
    popover.style.marginTop = '8px';

    // Check if popover would overflow right edge
    const popoverWidth = popover.offsetWidth || 280;
    if (buttonRect.left + popoverWidth > viewportWidth - 16) {
      popover.style.right = '0';
      popover.style.left = 'auto';
    } else {
      popover.style.left = '0';
      popover.style.right = 'auto';
    }
  }

  /**
   * Close all open popovers
   */
  function closeAllPopovers() {
    const popovers = document.querySelectorAll(
      '.vironax-popover[open], .vironax-popover.is-open, x-popover[open], x-popover.is-open'
    );

    popovers.forEach(function(popover) {
      const buttonId = popover.id;
      const button = document.querySelector('[aria-controls="' + buttonId + '"]');
      hidePopover(popover, button);
    });
  }

  /**
   * Strategy 2: Add click delegation for country/locale options
   */
  function addClickDelegation() {
    document.addEventListener('click', function(e) {
      const optionButton = e.target.closest(
        '.vironax-country-option, .vironax-locale-option, .popover__value-option[name="country_code"], .popover__value-option[name="locale_code"]'
      );

      if (optionButton && optionButton.type === 'submit') {
        // Let the form submission happen naturally
        return;
      }
    });
  }

  /**
   * Strategy 3: Handle form submissions for localization
   */
  function handleFormSubmissions() {
    document.addEventListener('submit', function(e) {
      const form = e.target;

      // Check if it's a localization form
      if (form.getAttribute('action') &&
          (form.getAttribute('action').includes('/localization') ||
           form.classList.contains('vironax-localization-form'))) {

        // Form is submitting, show loading state
        const submitButton = form.querySelector('button[type="submit"][aria-selected="true"]');
        if (submitButton) {
          submitButton.style.opacity = '0.5';
          submitButton.style.pointerEvents = 'none';
        }
      }
    });
  }

  /**
   * Strategy 4: Handle clicks outside popovers to close them
   */
  function handleOutsideClicks() {
    document.addEventListener('click', function(e) {
      // Don't close if clicking on toggle button or inside popover
      if (e.target.closest('.vironax-localization-toggle, .localization-toggle, .vironax-popover, x-popover')) {
        return;
      }

      closeAllPopovers();
    });

    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeAllPopovers();
      }
    });
  }

  /**
   * Observe DOM changes to re-initialize on dynamic content
   */
  function observeDOMChanges() {
    const observer = new MutationObserver(function(mutations) {
      let shouldReinit = false;

      mutations.forEach(function(mutation) {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1 &&
              (node.classList?.contains('localization-selectors') ||
               node.querySelector?.('.localization-selectors'))) {
            shouldReinit = true;
          }
        });
      });

      if (shouldReinit) {
        setTimeout(enhanceToggleButtons, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Expose functions globally for debugging
  window.VironaXLocalization = {
    closeAll: closeAllPopovers,
    reinit: enhanceToggleButtons
  };

})();
