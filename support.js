(() => {
    'use strict';

    const form = document.getElementById('support-form');
    const panel = document.getElementById('support-panel');
    const choices = document.querySelectorAll('.support-choice');
    const message = document.getElementById('support-message');
    const status = document.getElementById('submission-status');
    const success = document.getElementById('submission-success');
    const sendButton = document.getElementById('send-message');
    const selectedApp = document.getElementById('selected-app');
    let sending = false;
    const appNames = {
        bedtime: 'LunaRae: Bedtime Stories',
        thriller: 'LunaRae: Thriller Stories'
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (sending) return;
        if (!form.reportValidity()) return;
        if (!Object.hasOwn(appNames, selectedApp.value)) return;

        const payload = {
            app: selectedApp.value,
            category: document.getElementById('support-topic').value,
            name: document.getElementById('support-name').value,
            email: document.getElementById('support-email').value,
            message: message.value,
            website: document.getElementById('website').value
        };
        sending = true;
        sendButton.disabled = true;
        sendButton.textContent = 'Sending...';
        status.textContent = 'Sending...';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        try {
            const response = await fetch('https://uv4kbpsxzdrw3khyfuibctzmca0yephx.lambda-url.eu-west-2.on.aws/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });
            if (!response.ok) throw new Error('Submission failed');
            // The HTTP status confirms delivery; response JSON is not needed.
            form.reset();
            selectedApp.value = '';
            choices.forEach((card) => {
                card.setAttribute('aria-pressed', 'false');
                card.querySelector('.selection-marker').textContent = 'Choose app';
            });
            document.getElementById('selected-app-name').textContent = '';
            document.getElementById('selection-announcement').textContent = '';
            message.setCustomValidity('');
            status.textContent = '';
            panel.hidden = true;
            success.hidden = false;
        } catch {
            status.textContent = 'Your message could not be sent. Please try again.';
        } finally {
            clearTimeout(timeout);
            sending = false;
            sendButton.disabled = false;
            sendButton.textContent = 'Send Message';
            (success.hidden ? status : success).focus();
        }
    });

    message.addEventListener('input', () => {
        message.setCustomValidity(message.value.trim() ? '' : 'Please enter a message.');
    });

    choices.forEach((choice) => {
        choice.addEventListener('click', () => {
            success.hidden = true;
            const app = choice.dataset.app;
            choices.forEach((card) => {
                const selected = card === choice;
                card.setAttribute('aria-pressed', String(selected));
                card.querySelector('.selection-marker').textContent = selected ? '✓ Selected' : 'Choose app';
            });
            document.getElementById('selected-app').value = app;
            document.getElementById('selected-app-name').textContent = appNames[app];
            panel.hidden = false;
            status.textContent = '';
            document.getElementById('selection-announcement').textContent = `${appNames[app]} selected. The support form is available below the app choices.`;
        });
        choice.disabled = false;
    });
    sendButton.disabled = false;
})();
