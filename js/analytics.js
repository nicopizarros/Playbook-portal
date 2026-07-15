/**
 * Vercel Web Analytics - Initialization
 * 
 * This script initializes Vercel Web Analytics for the Playbook portal.
 * The inject() function from @vercel/analytics tracks page views and user interactions.
 */

// Import the inject function from @vercel/analytics
// For production builds using a bundler, this would be: import { inject } from '@vercel/analytics';
// For static sites, we'll use the script-based approach with the window.va queue

(function() {
  'use strict';

  // Initialize Vercel Analytics queue
  // This queue collects analytics calls before the main script loads
  window.va = window.va || function () { 
    (window.vaq = window.vaq || []).push(arguments); 
  };

  // Optional: Add beforeSend hook for filtering events
  // Uncomment and customize if you want to filter certain events
  /*
  window.va('beforeSend', function(event) {
    // Example: Don't track admin pages
    if (event.url.includes('/admin/')) {
      return null;
    }
    return event;
  });
  */

  // Track page view on initial load
  if (typeof window.va === 'function') {
    window.va('pageview', {
      path: window.location.pathname,
      title: document.title
    });
  }

  // Track page views on navigation (for SPA-like behavior)
  // This is useful if using client-side routing
  var originalPushState = history.pushState;
  var originalReplaceState = history.replaceState;

  function trackPageView() {
    if (typeof window.va === 'function') {
      window.va('pageview', {
        path: window.location.pathname,
        title: document.title
      });
    }
  }

  history.pushState = function() {
    originalPushState.apply(this, arguments);
    trackPageView();
  };

  history.replaceState = function() {
    originalReplaceState.apply(this, arguments);
    trackPageView();
  };

  window.addEventListener('popstate', trackPageView);

})();
