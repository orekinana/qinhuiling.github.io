/**
 * DOM Updater - 细粒度 DOM 更新器
 *
 * 核心思想：
 * - 不暴力重建，而是智能更新
 * - 复用现有 DOM 结构，减少重排
 * - 平滑的淡入淡出动画
 * - 保持滚动位置稳定
 */

window.DOMUpdater = (function() {
    'use strict';

    let isFirstLoad = true;

    // 更新导航栏
    function updateNavigation(navItems, currentLang) {
        const navName = document.getElementById('nav-name');
        const navLinks = document.getElementById('nav-links');
        const mobileNavLinks = document.getElementById('mobile-nav-links');

        if (navName && window.portfolioData && window.portfolioData[currentLang]) {
            navName.textContent = window.portfolioData[currentLang].profile.name;
        }

        if (navLinks) {
            navLinks.innerHTML = '';
            navItems.forEach(item => {
                const link = document.createElement('a');
                link.href = `#${item.id}`;
                link.className = 'nav-link link-hover text-gray-600 dark:text-gray-400 hover:text-[#2c4f7c] dark:hover:text-blue-400 font-medium';
                link.textContent = item.label;
                link.dataset.section = item.id;
                navLinks.appendChild(link);
            });
        }

        if (mobileNavLinks) {
            mobileNavLinks.innerHTML = '';
            navItems.forEach(item => {
                const link = document.createElement('a');
                link.href = `#${item.id}`;
                link.className = 'block px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-[#2c4f7c] dark:hover:text-blue-400';
                link.innerHTML = `<i class="fas ${item.icon} w-5 mr-2"></i>${item.label}`;
                link.addEventListener('click', () => {
                    document.getElementById('mobile-menu')?.classList.add('hidden');
                });
                mobileNavLinks.appendChild(link);
            });
        }
    }

    // 更新个人资料
    function updateProfile(profile) {
        const updates = {
            'profile-name': profile.name,
            'profile-title': profile.title,
            'profile-affiliation': profile.affiliation,
            'profile-department': profile.department,
            'profile-bio': profile.bio
        };

        Object.entries(updates).forEach(([id, text]) => {
            const elem = document.getElementById(id);
            if (elem) elem.textContent = text;
        });

        // 更新联系方式
        const contactDiv = document.getElementById('profile-contact');
        if (contactDiv) {
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
        }

        // 更新研究领域
        const researchFieldsElem = document.getElementById('profile-research-fields');
        if (researchFieldsElem && window.displayKeys) {
            const currentLang = window.INITIAL_LANG || 'zh';
            researchFieldsElem.innerHTML = `<p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed"><strong>${window.displayKeys.researchFields[currentLang]}:</strong> ${profile.researchFields}</p>`;
        }

        // 更新社交链接
        updateSocialLinks(profile.social);
    }

    // 更新社交链接
    function updateSocialLinks(social) {
        const socialDiv = document.getElementById('profile-social');
        if (!socialDiv) return;

        socialDiv.innerHTML = '';

        const links = [
            { key: 'googleScholar', icon: 'fas fa-graduation-cap', label: 'Google Scholar' },
            { key: 'schoolWebsite', icon: 'fas fa-school', label: 'School Website' },
            { key: 'github', icon: 'fab fa-github', label: 'GitHub' },
            { key: 'linkedin', icon: 'fab fa-linkedin', label: 'LinkedIn' },
            { key: 'twitter', icon: 'fab fa-twitter', label: 'Twitter' }
        ];

        links.forEach(({ key, icon, label }) => {
            if (social[key]) {
                const a = document.createElement('a');
                a.href = social[key];
                a.target = '_blank';
                a.className = 'text-gray-600 dark:text-gray-400 hover:text-[#2c4f7c] dark:hover:text-blue-400';
                a.setAttribute('aria-label', label);
                a.innerHTML = `<i class="${icon} text-lg"></i>`;
                socialDiv.appendChild(a);
            }
        });
    }

    // 更新 sections（核心功能）
    function updateSections(sections, renderers) {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        // 保存当前滚动位置
        const scrollY = window.scrollY;

        // 首次加载：隐藏所有静态内容
        if (isFirstLoad) {
            const staticContent = document.querySelectorAll('.static-content');
            staticContent.forEach(elem => {
                elem.style.opacity = '0';
                elem.style.transition = 'opacity 0.3s ease';
            });
        }

        // 获取现有的 sections
        const existingSections = new Map();
        mainContent.querySelectorAll('section[id]').forEach(section => {
            existingSections.set(section.id, section);
        });

        // 更新或创建 sections
        Object.entries(sections).forEach(([key, section]) => {
            const existingSection = existingSections.get(key);

            if (existingSection) {
                // 复用现有 section，只更新内容
                updateSectionContent(existingSection, section, renderers, key);
                existingSections.delete(key);
            } else {
                // 创建新 section
                const newSection = createSection(key, section, renderers);
                mainContent.appendChild(newSection);
            }
        });

        // 移除不再需要的 sections（静态 SEO 内容）
        existingSections.forEach((section, key) => {
            if (section.classList.contains('static-content')) {
                section.style.opacity = '0';
                setTimeout(() => section.remove(), 300);
            }
        });

        // 首次加载：滚动到顶部
        if (isFirstLoad) {
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'instant' });
                isFirstLoad = false;
            }, 50);
        } else {
            // 语言切换：保持滚动位置
            window.scrollTo({ top: scrollY, behavior: 'instant' });
        }
    }

    // 更新 section 内容
    function updateSectionContent(section, data, renderers, key) {
        // 更新标题和链接图标
        const titleContainer = section.querySelector('.section-title-container');
        if (titleContainer) {
            const title = titleContainer.querySelector('.section-heading, h2');
            if (title) {
                title.textContent = data.title;
            }
        } else {
            // 如果还没有容器，需要重建标题结构
            const oldTitle = section.querySelector('.section-heading, h2');
            if (oldTitle) {
                const newTitleContainer = createTitleWithLink(data.title, key);
                oldTitle.replaceWith(newTitleContainer);
            }
        }

        // 渲染内容
        const contentElement = renderSectionContent(data, renderers, key);
        if (!contentElement) return;

        // 查找内容容器
        let contentContainer = section.querySelector('.section-content');
        if (!contentContainer) {
            // 如果没有专门的内容容器，使用整个 section（但跳过标题）
            const children = Array.from(section.children);
            children.forEach((child, index) => {
                if (index > 0) child.remove(); // 保留第一个元素（标题）
            });
            section.appendChild(contentElement);
        } else {
            // 淡出旧内容
            contentContainer.style.opacity = '0';
            setTimeout(() => {
                contentContainer.replaceWith(contentElement);
                contentElement.style.opacity = '0';
                setTimeout(() => {
                    contentElement.style.opacity = '1';
                }, 50);
            }, 150);
        }

        // 移除静态内容标记
        section.classList.remove('static-content');
        section.style.opacity = '1';
    }

    // 创建标题和链接图标
    function createTitleWithLink(titleText, sectionKey) {
        const titleContainer = document.createElement('div');
        titleContainer.className = 'section-title-container flex items-center mb-6 group';

        const title = document.createElement('h2');
        title.className = 'section-heading text-2xl font-bold';
        title.textContent = titleText;

        const linkIcon = document.createElement('a');
        linkIcon.href = `#${sectionKey}`;
        linkIcon.className = 'section-link-icon ml-2 text-gray-400 hover:text-[#2c4f7c] dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200';
        linkIcon.innerHTML = '🔗';
        linkIcon.setAttribute('aria-label', 'Copy section link');
        linkIcon.title = 'Copy link to this section';

        linkIcon.addEventListener('click', (e) => {
            e.preventDefault();
            const currentLang = window.INITIAL_LANG || 'zh';
            const url = `${window.location.origin}/${currentLang}#${sectionKey}`;

            navigator.clipboard.writeText(url).then(() => {
                // 显示复制成功提示
                const originalContent = linkIcon.innerHTML;
                linkIcon.innerHTML = '✓';
                linkIcon.classList.add('text-green-500', 'dark:text-green-400');
                setTimeout(() => {
                    linkIcon.innerHTML = originalContent;
                    linkIcon.classList.remove('text-green-500', 'dark:text-green-400');
                }, 2000);
            }).catch(err => {
                console.error('Failed to copy link:', err);
            });
        });

        titleContainer.appendChild(title);
        titleContainer.appendChild(linkIcon);

        return titleContainer;
    }

    // 创建新 section
    function createSection(key, data, renderers) {
        const section = document.createElement('section');
        section.id = key;
        section.className = 'fade-in bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6';
        section.style.opacity = '0';
        section.style.transition = 'opacity 0.3s ease';

        // 创建标题和链接图标
        const titleContainer = createTitleWithLink(data.title, key);
        section.appendChild(titleContainer);

        // 渲染内容
        const contentElement = renderSectionContent(data, renderers, key);
        if (contentElement) {
            section.appendChild(contentElement);
        }

        // 淡入动画
        setTimeout(() => {
            section.style.opacity = '1';
        }, 50);

        return section;
    }

    // 渲染 section 内容
    function renderSectionContent(data, renderers, key) {
        if (!renderers) return null;

        const renderer = renderers[key];
        if (!renderer) return null;

        const container = document.createElement('div');
        container.className = 'section-content';
        container.style.transition = 'opacity 0.3s ease';

        const content = renderer(data);
        if (content) {
            container.appendChild(content);
        }

        return container;
    }

    // 重置首次加载标记（用于测试）
    function resetFirstLoad() {
        isFirstLoad = true;
    }

    return {
        updateNavigation,
        updateProfile,
        updateSections,
        resetFirstLoad
    };
})();

