// GA4 Configuration
const GA4_MEASUREMENT_ID = 'G-Z8S01MQ0YJ';

// Initialize GA4
(function() {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
        dataLayer.push(arguments);
    };
    
    gtag('js', new Date());
    gtag('config', GA4_MEASUREMENT_ID);
})();

// Track custom events with duplicate prevention
const trackedClicks = new Set();

function trackEvent(eventName, parameters = {}) {
    const clickId = `${eventName}-${Date.now()}-${Math.random()}`;
    
    if (trackedClicks.has(clickId)) {
        return;
    }
    
    trackedClicks.add(clickId);
    
    // Clean up old entries to prevent memory leaks
    if (trackedClicks.size > 100) {
        const oldest = trackedClicks.values().next().value;
        trackedClicks.delete(oldest);
    }
    
    const defaultParams = {
        page_location: window.location.href,
        page_title: document.title,
        ...parameters
    };
    
    gtag('event', eventName, defaultParams);
}

// Event delegation for button clicks
document.addEventListener('click', function(event) {
    const button = event.target.closest('[data-ga-event]');
    
    if (!button) return;
    
    const eventName = button.getAttribute('data-ga-event');
    const buttonText = button.getAttribute('data-ga-button-text') || button.textContent.trim();
    
    trackEvent(eventName, {
        button_text: buttonText
    });
});
