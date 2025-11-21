#!/bin/bash

# Caddy 静态网站部署管理脚本
# 使用方法: ./run.sh [install|start|stop|update]

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
WEB_ROOT="/var/www/html"
CADDY_CONFIG="/etc/caddy/Caddyfile"
CURRENT_DIR=$(pwd)

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用 root 权限运行此脚本（sudo ./run.sh ...）"
        exit 1
    fi
}

# 检查系统类型
check_system() {
    if [ -f /etc/debian_version ]; then
        print_info "检测到 Debian/Ubuntu 系统"
        return 0
    else
        print_error "此脚本仅支持 Debian/Ubuntu 系统"
        exit 1
    fi
}

# 安装 Caddy
install_caddy() {
    check_root
    check_system

    print_info "开始安装 Caddy..."

    # 检查是否已安装
    if command -v caddy &> /dev/null; then
        print_warning "Caddy 已安装，版本: $(caddy version)"
        read -p "是否重新安装？(y/N): " reinstall
        if [[ ! $reinstall =~ ^[Yy]$ ]]; then
            print_info "跳过安装步骤"
            return 0
        fi
    fi

    # 安装依赖
    print_info "安装依赖包..."
    apt-get update -qq
    apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl

    # 添加 Caddy 官方仓库
    print_info "添加 Caddy 官方仓库..."
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list

    # 安装 Caddy
    print_info "安装 Caddy..."
    apt-get update -qq
    apt-get install -y caddy

    print_info "Caddy 安装完成！版本: $(caddy version)"

    # 配置 Caddyfile
    configure_caddyfile

    # 创建网站目录
    print_info "创建网站目录..."
    mkdir -p "$WEB_ROOT"
    chown -R caddy:caddy "$WEB_ROOT"

    # 启用但不启动服务
    systemctl enable caddy

    print_info "========================================="
    print_info "Caddy 安装配置完成！"
    print_info "网站目录: $WEB_ROOT"
    print_info "配置文件: $CADDY_CONFIG"
    print_info "========================================="
    print_info "下一步："
    print_info "1. 确保域名已解析到本服务器"
    print_info "2. 运行 'sudo ./run.sh start' 启动服务"
}

# 配置 Caddyfile
configure_caddyfile() {
    print_info "配置 Caddyfile..."

    # 检查项目模板是否存在
    if [ ! -f "$CURRENT_DIR/Caddyfile" ]; then
        print_error "未找到项目 Caddyfile 模板！"
        print_error "请确保 $CURRENT_DIR/Caddyfile 存在"
        exit 1
    fi

    # 获取用户输入的域名
    echo ""
    echo "请输入您的域名（多个域名用空格分隔）："
    echo "示例 1: example.com"
    echo "示例 2: example.com www.example.com"
    echo "如果暂时只想用IP访问，请输入: http://YOUR_SERVER_IP"
    echo ""
    read -p "域名: " domain_input

    if [ -z "$domain_input" ]; then
        print_error "域名不能为空！"
        exit 1
    fi

    # 备份现有配置
    if [ -f "$CADDY_CONFIG" ]; then
        cp "$CADDY_CONFIG" "${CADDY_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
        print_info "已备份现有配置"
    fi

    # 使用项目模板，替换域名占位符
    cp "$CURRENT_DIR/Caddyfile" "$CADDY_CONFIG"
    sed -i "s/DOMAIN_PLACEHOLDER/$domain_input/g" "$CADDY_CONFIG"

    # 创建日志目录
    mkdir -p /var/log/caddy
    chown -R caddy:caddy /var/log/caddy

    print_info "Caddyfile 配置完成"
    print_info "配置的域名: $domain_input"

    # 验证配置
    if caddy validate --config "$CADDY_CONFIG" &> /dev/null; then
        print_info "配置文件验证通过 ✓"
    else
        print_error "配置文件验证失败！"
        caddy validate --config "$CADDY_CONFIG"
        exit 1
    fi
}

# 启动服务
start_service() {
    check_root

    print_info "准备启动 Caddy 服务..."

    # 检查 Caddy 是否已安装
    if ! command -v caddy &> /dev/null; then
        print_error "Caddy 未安装！请先运行: sudo ./run.sh install"
        exit 1
    fi

    # 复制文件
    print_info "复制网站文件到 $WEB_ROOT ..."

    # 排除脚本自身、隐藏文件和 Caddyfile（Caddyfile 在 /etc/caddy/ 中管理）
    rsync -av --progress \
        --exclude="$(basename "$0")" \
        --exclude=".git" \
        --exclude=".gitignore" \
        --exclude="*.sh" \
        --exclude="Caddyfile" \
        "$CURRENT_DIR/" "$WEB_ROOT/"

    # 设置权限
    chown -R caddy:caddy "$WEB_ROOT"
    chmod -R 755 "$WEB_ROOT"

    print_info "文件复制完成"

    # 注入版本号用于缓存控制
    print_info "注入版本号..."
    VERSION=$(date +%Y%m%d%H%M%S)
    sed -i "s/BUILD_VERSION/$VERSION/g" "$WEB_ROOT/index.html"
    print_info "版本号: $VERSION"

    # 确保日志目录存在且权限正确
    print_info "检查日志目录..."
    mkdir -p /var/log/caddy
    chown -R caddy:caddy /var/log/caddy
    chmod -R 755 /var/log/caddy

    # 检查配置文件
    if [ ! -f "$CADDY_CONFIG" ]; then
        print_error "Caddyfile 不存在！请先运行 install 命令"
        exit 1
    fi

    # 验证配置
    print_info "验证 Caddy 配置..."
    if ! caddy validate --config "$CADDY_CONFIG"; then
        print_error "配置文件验证失败！"
        exit 1
    fi

    # 重启服务
    print_info "启动 Caddy 服务..."
    systemctl restart caddy

    # 等待服务启动
    sleep 2

    # 检查服务状态
    if systemctl is-active --quiet caddy; then
        print_info "========================================="
        print_info "✓ Caddy 服务启动成功！"
        print_info "========================================="
        print_info "服务状态："
        systemctl status caddy --no-pager -l | head -n 10
        echo ""
        print_info "查看实时日志: sudo journalctl -u caddy -f"
        print_info "访问日志位置: /var/log/caddy/access.log"

        # 显示配置的域名
        print_info "配置的域名："
        grep -E "^[^#].*\{" "$CADDY_CONFIG" | sed 's/ {//'
    else
        print_error "Caddy 服务启动失败！"
        print_error "错误日志："
        journalctl -u caddy -n 20 --no-pager
        exit 1
    fi
}

# 停止服务
stop_service() {
    check_root

    print_info "停止 Caddy 服务..."

    if systemctl is-active --quiet caddy; then
        systemctl stop caddy
        print_info "✓ Caddy 服务已停止"
    else
        print_warning "Caddy 服务未在运行"
    fi
}

# 更新网站文件
update_files() {
    check_root

    print_info "更新网站文件..."

    if [ ! -d "$WEB_ROOT" ]; then
        print_error "网站目录 $WEB_ROOT 不存在！"
        exit 1
    fi

    # 备份当前文件
    backup_dir="${WEB_ROOT}.backup.$(date +%Y%m%d_%H%M%S)"
    print_info "备份当前文件到 $backup_dir ..."
    cp -r "$WEB_ROOT" "$backup_dir"

    # 复制新文件
    print_info "复制新文件..."
    rsync -av --progress \
        --exclude="$(basename "$0")" \
        --exclude=".git" \
        --exclude=".gitignore" \
        --exclude="*.sh" \
        --exclude="Caddyfile" \
        "$CURRENT_DIR/" "$WEB_ROOT/"

    # 设置权限
    chown -R caddy:caddy "$WEB_ROOT"
    chmod -R 755 "$WEB_ROOT"

    print_info "文件更新完成"

    # 注入版本号用于缓存控制
    print_info "注入版本号..."
    VERSION=$(date +%Y%m%d%H%M%S)
    sed -i "s/BUILD_VERSION/$VERSION/g" "$WEB_ROOT/index.html"
    print_info "版本号: $VERSION"

    # 更新 Caddyfile
    print_info "更新 Caddyfile 配置..."

    if [ ! -f "$CURRENT_DIR/Caddyfile" ]; then
        print_warning "未找到项目 Caddyfile 模板，跳过配置更新"
    elif [ ! -f "$CADDY_CONFIG" ]; then
        print_warning "系统 Caddyfile 不存在，请先运行 install 命令"
    else
        # 提取当前配置的域名（从现有 Caddyfile 第一行域名配置）
        current_domain=$(grep -E "^[a-zA-Z0-9].*\{" "$CADDY_CONFIG" | head -n 1 | sed 's/ {//')

        if [ -z "$current_domain" ]; then
            print_warning "无法从现有配置中提取域名"
            print_info "请手动更新 Caddyfile 或重新运行 install 命令"
        else
            print_info "检测到当前域名: $current_domain"

            # 备份现有配置
            cp "$CADDY_CONFIG" "${CADDY_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
            print_info "已备份现有 Caddyfile"

            # 使用项目模板更新 Caddyfile
            cp "$CURRENT_DIR/Caddyfile" "$CADDY_CONFIG"
            sed -i "s/DOMAIN_PLACEHOLDER/$current_domain/g" "$CADDY_CONFIG"

            # 验证配置
            if caddy validate --config "$CADDY_CONFIG" &> /dev/null; then
                print_info "✓ Caddyfile 配置验证通过"
            else
                print_error "Caddyfile 配置验证失败！正在恢复备份..."
                latest_backup=$(ls -t "${CADDY_CONFIG}.backup."* 2>/dev/null | head -n 1)
                if [ -n "$latest_backup" ]; then
                    cp "$latest_backup" "$CADDY_CONFIG"
                    print_info "已恢复备份配置"
                fi
                caddy validate --config "$CADDY_CONFIG"
                exit 1
            fi
        fi
    fi

    # 如果服务正在运行，重新加载配置
    if systemctl is-active --quiet caddy; then
        print_info "重新加载 Caddy 配置..."
        systemctl reload caddy
        sleep 1

        # 检查重新加载是否成功
        if systemctl is-active --quiet caddy; then
            print_info "✓ Caddy 配置已重新加载"
        else
            print_error "Caddy 重新加载失败！"
            journalctl -u caddy -n 20 --no-pager
            exit 1
        fi
    else
        print_warning "Caddy 服务未运行，文件已更新但服务未重启"
        print_info "运行 'sudo ./run.sh start' 来启动服务"
    fi
}

# 显示帮助信息
show_help() {
    cat <<EOF
Caddy 静态网站部署管理脚本

使用方法:
    sudo ./run.sh [命令]

可用命令:
    install     安装并配置 Caddy（首次使用必须运行）
    start       复制网站文件并启动 Caddy 服务
    stop        停止 Caddy 服务
    update      更新网站文件（会自动备份）
    help        显示此帮助信息

示例:
    sudo ./run.sh install
    sudo ./run.sh start
    sudo ./run.sh update
    sudo ./run.sh stop

注意事项:
    - 所有命令都需要 root 权限（使用 sudo）
    - install 命令会提示输入域名
    - 域名必须先解析到本服务器的 IP
    - 网站文件会从当前目录复制到 /var/www/html
    - update 命令会自动备份现有文件

目录说明:
    网站根目录: $WEB_ROOT
    配置文件: $CADDY_CONFIG
    日志目录: /var/log/caddy/

查看状态和日志:
    sudo systemctl status caddy
    sudo journalctl -u caddy -f
    sudo tail -f /var/log/caddy/access.log
EOF
}

# 主逻辑
main() {
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi

    case "$1" in
        install)
            install_caddy
            ;;
        start)
            start_service
            ;;
        stop)
            stop_service
            ;;
        update)
            update_files
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# 运行主函数
main "$@"