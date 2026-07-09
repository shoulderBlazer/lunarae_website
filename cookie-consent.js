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
        ad_storage: 'denied'
    };
    
    // Track if GA4 has been loaded
    let ga4Loaded = false;
    
    // Track pending events before consent
    let pendingEvents = [];
    
    // Initialize dataLayer for Google Consent Mode
    window.dataLayer = window.dataLayer || [];
    
    /**
     * Update Google Consent Mode
     * @param {Object} consent - Consent state object
     */
    function updateConsentMode(consent) {
        const previousAnalyticsState = consentState.analytics_storage;
        
        consentState = { ...consentState, ...consent };
        
        window.dataLayer.push(function() {
            this.setConsent(consentState);
        });
        
        window.dataLayer.push({
            event: 'consent_update',
            ...consentState
        });
        
        // Clear GA cookies if analytics consent changes from granted to denied
        if (previousAnalyticsState === 'granted' && consentState.analytics_storage === 'denied') {
            clearGACookies();
        }
    }
    
    /**
     * Load GA4 script
     */
    function loadGA4() {
        if (ga4Loaded) return;
        
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
        document.head.appendChild(script);
        
        window.gtag = function() {
            dataLayer.push(arguments);
        };
        
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
        window.dataLayer.push(function() {
            this.setConsent(consentState);
        });
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
        // Get current domain and its subdomains
        const hostname = window.location.hostname;
        const domains = [hostname, `.${hostname}`];
        
        // Handle localhost for testing
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            domains.push('localhost', '127.0.0.1');
        }
        
        // Clear _ga cookie
        domains.forEach(domain => {
            document.cookie = `_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
        });
        
        // Clear _ga_* cookies (all GA4 cookies starting with _ga_)
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            const cookieName = cookie.split('=')[0].trim();
            if (cookieName.startsWith('_ga_')) {
                domains.forEach(domain => {
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
                });
            }
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
        saveConsent(newConsent);
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
        saveConsent(newConsent);
        // Clear GA cookies for privacy when user rejects
        clearGACookies();
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
        // Initialize Consent Mode with default denied
        initializeConsentMode();
        
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
