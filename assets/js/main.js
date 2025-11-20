
// State management
let currentLang = 'zh';
let isDarkMode = false;

tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {}
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check for saved preferences
    const savedLang = localStorage.getItem('language') || 'zh';
    const savedTheme = localStorage.getItem('theme') || 'light';

    currentLang = savedLang;
    isDarkMode = savedTheme === 'dark';

    // Apply theme correctly
    applyTheme();

    // Render initial content
    renderContent();

    // Setup event listeners
    setupEventListeners();

    // Setup scroll spy
    setupScrollSpy();

    // Setup back to top button
    setupBackToTop();
});

// Apply theme to DOM
function applyTheme() {
    const html = document.documentElement;
    if (isDarkMode) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }

    // Update theme toggle button icons
    updateThemeButtons();
}

// Update theme toggle buttons
function updateThemeButtons() {
    const desktopMoonIcon = document.querySelector('#theme-toggle .fa-moon');
    const desktopSunIcon = document.querySelector('#theme-toggle .fa-sun');
    const mobileMoonIcon = document.querySelector('#theme-toggle-mobile .fa-moon');
    const mobileSunIcon = document.querySelector('#theme-toggle-mobile .fa-sun');

    if (isDarkMode) {
        // Dark mode: show sun icon, hide moon icon
        desktopMoonIcon?.classList.add('hidden');
        desktopSunIcon?.classList.remove('hidden');
        mobileMoonIcon?.classList.add('hidden');
        mobileSunIcon?.classList.remove('hidden');
    } else {
        // Light mode: show moon icon, hide sun icon
        desktopMoonIcon?.classList.remove('hidden');
        desktopSunIcon?.classList.add('hidden');
        mobileMoonIcon?.classList.remove('hidden');
        mobileSunIcon?.classList.add('hidden');
    }
}

// Update meta tags for better SEO and social sharing
function updateMetaTags() {
    const data = portfolioData[currentLang];
    const profile = data.profile;

    // Update page title
    document.title = currentLang === 'en'
        ? `${profile.name} - ${profile.title}, ${profile.affiliation}`
        : `${profile.name} - ${profile.affiliation}${profile.title}`;

    // Update description meta tag
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
        descriptionMeta.content = profile.bio;
    }

    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogLocale = document.querySelector('meta[property="og:locale"]');

    if (ogTitle) ogTitle.content = document.title;
    if (ogDescription) ogDescription.content = profile.bio;
    if (ogLocale) ogLocale.content = currentLang === 'en' ? 'en_US' : 'zh_CN';

    // Update Twitter Card
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');

    if (twitterTitle) twitterTitle.content = document.title;
    if (twitterDescription) twitterDescription.content = profile.bio;

    // Update HTML lang attribute
    document.documentElement.lang = currentLang === 'en' ? 'en' : 'zh-CN';
}

// Render content based on current language
function renderContent() {
    const data = portfolioData[currentLang];

    // Update meta tags for SEO and social sharing
    updateMetaTags();

    // Update language toggle button text
    document.getElementById('lang-toggle').textContent = displayKeys.lang[currentLang];
    document.getElementById('lang-toggle-mobile').textContent = displayKeys.lang[currentLang];

    // Render navigation
    renderNavigation(data.navigation);

    // Render profile
    renderProfile(data.profile);

    // Render sections
    renderSections(data.sections);

    // Update theme buttons after rendering
    updateThemeButtons();

    // Add fade-in animation to new content
    document.querySelectorAll('.fade-in').forEach(el => {
        el.style.opacity = '0';
        setTimeout(() => {
            el.style.opacity = '1';
        }, 100);
    });
}

// Render navigation
function renderNavigation(navItems) {
    const navLinks = document.getElementById('nav-links');
    const mobileNavLinks = document.getElementById('mobile-nav-links');
    const navName = document.getElementById('nav-name');

    navName.textContent = portfolioData[currentLang].profile.name;

    navLinks.innerHTML = '';
    mobileNavLinks.innerHTML = '';

    navItems.forEach(item => {
        // Desktop nav
        const link = document.createElement('a');
        link.href = `#${item.id}`;
        link.className = 'nav-link link-hover text-gray-600 dark:text-gray-400 hover:text-[#2c4f7c] dark:hover:text-blue-400 font-medium';
        link.textContent = item.label;
        link.dataset.section = item.id;
        navLinks.appendChild(link);

        // Mobile nav
        const mobileLink = document.createElement('a');
        mobileLink.href = `#${item.id}`;
        mobileLink.className = 'block px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-[#2c4f7c] dark:hover:text-blue-400';
        mobileLink.innerHTML = `<i class="fas ${item.icon} w-5 mr-2"></i>${item.label}`;
        mobileLink.addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.add('hidden');
        });
        mobileNavLinks.appendChild(mobileLink);
    });
}

// Render profile
function renderProfile(profile) {
    // Name and title
    document.getElementById('profile-name').textContent = profile.name;
    document.getElementById('profile-title').textContent = profile.title;
    document.getElementById('profile-affiliation').textContent = profile.affiliation;
    document.getElementById('profile-department').textContent = profile.department;

    // Bio
    document.getElementById('profile-bio').textContent = profile.bio;

    const contactDiv = document.getElementById('profile-contact');
    contactDiv.innerHTML = `
        <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <i class="fas fa-map-marker-alt w-5"></i>
            <span>${profile.contact.location}</span>
        </div>
        <div class="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <i class="fas fa-envelope w-5"></i>
            <a href="mailto:${profile.contact.email}" class="link-hover">${profile.contact.email}</a>
        </div>
    `;

    // Social links
    const socialDiv = document.getElementById('profile-social');
    socialDiv.innerHTML = '';

    // Research Fields
    document.getElementById('profile-research-fields').innerHTML = `<p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed"><strong>${displayKeys.researchFields[currentLang]}:</strong> ${profile.researchFields}</p>`;

    // Contact
    if (profile.social.googleScholar) {
        socialDiv.innerHTML += `<a href="${profile.social.googleScholar}" target="_blank" class="text-gray-600 dark:text-gray-400 hover:text-[#2c4f7c] dark:hover:text-blue-400"><i class="fas fa-graduation-cap text-lg"></i></a>`;
    }
    if (profile.social.schoolWebsite) {
        socialDiv.innerHTML += `<a href="${profile.social.schoolWebsite}" target="_blank" class="text-gray-600 dark:text-gray-400 hover:text-[#2c4f7c] dark:hover:text-blue-400"><i class="fas fa-school text-lg"></i></a>`;
    }
    if (profile.social.github) {
        socialDiv.innerHTML += `<a href="${profile.social.github}" target="_blank" class="text-gray-600 dark:text-gray-400 hover:text-[#2c4f7c] dark:hover:text-blue-400"><i class="fab fa-github text-lg"></i></a>`;
    }
    if (profile.social.linkedin) {
        socialDiv.innerHTML += `<a href="${profile.social.linkedin}" target="_blank" class="text-gray-600 dark:text-gray-400 hover:text-[#2c4f7c] dark:hover:text-blue-400"><i class="fab fa-linkedin text-lg"></i></a>`;
    }
    if (profile.social.twitter) {
        socialDiv.innerHTML += `<a href="${profile.social.twitter}" target="_blank" class="text-gray-600 dark:text-gray-400 hover:text-[#2c4f7c] dark:hover:text-blue-400"><i class="fab fa-twitter text-lg"></i></a>`;
    }
}

// Render sections
function renderSections(sections) {
    const mainContent = document.getElementById('main-content');

    // Hide static content for SEO when JavaScript loads
    const staticContent = document.querySelectorAll('.static-content');
    staticContent.forEach(element => element.style.display = 'none');

    mainContent.innerHTML = '';

    Object.entries(sections).forEach(([key, section]) => {
        const sectionDiv = document.createElement('section');
        sectionDiv.id = key;
        sectionDiv.className = 'fade-in bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6';

        // Section title
        const title = document.createElement('h2');
        title.className = 'section-heading text-2xl font-bold mb-6';
        title.textContent = section.title;
        sectionDiv.appendChild(title);

        let contentElement = null;
        switch (key) {
            case 'about':
            case 'services':
            case 'lab':
                contentElement = markdownRenderer(section);
                break;
            case 'news':
                contentElement = newsRenderer(section);
                break;
            case 'publications':
                contentElement = publicationsRenderer(section);
                break;
            case 'projects':
                contentElement = projectsRenderer(section);
                break;
            case 'honors':
                contentElement = honorsRenderer(section);
                break;
            case 'education':
            case 'experience':
            case 'internships':
                contentElement = periodsRenderer(section);
                break;
            case 'patents':
                contentElement = patentsRenderer(section);
                break;
            case 'talks':
                contentElement = talksRenderer(section);
                break;
        }
        if (contentElement) {
            sectionDiv.appendChild(contentElement);
        }

        mainContent.appendChild(sectionDiv);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Language toggle
    ['lang-toggle', 'lang-toggle-mobile'].forEach(id => {
        document.getElementById(id).addEventListener('click', () => {
            currentLang = currentLang === 'zh' ? 'en' : 'zh';
            localStorage.setItem('language', currentLang);
            renderContent();
        });
    });

    // Theme toggle
    ['theme-toggle', 'theme-toggle-mobile'].forEach(id => {
        document.getElementById(id).addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            applyTheme();
            localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
        });
    });

    // Mobile menu toggle
    document.getElementById('mobile-menu-toggle').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('hidden');
    });

    // Smooth scroll for navigation links
    document.addEventListener('click', (e) => {
        if (e.target.matches('a[href^="#"]')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').slice(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                const offset = 80; // Account for fixed header
                const targetPosition = targetElement.offsetTop - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }
    });
}

// Setup scroll spy
function setupScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= sectionTop - 100) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('text-[#2c4f7c]', 'dark:text-blue-400');
            if (link.dataset.section === current) {
                link.classList.add('text-[#2c4f7c]', 'dark:text-blue-400');
            }
        });
    });
}

// Setup back to top button
function setupBackToTop() {
    const backToTopBtn = document.getElementById('back-to-top');

    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTopBtn.classList.remove('opacity-0', 'invisible');
            backToTopBtn.classList.add('opacity-100', 'visible');
        } else {
            backToTopBtn.classList.add('opacity-0', 'invisible');
            backToTopBtn.classList.remove('opacity-100', 'visible');
        }
    });

    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
