/**
 * Error Handler - 错误收集器
 * 收集错误信息，供消息中心使用
 */

window.ErrorHandler = (function() {
    'use strict';

    const errors = [];
    const MAX_ERRORS = 10; // 最多保留 10 条错误

    // 收集错误
    function collect(error) {
        const time = new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const errorInfo = {
            time,
            message: error.message || String(error),
            timestamp: Date.now()
        };

        errors.unshift(errorInfo);

        // 限制数量
        if (errors.length > MAX_ERRORS) {
            errors.pop();
        }

        console.error('Error collected:', error);
    }

    // 获取所有错误
    function getErrors() {
        return [...errors];
    }

    // 清空错误
    function clear() {
        errors.length = 0;
    }

    // 显示致命错误页面（只在完全无法恢复时使用）
    function showFatalError(error) {
        console.error('Fatal error:', error);
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif;">
                <div style="text-align: center; padding: 2rem;">
                    <h1 style="color: #e53e3e; margin-bottom: 1rem;">资源加载失败 / Resource Loading Failed</h1>
                    <p style="color: #718096; margin-bottom: 1rem;">页面资源加载出现错误，请刷新页面重试</p>
                    <p style="color: #718096; margin-bottom: 2rem;">An error occurred while loading page resources, please refresh and try again</p>
                    <button onclick="location.reload()" style="padding: 0.5rem 2rem; background: #2c4f7c; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem;">
                        刷新页面 / Refresh Page
                    </button>
                </div>
            </div>
        `;
    }

    return {
        collect,
        getErrors,
        clear,
        showFatalError
    };
})();

