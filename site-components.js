(() => {
    'use strict';

    // Loaded with defer: render before DOMContentLoaded and Support initialisation.
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const header = document.getElementById('site-header');
    const footer = document.getElementById('site-footer');
    const wordmark = '<a class="site-brand" href="index.html">LunaRae</a>';

    if (header) {
        header.innerHTML = `<div class="site-nav-inner">
            ${wordmark}
            <div class="site-nav-links"><a href="bedtime-stories.html">Bedtime Stories</a><a href="thriller-stories.html">Thriller Stories</a><a href="support.html">Support</a></div>
        </div>`;
        header.querySelectorAll('.site-nav-links a').forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.setAttribute('aria-current', 'page');
            }
        });
    }

    if (footer) {
        // The selector pages intentionally omit the wordmark; Support also has Home.
        // Existing classes own layout and colour, including the light Thriller wordmark.
        const minimal = footer.classList.contains('selector-footer');
        const homeLink = footer.hasAttribute('data-home-link')
            ? '<a href="index.html">Home</a>' : '';
        footer.innerHTML = `${minimal ? '' : wordmark}
            <div class="footer-links">${homeLink}<a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms &amp; Conditions</a><button type="button">Cookie Settings</button></div>
            <p>© 2026 LunaRae. All rights reserved.</p>`;

        // Preserve the approved footer's opt-in current-page underline (Privacy only).
        if (footer.hasAttribute('data-mark-current')) {
            footer.querySelectorAll('.footer-links a').forEach(link => {
                if (link.getAttribute('href') === currentPage) {
                    link.setAttribute('aria-current', 'page');
                }
            });
        }
        footer.querySelector('button').addEventListener('click', () => {
            window.openCookieSettings();
        });
    }
})();
