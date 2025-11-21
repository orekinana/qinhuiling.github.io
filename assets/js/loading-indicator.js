/**
 * Loading Indicator & Message Center
 * 加载指示器 + 消息中心
 *
 * 设计原则：
 * - 不显眼，不打扰用户
 * - 只在需要时才引起注意
 * - 优雅的渐入渐出
 */

window.LoadingIndicator = (function() {
    'use strict';

    let container = null;
    let spinner = null;
    let messageCenter = null;
    let timeout = null;
    const TIMEOUT_MS = 3 * 60 * 1000; // 3 分钟

    // 初始化 DOM
    function init() {
        if (container) return;

        // 确保 body 已加载
        if (!document.body) {
            setTimeout(init, 10);
            return;
        }

        // 创建容器 - 插入到导航栏中，语言按钮左侧
        const navControls = document.querySelector('nav .flex.items-center.space-x-3');
        if (!navControls) {
            console.warn('LoadingIndicator: Navigation controls not found');
            return;
        }

        // 创建容器
        container = document.createElement('div');
        container.id = 'loading-indicator';
        container.className = 'loading-indicator-container';
        container.style.cssText = 'opacity: 0; transition: opacity 0.3s ease;';

        // 创建指示器圆点（同时用于加载和错误状态）
        spinner = document.createElement('div');
        spinner.className = 'indicator-dot';
        spinner.style.cssText = 'display: none;';

        // 创建错误提示框（悬停显示）
        messageCenter = document.createElement('div');
        messageCenter.className = 'error-tooltip-wrapper';
        messageCenter.style.cssText = 'display: none;';
        messageCenter.innerHTML = '<div class="error-tooltip"></div>';

        container.appendChild(spinner);
        container.appendChild(messageCenter);

        // 插入到语言按钮之前
        navControls.insertBefore(container, navControls.firstChild);

        // 添加样式
        injectStyles();

        // 设置交互
        setupInteractions();
    }

    // 注入样式
    function injectStyles() {
        if (document.getElementById('loading-indicator-styles')) return;

        const style = document.createElement('style');
        style.id = 'loading-indicator-styles';
        style.textContent = `
            /* 容器 */
            .loading-indicator-container {
                position: relative;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                margin-right: 12px;
            }

            /* 指示器圆点 */
            .indicator-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #2c4f7c;
                cursor: default;
                transition: all 0.3s ease;
            }

            /* 加载中动画 */
            .indicator-dot.loading {
                animation: pulse-loading 1.8s ease-in-out infinite;
            }

            @keyframes pulse-loading {
                0%, 100% {
                    opacity: 0.4;
                    transform: scale(0.85);
                }
                50% {
                    opacity: 1;
                    transform: scale(1.15);
                }
            }

            /* 错误状态 */
            .indicator-dot.error {
                background: #F59E0B;
                opacity: 0.7;
                cursor: pointer;
                animation: none;
            }

            .indicator-dot.error:hover {
                opacity: 0.9;
                transform: scale(1.1);
            }

            /* 深色模式调整 */
            .dark .indicator-dot {
                background: #60A5FA;
            }

            .dark .indicator-dot.error {
                background: #FBBF24;
            }

            /* 错误提示框容器 */
            .error-tooltip-wrapper {
                position: absolute;
                top: calc(100% + 12px);
                left: 50%;
                transform: translateX(-50%);
                z-index: 1000;
                pointer-events: none;
            }

            .error-tooltip-wrapper > * {
                pointer-events: auto;
            }

            /* 错误提示框 */
            .error-tooltip {
                min-width: 320px;
                max-width: 420px;
                background: white;
                border: 1px solid #E5E7EB;
                border-radius: 12px;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                animation: tooltip-slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            }

            @keyframes tooltip-slide-in {
                from {
                    opacity: 0;
                    transform: translateY(-8px) scale(0.96);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            .error-tooltip.hiding {
                animation: tooltip-slide-out 0.2s cubic-bezier(0.4, 0, 1, 1) forwards;
            }

            @keyframes tooltip-slide-out {
                from {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateY(-8px) scale(0.96);
                }
            }

            .dark .error-tooltip {
                background: #1F2937;
                border-color: #374151;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
            }

            /* 提示框标题 */
            .error-tooltip-header {
                padding: 12px 16px;
                border-bottom: 1px solid #F3F4F6;
                font-size: 13px;
                font-weight: 600;
                color: #374151;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .dark .error-tooltip-header {
                border-color: #374151;
                color: #E5E7EB;
            }

            .error-tooltip-icon {
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: #FEF3C7;
                color: #F59E0B;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
            }

            .dark .error-tooltip-icon {
                background: rgba(251, 191, 36, 0.2);
                color: #FBBF24;
            }

            /* 错误列表 */
            .error-list {
                max-height: 280px;
                overflow-y: auto;
            }

            .error-item {
                padding: 12px 16px;
                border-bottom: 1px solid #F9FAFB;
                display: flex;
                gap: 10px;
                transition: background 0.15s ease;
            }

            .error-item:hover {
                background: #F9FAFB;
            }

            .error-item:last-child {
                border-bottom: none;
            }

            .dark .error-item {
                border-color: #2D3748;
            }

            .dark .error-item:hover {
                background: #2D3748;
            }

            .error-item-indicator {
                width: 6px;
                height: 6px;
                border-radius: 50%;
                background: #FCA5A5;
                margin-top: 6px;
                flex-shrink: 0;
            }

            .dark .error-item-indicator {
                background: #F87171;
            }

            .error-item-content {
                flex: 1;
                min-width: 0;
            }

            .error-item-time {
                font-size: 11px;
                color: #9CA3AF;
                margin-bottom: 4px;
            }

            .error-item-message {
                font-size: 12px;
                color: #6B7280;
                line-height: 1.5;
                word-break: break-word;
            }

            .dark .error-item-message {
                color: #D1D5DB;
            }

            /* 空状态 */
            .error-tooltip-empty {
                padding: 32px 16px;
                text-align: center;
                color: #9CA3AF;
                font-size: 13px;
            }

            /* 移动端适配 */
            @media (max-width: 768px) {
                .error-tooltip-wrapper {
                    position: fixed;
                    top: 64px !important;
                    right: 16px;
                    left: 16px;
                    transform: none;
                    margin-top: 0;
                }

                .error-tooltip {
                    min-width: auto;
                    max-width: none;
                }
            }

            /* 平板和小屏幕桌面 - 防止卡片超出屏幕 */
            @media (min-width: 769px) and (max-width: 1024px) {
                .error-tooltip {
                    min-width: 280px;
                    max-width: 360px;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // 设置交互
    function setupInteractions() {
        let hideTimeout = null;
        let isTooltipVisible = false;

        // 圆点点击/悬停显示错误详情
        spinner.addEventListener('mouseenter', showTooltip);
        spinner.addEventListener('click', showTooltip);

        // 鼠标离开圆点
        spinner.addEventListener('mouseleave', () => {
            hideTimeout = setTimeout(() => {
                if (!isTooltipVisible) {
                    hideTooltip();
                }
            }, 150);
        });

        // 鼠标进入 tooltip
        messageCenter.addEventListener('mouseenter', () => {
            clearTimeout(hideTimeout);
            isTooltipVisible = true;
        });

        // 鼠标离开 tooltip
        messageCenter.addEventListener('mouseleave', () => {
            isTooltipVisible = false;
            hideTimeout = setTimeout(hideTooltip, 150);
        });

        // 移动端：点击外部关闭
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target) && messageCenter.style.display === 'block') {
                hideTooltip();
            }
        });
    }

    // 显示 tooltip
    function showTooltip() {
        if (!spinner.classList.contains('error')) return;

        updateTooltipContent();
        messageCenter.style.display = 'block';

        // 移除可能存在的隐藏动画类
        const tooltip = messageCenter.querySelector('.error-tooltip');
        tooltip.classList.remove('hiding');
    }

    // 隐藏 tooltip
    function hideTooltip() {
        const tooltip = messageCenter.querySelector('.error-tooltip');
        tooltip.classList.add('hiding');

        setTimeout(() => {
            messageCenter.style.display = 'none';
            tooltip.classList.remove('hiding');
        }, 200);
    }

    // 更新 tooltip 内容
    function updateTooltipContent() {
        const tooltip = messageCenter.querySelector('.error-tooltip');
        const errors = window.ErrorHandler ? window.ErrorHandler.getErrors() : [];

        if (errors.length === 0) {
            tooltip.innerHTML = '<div class="error-tooltip-empty">暂无错误 / No errors</div>';
        } else {
            const lang = window.INITIAL_LANG || 'en';
            const title = lang === 'zh' ? '加载错误' : 'Loading Errors';

            tooltip.innerHTML = `
                <div class="error-tooltip-header">
                    <div class="error-tooltip-icon">!</div>
                    <span>${title}</span>
                    <span style="margin-left: auto; font-size: 11px; font-weight: normal; opacity: 0.7;">${errors.length}</span>
                </div>
                <div class="error-list">
                    ${errors.map(err => `
                        <div class="error-item">
                            <div class="error-item-indicator"></div>
                            <div class="error-item-content">
                                <div class="error-item-time">${err.time}</div>
                                <div class="error-item-message">${escapeHtml(err.message)}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    // HTML 转义
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 显示加载动画
    function show() {
        init();
        if (!spinner) return;

        spinner.style.display = 'block';
        spinner.className = 'indicator-dot loading';
        messageCenter.style.display = 'none';
        container.style.opacity = '1';

        // 设置超时
        timeout = setTimeout(() => {
            hide();
        }, TIMEOUT_MS);
    }

    // 加载成功 - 平滑消失
    function success() {
        if (timeout) clearTimeout(timeout);

        container.style.opacity = '0';
        setTimeout(() => {
            if (container && spinner) {
                spinner.style.display = 'none';
                spinner.className = 'indicator-dot';
            }
        }, 300);
    }

    // 加载失败 - 改变颜色和状态
    function error() {
        if (!container) {
            console.error('LoadingIndicator: Container not initialized');
            init();
            return;
        }

        if (timeout) clearTimeout(timeout);

        // 停止加载动画，改变颜色
        spinner.className = 'indicator-dot error';
        spinner.style.display = 'block';
        container.style.opacity = '1';
    }

    // 隐藏
    function hide() {
        if (container) {
            container.style.opacity = '0';
            setTimeout(() => {
                if (spinner) {
                    spinner.style.display = 'none';
                    spinner.className = 'indicator-dot';
                }
                if (messageCenter) {
                    messageCenter.style.display = 'none';
                }
            }, 300);
        }
    }

    return {
        show,
        success,
        error,
        hide
    };
})();

