#!/usr/bin/env python3
"""
根据 mall 主题生成移动端应用图标。
主题色: #4f6ef7 (来自 apps/projects/mall/public/favicon.svg)
图标: 白色购物袋
"""
from PIL import Image, ImageDraw

THEME_COLOR = (79, 110, 247)  # #4f6ef7
WHITE = (255, 255, 255)


def draw_shopping_bag(draw, cx, cy, scale, color, width=2.2):
    """
    绘制购物袋图标，基于 favicon.svg:
    - 主体: M8 12 h16 l-2 12 H10 L8 12 z
    - 提手: M12 12 V9 a4 4 0 0 1 8 0 v3
    原 viewBox 为 32x32。
    """
    # 主体梯形
    top_left = (cx - 8 * scale, cy - 4 * scale)
    top_right = (cx + 8 * scale, cy - 4 * scale)
    bottom_right = (cx + 6 * scale, cy + 8 * scale)
    bottom_left = (cx - 6 * scale, cy + 8 * scale)
    draw.line([top_left, top_right, bottom_right, bottom_left, top_left], fill=color, width=int(width * scale))

    # 提手
    handle_left = (cx - 4 * scale, cy - 4 * scale)
    handle_top = (cx - 4 * scale, cy - 7 * scale)
    handle_right_top = (cx + 4 * scale, cy - 7 * scale)
    handle_right = (cx + 4 * scale, cy - 4 * scale)
    draw.line([handle_left, handle_top], fill=color, width=int(width * scale))
    draw.arc(
        [handle_top[0], handle_top[1] - 4 * scale, handle_right_top[0], handle_right_top[1] + 4 * scale],
        start=180, end=0, fill=color, width=int(width * scale)
    )
    draw.line([handle_right_top, handle_right], fill=color, width=int(width * scale))


def create_app_icon(size=1024, radius_ratio=6 / 32):
    """生成普通应用图标 (圆角矩形背景 + 购物袋)"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 圆角矩形背景
    radius = int(size * radius_ratio)
    draw.rounded_rectangle([0, 0, size, size], radius=radius, fill=THEME_COLOR)

    # 白色购物袋，居中，scale 根据画布大小调整
    scale = size / 32 * 0.55
    cx, cy = size // 2, size // 2 + int(size * 0.02)
    draw_shopping_bag(draw, cx, cy, scale, WHITE, width=2.2)

    return img


def create_adaptive_icon_foreground(size=1024):
    """生成自适应图标前景 (透明背景 + 购物袋)"""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    scale = size / 32 * 0.55
    cx, cy = size // 2, size // 2 + int(size * 0.02)
    draw_shopping_bag(draw, cx, cy, scale, WHITE, width=2.2)

    return img


def create_splash_icon(size=(1284, 2778)):
    """生成启动屏图标 (全屏背景 + 居中购物袋)"""
    w, h = size
    img = Image.new("RGBA", (w, h), THEME_COLOR + (255,))
    draw = ImageDraw.Draw(img)

    # 购物袋居中，尺寸比应用图标稍小
    scale = w / 32 * 0.35
    cx, cy = w // 2, h // 2
    draw_shopping_bag(draw, cx, cy, scale, WHITE, width=2.2)

    return img


def main():
    icon = create_app_icon(1024)
    icon.save("../assets/icon.png", "PNG")

    adaptive = create_adaptive_icon_foreground(1024)
    adaptive.save("../assets/adaptive-icon.png", "PNG")

    splash = create_splash_icon((1284, 2778))
    splash.save("../assets/splash-icon.png", "PNG")

    print("Icons generated successfully.")


if __name__ == "__main__":
    main()
