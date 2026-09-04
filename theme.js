(function () {
    const STORAGE_KEY = 'verktoy-theme';

    const SUN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-svg"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
    const MOON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="theme-icon-svg"><path d="M12 3a6 6 0 0 0 9 9 9 0 1 1-9-9Z"/></svg>`;

    function getPreferredTheme() {
        // 1. Check URL query parameter (bypasses local file:// origin isolation in Chrome/Edge)
        try {
            const params = new URLSearchParams(window.location.search);
            const urlTheme = params.get('theme');
            if (urlTheme === 'natt' || urlTheme === 'dag') {
                try { localStorage.setItem(STORAGE_KEY, urlTheme); } catch(e){}
                return urlTheme;
            }
        } catch(e){}

        // 2. Check localStorage
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'natt' || saved === 'dag') {
                return saved;
            }
        } catch (e) {}

        // 3. Default to Nattmodus
        return 'natt';
    }

    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {}
        updateButtons(theme);
        updateNavigationLinks(theme);
    }

    function updateNavigationLinks(theme) {
        document.querySelectorAll('a[href]').forEach(a => {
            const href = a.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('javascript:')) {
                try {
                    const basePath = href.split('?')[0];
                    a.setAttribute('href', basePath + '?theme=' + theme);
                } catch(e){}
            }
        });
    }

    function updateButtons(theme) {
        const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
        toggleBtns.forEach(btn => {
            const isDark = theme === 'natt';
            const iconContainer = btn.querySelector('.theme-icon') || btn.querySelector('.theme-icon-container');
            const text = btn.querySelector('.theme-text');
            
            if (iconContainer) {
                iconContainer.innerHTML = isDark ? MOON_SVG : SUN_SVG;
            }
            if (text) {
                text.textContent = isDark ? 'NATT' : 'DAG';
            }
            btn.setAttribute('aria-label', isDark ? 'Bytt til dagmodus' : 'Bytt til nattmodus');
        });
    }

    // Apply immediately in head before render to prevent FOUC / mode flickering
    const initialTheme = getPreferredTheme();
    document.documentElement.setAttribute('data-theme', initialTheme);

    window.toggleTheme = function () {
        const current = document.documentElement.getAttribute('data-theme') || 'natt';
        const next = current === 'natt' ? 'dag' : 'natt';
        applyTheme(next);
    };

    document.addEventListener('DOMContentLoaded', function () {
        const activeTheme = document.documentElement.getAttribute('data-theme') || initialTheme;
        updateButtons(activeTheme);
        updateNavigationLinks(activeTheme);
        document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
            btn.addEventListener('click', window.toggleTheme);
        });
    });
})();
