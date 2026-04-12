/* LLM Wiki — Site JS */

// Theme toggle
function toggleTheme() {
    const html = document.documentElement;
    const next = (html.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('llm-wiki-theme', next);
    updateThemeUI(next);
}

function updateThemeUI(theme) {
    const btn = document.getElementById('theme-btn');
    if (btn) btn.innerHTML = theme === 'dark' ? '&#9728; Light' : '&#9790; Dark';
}

// Mobile nav
function toggleNav() {
    document.querySelector('.nav-links').classList.toggle('open');
}

// Init
(function() {
    const saved = localStorage.getItem('llm-wiki-theme');
    if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
        updateThemeUI(saved);
    } else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        document.documentElement.setAttribute('data-theme', 'light');
        updateThemeUI('light');
    }

    // Set active nav link
    const path = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(a => {
        const href = a.getAttribute('href');
        if (href === path || (path === 'index.html' && href === 'index.html')) {
            a.classList.add('active');
        }
    });
})();
