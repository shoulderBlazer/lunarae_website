// Cookie Consent Manager with Google Consent Mode v2
// Consent expires after 6 months - users are treated as first-time visitors after expiry
(function() {
    'use strict';

    const GA4_MEASUREMENT_ID = 'G-Z8S01MQ0YJ';
    const CONSENT_STORAGE_KEY = 'lunarae_cookie_consent';
    const CONSENT_EXPIRY_MONTHS = 6; // Consent expires after 6 months
    
    // Consent state
    let consentState = {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
    };
    
    // Track if GA4 has been loaded
    let ga4Loaded = false;
    
    // Track pending events before consent
    let pendingEvents = [];
    
    // Initialize dataLayer for Google Consent Mode
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function() {
        window.dataLayer.push(arguments);
    };
    initializeConsentMode();
    
    /**
     * Update Google Consent Mode
     * @param {Object} consent - Consent state object
     */
    function updateConsentMode(consent) {
        // Only analytics may be granted, including when restoring older records.
        consentState = {
            analytics_storage: consent.analytics_storage === 'granted' ? 'granted' : 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied'
        };

        window.gtag('consent', 'update', { ...consentState });
        
        window.dataLayer.push({
            event: 'consent_update',
            ...consentState
        });
        
        // Also remove cookies left behind by a previously stored rejection.
        if (consentState.analytics_storage === 'denied') {
            clearGACookies();
        }
    }
    
    /**
     * Load GA4 script
     */
    function loadGA4() {
        if (ga4Loaded || consentState.analytics_storage !== 'granted') return;
        
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
        document.head.appendChild(script);
        
        gtag('js', new Date());
        gtag('config', GA4_MEASUREMENT_ID, {
            anonymize_ip: true,
            send_page_view: true
        });
        
        ga4Loaded = true;
        
        // Process any pending events
        processPendingEvents();
    }
    
    /**
     * Process pending analytics events
     */
    function processPendingEvents() {
        if (!ga4Loaded || pendingEvents.length === 0) return;
        
        pendingEvents.forEach(event => {
            if (typeof gtag === 'function') {
                gtag('event', event.name, event.parameters);
            }
        });
        
        pendingEvents = [];
    }
    
    /**
     * Queue an event to be sent after consent
     */
    function queueEvent(eventName, parameters) {
        if (consentState.analytics_storage === 'granted' && ga4Loaded) {
            if (typeof gtag === 'function') {
                gtag('event', eventName, parameters);
            }
        } else {
            pendingEvents.push({ name: eventName, parameters });
        }
    }
    
    /**
     * Initialize Google Consent Mode with default denied consent
     */
    function initializeConsentMode() {
        window.gtag('consent', 'default', { ...consentState });
    }
    
    /**
     * Save consent to localStorage with timestamp
     * @param {Object} consent - Consent state
     */
    function saveConsent(consent) {
        const consentWithTimestamp = {
            ...consent,
            timestamp: Date.now()
        };
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentWithTimestamp));
    }
    
    /**
     * Clear Google Analytics cookies
     * Removes _ga and _ga_* cookies for privacy when consent is withdrawn or expires
     */
    function clearGACookies() {
        // Cover host-only cookies, the current host, and GA's production parent domain.
        const hostname = window.location.hostname;
        const domains = new Set(['', hostname, `.${hostname}`]);
        if (hostname === 'lunarae.app' || hostname.endsWith('.lunarae.app')) {
            domains.add('lunarae.app');
            domains.add('.lunarae.app');
        }

        // Match root and current-path scopes, including ancestor directories.
        const paths = new Set(['/']);
        const segments = window.location.pathname.split('/').filter(Boolean);
        let currentPath = '';
        segments.forEach(segment => {
            currentPath += `/${segment}`;
            paths.add(currentPath);
            paths.add(`${currentPath}/`);
        });

        // Snapshot names before deleting: duplicate names can exist in several scopes.
        const cookieNames = new Set(['_ga', `_ga_${GA4_MEASUREMENT_ID.slice(2)}`]);
        document.cookie.split(';').forEach(cookie => {
            const name = cookie.split('=')[0].trim();
            if (name.startsWith('_ga_')) cookieNames.add(name);
        });
        cookieNames.forEach(name => {
            domains.forEach(domain => {
                paths.forEach(cookiePath => {
                    const domainAttribute = domain ? `; domain=${domain}` : '';
                    document.cookie = `${name}=; Max-Age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${cookiePath}${domainAttribute}`;
                });
            });
        });
    }
    
    /**
     * Check if consent has expired (older than 6 months)
     * @param {Object} consentData - Consent data with timestamp
     * @returns {boolean} True if consent has expired
     */
    function isConsentExpired(consentData) {
        if (!consentData.timestamp) return true;
        
        const consentDate = new Date(consentData.timestamp);
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() - CONSENT_EXPIRY_MONTHS);
        
        return consentDate < expiryDate;
    }
    
    /**
     * Load consent from localStorage and check expiry
     * @returns {Object|null} Consent state or null if not found/expired
     */
    function loadConsent() {
        const saved = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (saved) {
            try {
                const consentData = JSON.parse(saved);
                
                // Check if consent has expired
                if (isConsentExpired(consentData)) {
                    // Clear expired consent
                    localStorage.removeItem(CONSENT_STORAGE_KEY);
                    // Clear GA cookies for privacy
                    clearGACookies();
                    return null;
                }
                
                // Return consent without timestamp
                const { timestamp, ...consent } = consentData;
                return consent;
            } catch (e) {
                console.error('Error parsing saved consent:', e);
                return null;
            }
        }
        return null;
    }
    
    /**
     * Handle accept consent
     */
    function handleAccept() {
        const newConsent = {
            analytics_storage: 'granted',
            ad_storage: 'denied'
        };
        
        updateConsentMode(newConsent);
        saveConsent(consentState);
        loadGA4();
        hideBanner();
    }
    
    /**
     * Handle reject consent
     */
    function handleReject() {
        const newConsent = {
            analytics_storage: 'denied',
            ad_storage: 'denied'
        };
        
        updateConsentMode(newConsent);
        saveConsent(consentState);
        hideBanner();
    }
    
    /**
     * Show cookie consent banner
     */
    function showBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        const overlay = document.getElementById('cookie-consent-overlay');
        
        if (banner) {
            banner.classList.add('show');
        }
        if (overlay) {
            overlay.classList.add('show');
        }
    }
    
    /**
     * Hide cookie consent banner
     */
    function hideBanner() {
        const banner = document.getElementById('cookie-consent-banner');
        const overlay = document.getElementById('cookie-consent-overlay');
        
        if (banner) {
            banner.classList.remove('show');
        }
        if (overlay) {
            overlay.classList.remove('show');
        }
    }
    
    /**
     * Create cookie consent banner HTML
     */
    function createBanner() {
        // Check if banner already exists
        if (document.getElementById('cookie-consent-banner')) {
            return;
        }
        
        const banner = document.createElement('div');
        banner.id = 'cookie-consent-banner';
        banner.className = 'cookie-consent-banner';
        banner.innerHTML = `
            <div class="cookie-content">
                <div class="cookie-text">
                    <div class="cookie-title">We value your privacy</div>
                    <div class="cookie-message">
                        We use cookies to improve your experience and help us understand how our website is used. Analytics cookies are only used with your permission. You can accept or reject them now and change your choice at any time.
                    </div>
                </div>
                <div class="cookie-buttons">
                    <button class="cookie-btn cookie-btn-accept" id="cookie-accept-btn">Accept</button>
                    <button class="cookie-btn cookie-btn-reject" id="cookie-reject-btn">Reject</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        
        // Create overlay for modal when opened from footer
        const overlay = document.createElement('div');
        overlay.id = 'cookie-consent-overlay';
        overlay.className = 'cookie-consent-overlay';
        document.body.appendChild(overlay);
        
        // Add event listeners
        document.getElementById('cookie-accept-btn').addEventListener('click', handleAccept);
        document.getElementById('cookie-reject-btn').addEventListener('click', handleReject);
    }
    
    /**
     * Initialize cookie consent
     */
    function init() {
        // Check for saved consent (includes expiry check)
        const savedConsent = loadConsent();
        
        if (savedConsent) {
            // Consent is valid and not expired - apply it
            updateConsentMode(savedConsent);
            
            // Load GA4 if analytics was granted
            if (savedConsent.analytics_storage === 'granted') {
                loadGA4();
            }
        } else {
            // No saved consent or consent expired - show banner as first-time visitor
            createBanner();
            // Delay showing banner slightly for better UX
            setTimeout(showBanner, 1000);
        }
        
        // Expose function to reopen banner from footer
        window.openCookieSettings = function() {
            createBanner();
            showBanner();
        };
        
        // Expose queueEvent for analytics.js
        window.cookieConsentQueueEvent = queueEvent;
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();
