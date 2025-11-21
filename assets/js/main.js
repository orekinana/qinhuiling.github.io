
// State management
let currentLang = window.INITIAL_LANG || 'zh'; // Use language detected by loader.js
let isDarkMode = false;
let isFirstRender = true; // 标记是否是首次渲染

tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {}
    }
}

// Initialize function
function initializeApp() {
    // 使用 loader.js 检测到的语言（URL 路径优先级最高）
    // 不使用 localStorage，因为 URL 路径应该覆盖本地存储
    currentLang = window.INITIAL_LANG || 'zh';

    // 应用主题（从 localStorage 读取）
    const savedTheme = localStorage.getItem('theme') || 'light';
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
}

// Initialize
// Check if DOM is already loaded (for dynamic script loading)
if (document.readyState === 'loading') {
    // DOM is still loading, wait for it
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    // DOM is already loaded, initialize immediately
    initializeApp();
}

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

    // Use DOM Updater for smooth updates
    if (window.DOMUpdater) {
        window.DOMUpdater.updateNavigation(data.navigation, currentLang);
        window.DOMUpdater.updateProfile(data.profile);
        window.DOMUpdater.updateSections(data.sections, getSectionRenderers());
    } else {
        // Fallback to old method if DOMUpdater not available
        renderNavigation(data.navigation);
        renderProfile(data.profile);
        renderSections(data.sections);
    }

    // Update theme buttons after rendering
    updateThemeButtons();

    // 首次渲染完成后，处理 URL 中的锚点跳转
    if (isFirstRender) {
        handleInitialHashNavigation();
        isFirstRender = false;
    }
}

// 处理首次加载时的锚点跳转
function handleInitialHashNavigation() {
    const hash = window.location.hash;

    if (!hash) return;

    // 移除 # 号，获取目标 section ID
    const targetId = hash.slice(1);

    // 等待所有内容和动画完成后再跳转
    // section 淡入动画是 300ms，所以需要等待至少 400ms
    setTimeout(() => {
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
            const offset = 80; // 固定导航栏高度
            const targetPosition = targetElement.offsetTop - offset;

            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });

            console.log(`[Hash Navigation] Scrolled to section: ${targetId}`);
        } else {
            console.warn(`[Hash Navigation] Target section not found: ${targetId}`);
        }
    }, 500); // 500ms 延迟，确保所有动画完成和内容已渲染
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

// Get section renderers mapping
function getSectionRenderers() {
    return {
        'about': markdownRenderer,
        'services': markdownRenderer,
        'lab': markdownRenderer,
        'news': newsRenderer,
        'publications': publicationsRenderer,
        'projects': projectsRenderer,
        'honors': honorsRenderer,
        'education': periodsRenderer,
        'experience': periodsRenderer,
        'internships': periodsRenderer,
        'patents': patentsRenderer,
        'talks': talksRenderer
    };
}

// Render sections (fallback method, kept for compatibility)
function renderSections(sections) {
    const mainContent = document.getElementById('main-content');

    // Hide static content for SEO when JavaScript loads
    const staticContent = document.querySelectorAll('.static-content');
    staticContent.forEach(element => element.style.display = 'none');

    mainContent.innerHTML = '';

    const renderers = getSectionRenderers();

    Object.entries(sections).forEach(([key, section]) => {
        const sectionDiv = document.createElement('section');
        sectionDiv.id = key;
        sectionDiv.className = 'fade-in bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6';

        // Section title
        const title = document.createElement('h2');
        title.className = 'section-heading text-2xl font-bold mb-6';
        title.textContent = section.title;
        sectionDiv.appendChild(title);

        const renderer = renderers[key];
        if (renderer) {
            const contentElement = renderer(section);
            if (contentElement) {
                sectionDiv.appendChild(contentElement);
            }
        }

        mainContent.appendChild(sectionDiv);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Language toggle with lazy loading
    ['lang-toggle', 'lang-toggle-mobile'].forEach(id => {
        document.getElementById(id).addEventListener('click', async () => {
            const newLang = currentLang === 'zh' ? 'en' : 'zh';

            // Check if the new language is already loaded
            if (!window.LOADED_LANGUAGES.has(newLang)) {
                const button = document.getElementById(id);
                const originalText = button.textContent;
                button.textContent = '...';
                button.disabled = true;

                try {
                    await window.loadLanguageContent(newLang);
                    window.LOADED_LANGUAGES.add(newLang);
                } catch (error) {
                    console.error(`Failed to load ${newLang} content:`, error);
                    button.textContent = originalText;
                    button.disabled = false;
                    return;
                }

                button.disabled = false;
            }

            // Switch to the new language
            currentLang = newLang;
            localStorage.setItem('language', currentLang);

            // 更新全局语言标记（重要：保持和 loader.js 同步）
            window.INITIAL_LANG = currentLang;

            // 更新 URL 路径（保留当前锚点）
            const hash = window.location.hash;
            const newPath = `/${currentLang}${hash}`;
            history.pushState({ lang: currentLang }, '', newPath);

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

// Setup browser navigation (back/forward button) handler
window.addEventListener('popstate', async (event) => {
    // 检测 URL 路径变化
    const path = window.location.pathname;
    let newLang = 'zh'; // 默认

    if (path === '/en' || path.startsWith('/en/') || path.startsWith('/en#')) {
        newLang = 'en';
    } else if (path === '/zh' || path.startsWith('/zh/') || path.startsWith('/zh#')) {
        newLang = 'zh';
    }

    // 如果语言变化，重新渲染
    if (newLang !== currentLang) {
        // 检查新语言是否已加载
        if (!window.LOADED_LANGUAGES.has(newLang)) {
            try {
                await window.loadLanguageContent(newLang);
                window.LOADED_LANGUAGES.add(newLang);
            } catch (error) {
                console.error(`Failed to load ${newLang} content:`, error);
                return;
            }
        }

        currentLang = newLang;
        localStorage.setItem('language', currentLang);
        window.INITIAL_LANG = currentLang; // 保持全局语言标记同步
        renderContent();
    }
});
