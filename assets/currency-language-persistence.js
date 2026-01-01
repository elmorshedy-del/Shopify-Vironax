/**
 * VironaX Currency & Language Persistence System
 * Ensures selected currency and language persist across ALL pages
 *
 * Features:
 * - localStorage persistence
 * - sessionStorage backup
 * - URL parameter handling
 * - Browser back/forward button support
 * - Page refresh survival
 * - Checkout integration attempt
 */

(function() {
  'use strict';

  // Configuration
  const CONFIG = {
    storageKeys: {
      country: 'vironax_selected_country',
      locale: 'vironax_selected_locale',
      currency: 'vironax_selected_currency'
    },
    debugMode: false, // Set to true for console logging
    cookieExpiry: 365, // days
    selectors: {
      countrySelector: '[name="country_code"]',
      localeSelector: '[name="locale_code"]',
      localizationForm: 'form[action*="/localization"]',
      countryButton: '.localization-toggle',
      countryPopover: '[id*="popover-localization"]'
    }
  };

  // Logging utility
  function log(...args) {
    if (CONFIG.debugMode) {
      console.log('[VironaX Localization]:', ...args);
    }
  }

  // Storage utilities
  const Storage = {
    set: function(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        sessionStorage.setItem(key, JSON.stringify(value));
        this.setCookie(key, value, CONFIG.cookieExpiry);
        log('Stored:', key, value);
      } catch (e) {
        log('Storage error:', e);
      }
    },

    get: function(key) {
      try {
        // Try localStorage first
        let value = localStorage.getItem(key);
        if (value) return JSON.parse(value);

        // Fall back to sessionStorage
        value = sessionStorage.getItem(key);
        if (value) return JSON.parse(value);

        // Fall back to cookie
        return this.getCookie(key);
      } catch (e) {
        log('Storage retrieval error:', e);
        return null;
      }
    },

    setCookie: function(name, value, days) {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) +
                       '; expires=' + expires + '; path=/; SameSite=Lax';
    },

    getCookie: function(name) {
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [cookieName, cookieValue] = cookie.trim().split('=');
        if (cookieName === name) {
          try {
            return JSON.parse(decodeURIComponent(cookieValue));
          } catch (e) {
            return null;
          }
        }
      }
      return null;
    }
  };

  // Currency/Country data with flags
  const CountryData = {
    'AE': { name: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ', flag: '🇦🇪', order: 1 },
    'SA': { name: 'Saudi Arabia', currency: 'SAR', symbol: 'ر.س', flag: '🇸🇦', order: 2 },
    'QA': { name: 'Qatar', currency: 'QAR', symbol: 'ر.ق', flag: '🇶🇦', order: 3 },
    'BH': { name: 'Bahrain', currency: 'USD', symbol: '$', flag: '🇧🇭', order: 4 },
    'JO': { name: 'Jordan', currency: 'USD', symbol: '$', flag: '🇯🇴', order: 5 },
    'KW': { name: 'Kuwait', currency: 'USD', symbol: '$', flag: '🇰🇼', order: 6 },
    'OM': { name: 'Oman', currency: 'USD', symbol: '$', flag: '🇴🇲', order: 7 },
    'TR': { name: 'Türkiye', currency: 'TRY', symbol: '₺', flag: '🇹🇷', order: 8 },
    'US': { name: 'United States', currency: 'USD', symbol: '$', flag: '🇺🇸', order: 9 },
    'GB': { name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧', order: 10 }
  };

  // Get current selections from page
  function getCurrentSelections() {
    const countryForm = document.querySelector(CONFIG.selectors.localizationForm);
    let currentCountry = null;
    let currentLocale = null;

    // Try to get from URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('country')) {
      currentCountry = urlParams.get('country');
    }
    if (urlParams.has('locale')) {
      currentLocale = urlParams.get('locale');
    }

    // Try to get from the page's active selection
    const selectedCountryBtn = document.querySelector('.localization-toggle [aria-selected="true"]');
    if (selectedCountryBtn) {
      const countryCode = selectedCountryBtn.getAttribute('value');
      if (countryCode) currentCountry = countryCode;
    }

    // Get from Shopify's localization object if available
    if (window.Shopify && window.Shopify.country) {
      if (!currentCountry) currentCountry = window.Shopify.country;
    }
    if (window.Shopify && window.Shopify.locale) {
      if (!currentLocale) currentLocale = window.Shopify.locale;
    }

    return { country: currentCountry, locale: currentLocale };
  }

  // Save current selections
  function saveSelections(country, locale) {
    if (country) {
      Storage.set(CONFIG.storageKeys.country, country);
      const countryInfo = CountryData[country];
      if (countryInfo) {
        Storage.set(CONFIG.storageKeys.currency, countryInfo.currency);
      }
    }
    if (locale) {
      Storage.set(CONFIG.storageKeys.locale, locale);
    }
    log('Selections saved:', { country, locale });
  }

  // Restore saved selections
  function restoreSelections() {
    const savedCountry = Storage.get(CONFIG.storageKeys.country);
    const savedLocale = Storage.get(CONFIG.storageKeys.locale);
    const current = getCurrentSelections();

    log('Saved selections:', { savedCountry, savedLocale });
    log('Current selections:', current);

    // Only restore if different from current
    if (savedCountry && savedCountry !== current.country) {
      applyCountrySelection(savedCountry);
    }
    if (savedLocale && savedLocale !== current.locale) {
      applyLocaleSelection(savedLocale);
    }
  }

  // Apply country selection
  function applyCountrySelection(countryCode) {
    const countryBtn = document.querySelector(`${CONFIG.selectors.countrySelector}[value="${countryCode}"]`);
    if (countryBtn) {
      log('Applying country selection:', countryCode);
      // Don't auto-submit to avoid page reload loops
      // Just update the visual state
      const allBtns = document.querySelectorAll(CONFIG.selectors.countrySelector);
      allBtns.forEach(btn => btn.setAttribute('aria-selected', 'false'));
      countryBtn.setAttribute('aria-selected', 'true');
    }
  }

  // Apply locale selection
  function applyLocaleSelection(localeCode) {
    const localeBtn = document.querySelector(`${CONFIG.selectors.localeSelector}[value="${localeCode}"]`);
    if (localeBtn) {
      log('Applying locale selection:', localeCode);
      // Don't auto-submit to avoid page reload loops
      const allBtns = document.querySelectorAll(CONFIG.selectors.localeSelector);
      allBtns.forEach(btn => btn.setAttribute('aria-selected', 'false'));
      localeBtn.setAttribute('aria-selected', 'true');
    }
  }

  // Listen for selection changes
  function setupEventListeners() {
    // Listen for country selection changes
    document.addEventListener('click', function(e) {
      const countryBtn = e.target.closest(CONFIG.selectors.countrySelector);
      if (countryBtn) {
        const countryCode = countryBtn.value;
        log('Country selected:', countryCode);
        saveSelections(countryCode, null);
      }

      const localeBtn = e.target.closest(CONFIG.selectors.localeSelector);
      if (localeBtn) {
        const localeCode = localeBtn.value;
        log('Locale selected:', localeCode);
        saveSelections(null, localeCode);
      }
    });

    // Listen for form submissions
    document.addEventListener('submit', function(e) {
      const form = e.target.closest(CONFIG.selectors.localizationForm);
      if (form) {
        const countryInput = form.querySelector(CONFIG.selectors.countrySelector + ':checked, ' +
                                                  CONFIG.selectors.countrySelector + '[aria-selected="true"]');
        const localeInput = form.querySelector(CONFIG.selectors.localeSelector + ':checked, ' +
                                                 CONFIG.selectors.localeSelector + '[aria-selected="true"]');

        if (countryInput) {
          saveSelections(countryInput.value, null);
        }
        if (localeInput) {
          saveSelections(null, localeInput.value);
        }
        log('Form submitted with selections');
      }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', function() {
      log('Navigation detected, checking selections...');
      setTimeout(function() {
        const current = getCurrentSelections();
        saveSelections(current.country, current.locale);
      }, 100);
    });

    // Handle page visibility change (tab switching)
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden) {
        log('Page visible, verifying selections...');
        const current = getCurrentSelections();
        const saved = {
          country: Storage.get(CONFIG.storageKeys.country),
          locale: Storage.get(CONFIG.storageKeys.locale)
        };

        // Update storage if page selection is different
        if (current.country && current.country !== saved.country) {
          saveSelections(current.country, null);
        }
        if (current.locale && current.locale !== saved.locale) {
          saveSelections(null, current.locale);
        }
      }
    });
  }

  // Update dropdown display order
  function reorderCountryDropdown() {
    const dropdowns = document.querySelectorAll('.popover__value-list');

    dropdowns.forEach(dropdown => {
      const buttons = Array.from(dropdown.querySelectorAll('[name="country_code"]'));
      if (buttons.length === 0) return;

      // Sort buttons by our custom order
      buttons.sort((a, b) => {
        const codeA = a.value;
        const codeB = b.value;
        const orderA = CountryData[codeA] ? CountryData[codeA].order : 999;
        const orderB = CountryData[codeB] ? CountryData[codeB].order : 999;
        return orderA - orderB;
      });

      // Reinsert in correct order
      buttons.forEach(btn => dropdown.appendChild(btn));
      log('Country dropdown reordered');
    });
  }

  // Add flags to country options if not present
  function enhanceCountryDisplay() {
    const countryButtons = document.querySelectorAll('[name="country_code"]');

    countryButtons.forEach(btn => {
      const code = btn.value;
      const countryInfo = CountryData[code];

      if (countryInfo) {
        // Find the text span inside the button
        const textSpan = btn.querySelector('span:not(.country-flag)');
        if (textSpan) {
          // Check if flag is already added
          const hasFlag = btn.querySelector('.country-flag-emoji');
          if (!hasFlag && !btn.querySelector('.country-flag')) {
            // Add flag emoji before the text
            const flagSpan = document.createElement('span');
            flagSpan.className = 'country-flag-emoji';
            flagSpan.textContent = countryInfo.flag + ' ';
            flagSpan.style.marginRight = '6px';
            textSpan.insertBefore(flagSpan, textSpan.firstChild);
          }
        }
      }
    });
    log('Country flags enhanced');
  }

  // Handle checkout page
  function setupCheckoutPersistence() {
    // Check if we're on checkout
    if (window.location.pathname.includes('/checkout')) {
      const savedLocale = Storage.get(CONFIG.storageKeys.locale);
      const savedCountry = Storage.get(CONFIG.storageKeys.country);

      log('On checkout page, saved locale:', savedLocale, 'country:', savedCountry);

      // Try to set checkout language via URL if possible
      if (savedLocale) {
        const currentUrl = new URL(window.location.href);
        const urlLocale = currentUrl.searchParams.get('locale');

        if (!urlLocale && savedLocale) {
          // Add locale to URL (this might not work on all Shopify plans)
          currentUrl.searchParams.set('locale', savedLocale);
          // Don't redirect automatically as it might cause loops
          log('Checkout locale should be:', savedLocale);
        }
      }
    }
  }

  // Inject checkout styles for language consistency
  function injectCheckoutStyles() {
    if (window.location.pathname.includes('/checkout')) {
      const savedLocale = Storage.get(CONFIG.storageKeys.locale);

      if (savedLocale === 'ar') {
        // Add RTL styles for Arabic checkout
        const style = document.createElement('style');
        style.textContent = `
          /* Arabic checkout adjustments */
          [lang="ar"] body,
          [dir="rtl"] body {
            direction: rtl;
            text-align: right;
          }
        `;
        document.head.appendChild(style);
        log('Arabic checkout styles injected');
      }
    }
  }

  // Initialize on DOM ready
  function init() {
    log('Initializing VironaX Localization Persistence...');

    // Get and save current selections from page
    const current = getCurrentSelections();
    if (current.country || current.locale) {
      saveSelections(current.country, current.locale);
    }

    // Set up event listeners
    setupEventListeners();

    // Enhance displays after a short delay for DOM to be ready
    setTimeout(function() {
      reorderCountryDropdown();
      enhanceCountryDisplay();
    }, 500);

    // Handle checkout
    setupCheckoutPersistence();
    injectCheckoutStyles();

    // Also handle dynamic content loading
    const observer = new MutationObserver(function(mutations) {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
          const hasCountryButtons = document.querySelectorAll('[name="country_code"]').length > 0;
          if (hasCountryButtons) {
            setTimeout(function() {
              reorderCountryDropdown();
              enhanceCountryDisplay();
            }, 100);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    log('VironaX Localization Persistence initialized');
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose API for external use
  window.VironaXLocalization = {
    getSelectedCountry: function() {
      return Storage.get(CONFIG.storageKeys.country);
    },
    getSelectedLocale: function() {
      return Storage.get(CONFIG.storageKeys.locale);
    },
    getSelectedCurrency: function() {
      return Storage.get(CONFIG.storageKeys.currency);
    },
    setCountry: function(code) {
      saveSelections(code, null);
    },
    setLocale: function(code) {
      saveSelections(null, code);
    },
    getCountryData: function() {
      return CountryData;
    },
    enableDebug: function() {
      CONFIG.debugMode = true;
      console.log('VironaX Localization debug mode enabled');
    }
  };

})();
