/* ==========================================================
   Assignment #4: Introduction to JavaScript
   Bodybuilders Gym - Group SE-2512
   One file for all pages. Each feature only runs when its
   elements exist on the current page.
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initFormValidation();   // Task 1 - contact.html
    initAccordion();        // Task 2 - faq.html
    initPopup();            // Task 3 - index.html
    initBackgroundColor();  // Task 4 - dashboard.html
    initDateTime();         // Task 5 - dashboard.html
});


/* ----------------------------------------------------------
   Shared helpers for showing / clearing validation messages
   (uses Bootstrap's is-invalid / is-valid classes)
   ---------------------------------------------------------- */
function setError(input, message) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    const box = document.getElementById(input.id + '-error');
    if (box) box.textContent = message;
}

function setValid(input) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    const box = document.getElementById(input.id + '-error');
    if (box) box.textContent = '';
}

function isValidEmail(value) {
    // something@something.something, no spaces
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}


/* ==========================================================
   TASK 1. Form Validation  (contact.html)
   ========================================================== */
function validateName(input) {
    const value = input.value.trim();
    if (value === '')       { setError(input, 'Full name is required.'); return false; }
    if (value.length < 2)   { setError(input, 'Name must be at least 2 characters.'); return false; }
    setValid(input);
    return true;
}

function validateEmail(input) {
    const value = input.value.trim();
    if (value === '')           { setError(input, 'Email is required.'); return false; }
    if (!isValidEmail(value))   { setError(input, 'Enter a valid email, for example name@example.com.'); return false; }
    setValid(input);
    return true;
}

function validatePassword(input) {
    const value = input.value;
    if (value === '')       { setError(input, 'Password is required.'); return false; }
    if (value.length < 8)   { setError(input, 'Password must be at least 8 characters.'); return false; }
    setValid(input);
    return true;
}

function validateConfirm(passwordInput, confirmInput) {
    const value = confirmInput.value;
    if (value === '')                      { setError(confirmInput, 'Please confirm your password.'); return false; }
    if (value !== passwordInput.value)     { setError(confirmInput, 'Passwords do not match.'); return false; }
    setValid(confirmInput);
    return true;
}

/* ----------------------------------------------------------
   Callbacks + fetch (Assignment 5)
   sendFormData posts JSON to a server WITHOUT reloading the page.
   When the server answers, it calls callback(error, result).
   ---------------------------------------------------------- */
function sendFormData(data, callback) {
    fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)               // JavaScript object -> JSON text
    })
        .then(response => {
            if (!response.ok) throw new Error('server error ' + response.status);
            return response.json();
        })
        .then(result => callback(null, result))  // success: no error
        .catch(error => callback(error));        // network or server problem
}

function showFormMessage(box, text, isError) {
    box.textContent = text;
    box.classList.remove('d-none', 'alert-success', 'alert-danger');
    box.classList.add(isError ? 'alert-danger' : 'alert-success');
}


function initFormValidation() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const nameInput     = document.getElementById('name');
    const emailInput    = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmInput  = document.getElementById('confirmPassword');
    const successBox    = document.getElementById('form-success');
    const submitButton  = form.querySelector('button[type="submit"]');

    // Live feedback: check a field when the user leaves it
    nameInput.addEventListener('blur',     () => validateName(nameInput));
    emailInput.addEventListener('blur',    () => validateEmail(emailInput));
    passwordInput.addEventListener('blur', () => validatePassword(passwordInput));
    confirmInput.addEventListener('blur',  () => validateConfirm(passwordInput, confirmInput));

    form.addEventListener('submit', (event) => {
        event.preventDefault();               // stop the page from reloading
        successBox.classList.add('d-none');

        // Run every check (do not stop at the first error)
        const results = [
            validateName(nameInput),
            validateEmail(emailInput),
            validatePassword(passwordInput),
            validateConfirm(passwordInput, confirmInput)
        ];

        if (results.every(ok => ok)) {
            // Data we send to the server. The password is NOT sent.
            const payload = {
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                plan: document.getElementById('plan').value,
                trainingTime: form.querySelector('input[name="time"]:checked').value,
                message: document.getElementById('message').value.trim()
            };

            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            // sendFormData(data, callback): the callback runs when the server answers
            sendFormData(payload, (error) => {
                submitButton.disabled = false;
                submitButton.textContent = 'Join Now';

                if (error) {
                    showFormMessage(successBox, 'Sorry, we could not send your form (' + error.message + '). Please try again.', true);
                    if (typeof playSound === 'function') playSound('error');
                    return;
                }

                showFormMessage(successBox, 'Thank you, ' + payload.name + '! Your registration was sent.', false);
                if (typeof playSound === 'function') playSound('success');
                form.reset();
                form.querySelectorAll('.is-valid').forEach(el => el.classList.remove('is-valid'));
            });
        }
    });
}


/* ==========================================================
   TASK 2. Accordion (faq.html)
   Answers are hidden by default (max-height: 0 in CSS).
   JS sets max-height to the real height so CSS can animate it.
   ========================================================== */
function initAccordion() {
    const items = document.querySelectorAll('.faq-item');
    if (items.length === 0) return;

    items.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer   = item.querySelector('.faq-answer');

        question.addEventListener('click', () => {
            const isOpen = item.classList.toggle('open');          // add or remove class
            question.setAttribute('aria-expanded', String(isOpen)); // accessibility
            answer.style.maxHeight = isOpen ? answer.scrollHeight + 'px' : null;
        });
    });
}


/* ==========================================================
   TASK 3. Popup Subscription Form (index.html)
   ========================================================== */
function initPopup() {
    const overlay    = document.getElementById('subscribe-popup');
    const openBtn    = document.getElementById('openPopupBtn');
    const closeBtn   = document.getElementById('closePopupBtn');
    if (!overlay || !openBtn) return;

    const form       = document.getElementById('subscribe-form');
    const emailInput = document.getElementById('subEmail');
    const message    = document.getElementById('subscribe-message');

    const openPopup  = () => {
        overlay.classList.add('show');
        overlay.setAttribute('aria-hidden', 'false');
        emailInput.focus();
    };

    const closePopup = () => {
        overlay.classList.remove('show');
        overlay.setAttribute('aria-hidden', 'true');
    };

    openBtn.addEventListener('click', openPopup);
    closeBtn.addEventListener('click', closePopup);

    // Click on the dark area outside the white box closes the popup
    overlay.addEventListener('click', (event) => {
        if (event.target === overlay) closePopup();
    });

    // Escape key closes it too
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closePopup();
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = emailInput.value.trim();

        if (!isValidEmail(value)) {
            message.textContent = 'Please enter a valid email address.';
            message.className = 'mt-3 mb-0 text-danger';
            return;
        }

        message.textContent = 'Subscribed! Check your inbox for our weekly training tips.';
        if (typeof playSound === 'function') playSound('success');
        message.className = 'mt-3 mb-0 text-success';
        form.reset();
        setTimeout(() => {              // close after 1.5 s
            closePopup();
            message.textContent = '';
        }, 1500);
    });
}


/* ==========================================================
   TASK 4. Change Background Color (dashboard.html)
   ========================================================== */
function initBackgroundColor() {
    const cycleBtn  = document.getElementById('cycleColorBtn');
    const randomBtn = document.getElementById('randomColorBtn');
    const resetBtn  = document.getElementById('resetColorBtn');
    if (!cycleBtn) return;

    const colors = ['#ECE6D8', '#F4D9CF', '#DDE7D3', '#D6E4EE', '#EBE0F0', '#F5E9B8'];
    let index = 0;

    const setBackground = (color) => {
        document.body.style.backgroundColor = color;
        const label = document.getElementById('currentColor');
        if (label) label.textContent = color;
    };

    // Cycle: go through the predefined list, then start again
    cycleBtn.addEventListener('click', () => {
        index = (index + 1) % colors.length;      // modulo keeps index in 0..length-1
        setBackground(colors[index]);
    });

    // Random: build a light random color (high values keep text readable)
    randomBtn.addEventListener('click', () => {
        const channel = () => 160 + Math.floor(Math.random() * 96);   // 160..255
        setBackground('rgb(' + channel() + ', ' + channel() + ', ' + channel() + ')');
    });

    resetBtn.addEventListener('click', () => {
        index = 0;
        document.body.style.backgroundColor = '';   // remove inline style, CSS color returns
        const label = document.getElementById('currentColor');
        if (label) label.textContent = colors[0];
    });
}


/* ==========================================================
   TASK 5. Current Date and Time (dashboard.html)
   ========================================================== */
function formatDateTime(date) {
    const day  = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    return day + ', ' + time;                       // e.g. October 9, 2026, 10:45:12 AM
}

function initDateTime() {
    const output = document.getElementById('datetime');
    if (!output) return;

    const update = () => {
        output.textContent = formatDateTime(new Date());
    };

    update();                    // show immediately
    setInterval(update, 1000);   // then refresh every second
}
