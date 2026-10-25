/* ==========================================================
   Loaded in <head> so the saved theme is applied BEFORE the
   page is painted (prevents a white flash in Night mode).
   ========================================================== */
(function () {
    try {
        const savedTheme = localStorage.getItem('gym-theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
            document.documentElement.setAttribute('data-bs-theme', savedTheme);
        }
    } catch (error) {
        /* localStorage can be blocked; the site simply uses the light theme */
    }
})();
