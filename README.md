# 学术主页项目 - 内容样式分离架构

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

一个采用**内容-样式分离**设计的现代化学术主页项目，使用纯 HTML+CSS+JS 实现，无需预编译，支持中英文切换、深色模式、响应式设计。

## ✨ 特性

- 🌍 **多语言支持**：中英文切换，支持 `/zh` 和 `/en` URL 路径
- 🎨 **现代化设计**：基于 TailwindCSS，支持深色模式
- 📱 **响应式布局**：完美适配桌面端和移动端
- 🚀 **性能优化**：智能资源加载、缓存控制、版本管理
- 🔗 **便捷分享**：每个 section 都有可复制的链接
- 📝 **内容分离**：内容更新无需关心样式实现
- 🔄 **SEO 友好**：静态内容兜底 + 动态加载增强
- 🛠️ **一键部署**：使用 Caddy 快速部署，自动 HTTPS

## 📁 项目结构

```
qinhuiling-homepage/
├── index.html              # 主页面（包含 SEO 静态内容）
├── Caddyfile              # Caddy 配置模板
├── run.sh                 # 部署管理脚本
│
├── assets/
│   ├── css/
│   │   └── style.css      # 自定义样式
│   ├── js/
│   │   ├── main.js        # 主逻辑
│   │   ├── loader.js      # 资源加载器
│   │   ├── i18n.js        # 国际化配置
│   │   ├── dom-updater.js # DOM 更新器
│   │   └── section_renderer/ # Section 渲染器
│   ├── images/            # 图片资源
│   ├── files/             # 文件资源（PDF等）
│   └── npm/               # 第三方库（本地化）
│
└── content/               # 内容数据（纯数据，与样式分离）
    ├── zh/                # 中文内容
    │   ├── navigation.js
    │   ├── profile.js
    │   ├── section_about.js
    │   ├── section_publications.js
    │   └── ...
    └── en/                # 英文内容
        ├── navigation.js
        ├── profile.js
        └── ...
```

## 🚀 快速开始

### 前置要求

- Ubuntu/Debian 系统
- Root 权限

### 部署步骤

#### 1. 克隆项目

```bash
git clone https://github.com/yourusername/qinhuiling-homepage.git
cd qinhuiling-homepage
```

#### 2. 首次安装

```bash
sudo ./run.sh install
```

根据提示输入域名（如 `example.com` 或 `example.com www.example.com`）

#### 3. 启动服务

```bash
sudo ./run.sh start
```

#### 4. 更新网站

修改内容后，运行：

```bash
sudo ./run.sh update
```

此命令会：
- 备份当前文件
- 复制新文件到网站目录
- 更新 Caddyfile 配置
- 注入新的版本号
- 重新加载 Caddy 配置

#### 5. 停止服务

```bash
sudo ./run.sh stop
```

## 📝 内容更新指南

### 修改个人信息

编辑 `content/zh/profile.js` 和 `content/en/profile.js`：

```javascript
portfolioData.zh.profile = {
    name: "你的名字",
    title: "职位",
    affiliation: "单位",
    bio: "个人简介...",
    contact: {
        email: "your@email.com",
        location: "所在地"
    },
    social: {
        googleScholar: "https://...",
        github: "https://..."
    }
};
```

### 添加论文

编辑 `content/zh/section_publications.js`：

```javascript
portfolioData.zh.sections.publications = {
    title: "代表论文",
    items: [
        {
            type: 'conference',
            title: "论文标题",
            authors: ["作者1", "你的名字", "作者3"],
            venue: "会议名称",
            year: 2024,
            links: {
                pdf: "assets/files/papers/paper.pdf",
                code: "https://github.com/..."
            }
        }
    ]
};
```

### 修改导航栏

编辑 `content/zh/navigation.js`：

```javascript
portfolioData.zh.navigation = [
    { id: "about", label: "个人简介", icon: "fa-user" },
    { id: "publications", label: "代表论文", icon: "fa-book" }
];
```

### 更新完成后

```bash
sudo ./run.sh update
```

就这么简单！无需关心内部实现。

## 🌐 URL 访问方式

支持多种访问方式：

```
https://example.com          → 自动检测语言
https://example.com/zh       → 中文版本
https://example.com/en       → 英文版本
https://example.com/zh#about → 中文 + 跳转到 About section
https://example.com/?lang=zh → 兼容旧的查询参数方式
```

## 🔧 配置说明

### Caddyfile

项目根目录下的 `Caddyfile` 是配置模板，包含：

- ✅ `/zh` 和 `/en` 路径重写
- ✅ 缓存控制策略（HTML 不缓存，静态资源长期缓存）
- ✅ Gzip 压缩
- ✅ 访问日志
- ✅ 自动 HTTPS

执行 `install` 或 `update` 时，`run.sh` 会自动：
1. 从项目复制 `Caddyfile` 到 `/etc/caddy/Caddyfile`
2. 替换域名占位符
3. 验证配置
4. 重新加载 Caddy

### 缓存策略

- **HTML 文件**：`no-cache, must-revalidate`（总是重新验证）
- **JS/CSS/内容文件**：`max-age=300, must-revalidate`（5分钟缓存）
- **第三方库/图片**：`max-age=604800, immutable`（1年缓存）

### 版本控制

每次部署时，`run.sh` 会自动注入时间戳版本号到 `index.html`：

```html
<meta name="assets-version" content="20251121123456">
```

JS 加载器会使用此版本号作为查询参数，确保资源更新。

## 🎨 功能演示

### Section 链接复制

每个 section 标题右侧有 🔗 图标：
- 桌面端：鼠标悬停显示
- 移动端：半透明显示
- 点击复制完整 URL（如 `https://example.com/zh#publications`）
- 复制成功显示 ✓ 提示

### 语言切换

点击顶部导航栏的语言按钮：
- URL 自动更新为 `/zh` 或 `/en`
- 保留当前锚点
- 支持浏览器前进/后退
- 懒加载语言包（首次切换时加载）

## 📊 性能特性

- ✅ **智能加载**：首次只加载当前语言内容
- ✅ **懒加载**：切换语言时按需加载
- ✅ **DOM 优化**：细粒度更新，避免全页面重渲染
- ✅ **滚动保持**：语言切换时保持滚动位置
- ✅ **平滑动画**：淡入淡出过渡效果

## 🛠️ 进阶使用

### 自定义 Section 渲染器

在 `assets/js/section_renderer/` 目录下创建新的渲染器：

```javascript
// custom.js
function customRenderer(section) {
    const div = document.createElement('div');
    div.innerHTML = `<p>${section.content}</p>`;
    return div;
}
```

在 `main.js` 中注册：

```javascript
function getSectionRenderers() {
    return {
        'about': markdownRenderer,
        'custom': customRenderer  // 新增
    };
}
```

### 添加新的 Section

1. 在 `content/zh/section_xxx.js` 中定义数据
2. 在 `navigation.js` 中添加导航项
3. 在 `loader.js` 中添加到加载列表
4. 选择或创建合适的渲染器

## 📋 管理命令

```bash
sudo ./run.sh install   # 首次安装 Caddy 和配置
sudo ./run.sh start     # 启动服务
sudo ./run.sh stop      # 停止服务
sudo ./run.sh update    # 更新网站文件和配置
sudo ./run.sh help      # 显示帮助信息
```

### 查看状态和日志

```bash
sudo systemctl status caddy               # 查看服务状态
sudo journalctl -u caddy -f              # 实时查看系统日志
sudo tail -f /var/log/caddy/access.log   # 实时查看访问日志
```

## 🔒 安全性

- ✅ 自动 HTTPS（Let's Encrypt）
- ✅ 现代化 TLS 配置
- ✅ 安全的请求头
- ✅ 路径重写隔离
- ✅ 日志记录

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📮 联系方式

- 邮箱：qinhuiling@bnu.edu.cn
- 学术主页：https://qinhuiling.me

---

**技术栈**：HTML5 + CSS3 + JavaScript ES6+ + TailwindCSS + Font Awesome + Caddy

**设计理念**：内容与样式分离 · 简单即美 · 开箱即用
