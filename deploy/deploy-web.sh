#!/bin/bash
set -e

# ============================================================
# 前端部署脚本
# 由 GitHub Actions 调用，也可在服务器上手动执行
# 用法：./deploy-web.sh /opt/app/releases/web-xxx.tar.gz
# ============================================================

APP_DIR="/opt/app"
RELEASES_DIR="$APP_DIR/releases"
WEB_DIR="$APP_DIR/web"
CURRENT_DIR="$WEB_DIR/current"
BACKUP_DIR="$WEB_DIR/backup/$(date +%Y%m%d-%H%M%S)"

TAR_FILE="${1:-}"
if [ -z "$TAR_FILE" ]; then
    # 如果没有传参数，默认使用 releases 目录最新的 web 包
    TAR_FILE=$(ls -t "$RELEASES_DIR"/web-*.tar.gz 2>/dev/null | head -n 1)
    if [ -z "$TAR_FILE" ]; then
        echo "错误：未找到 web 压缩包，请传入路径或确保 $RELEASES_DIR 目录存在 web-*.tar.gz"
        exit 1
    fi
fi

if [ ! -f "$TAR_FILE" ]; then
    echo "错误：压缩包不存在：$TAR_FILE"
    exit 1
fi

VERSION=$(basename "$TAR_FILE" .tar.gz)
EXTRACT_DIR="$RELEASES_DIR/$VERSION"

echo "========================================"
echo "开始部署前端：$VERSION"
echo "========================================"

# 1. 解压新版本
mkdir -p "$EXTRACT_DIR"
tar -xzf "$TAR_FILE" -C "$EXTRACT_DIR" --strip-components=1

# 2. 检查目录结构
if [ ! -d "$EXTRACT_DIR/admin" ] || [ ! -d "$EXTRACT_DIR/mall" ]; then
    echo "错误：压缩包中缺少 admin 或 mall 目录"
    exit 1
fi

# 3. 备份当前版本
if [ -d "$CURRENT_DIR" ]; then
    echo "备份当前版本到 $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
    cp -a "$CURRENT_DIR"/. "$BACKUP_DIR"/ || true
fi

# 4. 切换版本
mkdir -p "$WEB_DIR"
rm -rf "$CURRENT_DIR"
ln -sfn "$EXTRACT_DIR" "$CURRENT_DIR"

# 5. 设置权限（使用 /opt/app 的属主，避免 SSH 用户和运行用户不一致）
APP_OWNER=$(stat -c '%U' "$APP_DIR" 2>/dev/null || echo "root")
APP_GROUP=$(stat -c '%G' "$APP_DIR" 2>/dev/null || echo "root")
chown -R "$APP_OWNER:$APP_GROUP" "$CURRENT_DIR"

# 6. 重新加载 Nginx
if systemctl is-active --quiet nginx; then
    echo "重新加载 Nginx..."
    sudo nginx -t && sudo systemctl reload nginx
else
    echo "Nginx 未运行，跳过 reload"
fi

echo "========================================"
echo "前端部署完成：$VERSION"
echo "========================================"
