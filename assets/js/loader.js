/**
 * Resource Loader with Version Control and Smart Language Detection
 * 资源加载器：版本控制 + 智能语言检测 + 按需加载
 */

(function() {
    'use strict';

    // 读取版本号（从 meta 标签）
    const getVersion = () => {
        const meta = document.querySelector('meta[name="assets-version"]');
        return meta ? meta.content : Date.now();
    };

    const VERSION = getVersion();

    // 检测用户语言偏好
    // 优先级: URL 路径 > localStorage > URL 参数 > 浏览器语言 > 默认中文
    const detectLanguage = () => {
        // 1. 检查 URL 路径（最高优先级）
        const path = window.location.pathname;
        if (path === '/zh' || path.startsWith('/zh/') || path.startsWith('/zh#')) {
            return 'zh';
        }
        if (path === '/en' || path.startsWith('/en/') || path.startsWith('/en#')) {
            return 'en';
        }

        // 2. 检查 localStorage
        const saved = localStorage.getItem('language');
        if (saved && (saved === 'zh' || saved === 'en')) {
            return saved;
        }

        // 3. 检查 URL 参数（保持向后兼容）
        const urlParams = new URLSearchParams(window.location.search);
        const urlLang = urlParams.get('lang');
        if (urlLang && (urlLang === 'zh' || urlLang === 'en')) {
            return urlLang;
        }

        // 4. 检查浏览器语言
        const browserLang = navigator.language || navigator.userLanguage;
        if (browserLang) {
            if (browserLang.toLowerCase().startsWith('zh')) {
                return 'zh';
            }
            if (browserLang.toLowerCase().startsWith('en')) {
                return 'en';
            }
        }

        // 5. 默认中文
        return 'zh';
    };

    // 动态加载脚本（Promise 化）
    const loadScript = (src) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `${src}?v=${VERSION}`;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load: ${src}`));
            document.head.appendChild(script);
        });
    };

    // 加载特定语言的所有内容文件
    const loadLanguageContent = async (lang) => {
        const contentFiles = [
            'consts',
            'navigation',
            'profile',
            'section_about',
            'section_publications',
            'section_projects',
            'section_honors',
            'section_education',
            'section_experience',
            'section_patents',
            'section_services',
            'section_lab'
        ];

        for (const file of contentFiles) {
            await loadScript(`content/${lang}/${file}.js`);
        }
    };

    // 主加载流程
    const loadResources = async () => {
        // 显示加载指示器
        if (window.LoadingIndicator) {
            window.LoadingIndicator.show();
        }

        try {
            // 检测当前语言
            const currentLang = detectLanguage();

            // 将初始语言存储到全局，供后续使用
            window.INITIAL_LANG = currentLang;
            window.LOADED_LANGUAGES = new Set([currentLang]);

            // 加载基础层
            await loadScript('assets/js/consts.js');
            await loadScript('assets/js/i18n.js');

            // 加载当前语言内容
            await loadLanguageContent(currentLang);

            // 并行加载渲染层
            await Promise.all([
                loadScript('assets/js/section_renderer/honors.js'),
                loadScript('assets/js/section_renderer/markdown.js'),
                loadScript('assets/js/section_renderer/news.js'),
                loadScript('assets/js/section_renderer/patents.js'),
                loadScript('assets/js/section_renderer/periods.js'),
                loadScript('assets/js/section_renderer/projects.js'),
                loadScript('assets/js/section_renderer/publications.js'),
                loadScript('assets/js/section_renderer/talks.js')
            ]);

            // 加载启动层
            await loadScript('assets/js/main.js');

            // 暴露懒加载函数供 main.js 使用
            window.loadLanguageContent = loadLanguageContent;

            // 加载成功，隐藏指示器
            if (window.LoadingIndicator) {
                window.LoadingIndicator.success();
            }

        } catch (error) {
            // 收集错误
            if (window.ErrorHandler) {
                window.ErrorHandler.collect(error);
            } else {
                console.error('Resource loading failed:', error);
            }

            // 显示错误指示器
            if (window.LoadingIndicator) {
                window.LoadingIndicator.error();
            }

            // 如果是致命错误（多个关键资源加载失败），显示错误页面
            const errorCount = window.ErrorHandler ? window.ErrorHandler.getErrors().length : 0;
            if (errorCount > 10) {
                if (window.ErrorHandler) {
                    window.ErrorHandler.showFatalError(error);
                }
            }
        }
    };

    // 等待 DOM 准备就绪后开始加载
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadResources);
    } else {
        loadResources();
    }

})();

