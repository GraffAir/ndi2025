// === LANGUAGE SWITCHER ===
const langBtn = document.getElementById('langBtn');
const langDropdown = document.getElementById('langDropdown');
const langOptions = document.querySelectorAll('.lang-option');

// Toggle dropdown
langBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    langDropdown.classList.toggle('active');
});

// Close dropdown on outside click
document.addEventListener('click', () => {
    langDropdown?.classList.remove('active');
});

// Update flag based on current language
const currentLang = new URLSearchParams(window.location.search).get('lng') || 'fr';
const flags = { fr: '🇫🇷', en: '🇬🇧', es: '🇪🇸' };
if (langBtn) {
    langBtn.querySelector('.flag').textContent = flags[currentLang] || '🇫🇷';
}

// Highlight active language
langOptions.forEach(option => {
    if (option.dataset.lang === currentLang) {
        option.classList.add('active');
    }
});

// === DARK MODE TOGGLE ===
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle?.querySelector('.theme-icon');

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeIcon) themeIcon.textContent = '☀️';
}

// Toggle theme
themeToggle?.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    
    if (themeIcon) {
        themeIcon.textContent = isDark ? '☀️' : '🌙';
    }
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Animation feedback
    themeToggle.style.transform = 'rotate(360deg) scale(1.1)';
    setTimeout(() => {
        themeToggle.style.transform = '';
    }, 300);
});

// === LANGUAGE SWITCHER ===
const langBtn = document.getElementById('langBtn');
const langDropdown = document.getElementById('langDropdown');
const langOptions = document.querySelectorAll('.lang-option');

// Toggle dropdown
langBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    langDropdown.classList.toggle('active');
});

// Close dropdown on outside click
document.addEventListener('click', () => {
    langDropdown?.classList.remove('active');
});

// Update flag based on current language
const currentLang = new URLSearchParams(window.location.search).get('lng') || 'fr';
const flags = { fr: '🇫🇷', en: '🇬🇧', es: '🇪🇸' };
if (langBtn) {
    langBtn.querySelector('.flag').textContent = flags[currentLang] || '🇫🇷';
}

// Highlight active language
langOptions.forEach(option => {
    if (option.dataset.lang === currentLang) {
        option.classList.add('active');
    }
});

// === DARK MODE TOGGLE ===
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle?.querySelector('.theme-icon');

// Load saved theme
const savedTheme = localStorage.getItem('theme') || 'light';
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeIcon) themeIcon.textContent = '☀️';
}

// Toggle theme
themeToggle?.addEventListener('click', () => {
    const isDark = document.body.classList.toggle('dark-mode');
    
    if (themeIcon) {
        themeIcon.textContent = isDark ? '☀️' : '🌙';
    }
    
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Animation feedback
    themeToggle.style.transform = 'rotate(360deg) scale(1.1)';
    setTimeout(() => {
        themeToggle.style.transform = '';
    }, 300);
});
