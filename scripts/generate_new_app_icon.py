import os
from PIL import Image, ImageDraw

SRC_PATH = r"C:\Users\Qaim\.gemini\antigravity-ide\brain\784215da-ae3e-4857-977d-794892ed6bce\.user_uploaded\media_1791213702004.jpg"

if not os.path.exists(SRC_PATH):
    raise FileNotFoundError(f"Source image not found: {SRC_PATH}")

src_img = Image.open(SRC_PATH).convert("RGBA")
w, h = src_img.size

# 1. Base App Icon (1024x1024)
icon_1024 = src_img.copy()
icon_1024.save("assets/icon.png", format="PNG")
print("Saved assets/icon.png")

# Corner background color
BG_COLOR = (42, 81, 180, 255)

# For adaptive icon:
# Safe zone is central 66.6% (72/108 of diameter, or radius ~341px in 1024x1024).
# In the original 1024 image, camera corners are at radius ~450px.
# Scaling by 0.72 brings max radius to ~324px, completely inside the 341px safe circle!
SCALE = 0.74
target_w = int(w * SCALE)
target_h = int(h * SCALE)
scaled_src = src_img.resize((target_w, target_h), Image.Resampling.LANCZOS)

# Create radial mask for smooth blend into background color so there are no hard edges
mask = Image.new("L", (target_w, target_h), 255)
mask_draw = ImageDraw.Draw(mask)
cx, cy = target_w / 2, target_h / 2
max_radius = min(cx, cy)
for y in range(target_h):
    for x in range(target_w):
        r = ((x - cx)**2 + (y - cy)**2)**0.5
        if r > max_radius * 0.82:
            # smooth feather out
            fade = max(0.0, min(1.0, 1.0 - (r - max_radius * 0.82) / (max_radius * 0.18)))
            mask.putpixel((x, y), int(fade * 255))

scaled_src.putalpha(mask)

# Adaptive Icon (1024x1024)
adaptive_icon = Image.new("RGBA", (1024, 1024), BG_COLOR)
offset_x = (1024 - target_w) // 2
offset_y = (1024 - target_h) // 2
adaptive_icon.paste(scaled_src, (offset_x, offset_y), scaled_src)
adaptive_icon.save("assets/adaptive-icon.png", format="PNG")
print("Saved assets/adaptive-icon.png")

# Foreground layer for Android adaptive icon (transparent background with centered logo)
fg_1024 = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
fg_1024.paste(scaled_src, (offset_x, offset_y), scaled_src)
fg_1024.save("assets/android-icon-foreground.png", format="PNG")
print("Saved assets/android-icon-foreground.png")

# Background layer
bg_1024 = Image.new("RGBA", (1024, 1024), BG_COLOR)
bg_1024.save("assets/android-icon-background.png", format="PNG")
print("Saved assets/android-icon-background.png")

# Favicon
favicon = adaptive_icon.resize((48, 48), Image.Resampling.LANCZOS)
favicon.save("assets/favicon.png", format="PNG")
print("Saved assets/favicon.png")

# Android native mipmaps
MIPMAPS = [
    ("mipmap-mdpi", 48, 108),
    ("mipmap-hdpi", 72, 162),
    ("mipmap-xhdpi", 96, 216),
    ("mipmap-xxhdpi", 144, 324),
    ("mipmap-xxxhdpi", 192, 432),
]

for folder, legacy_size, adaptive_size in MIPMAPS:
    target_dir = os.path.join("android", "app", "src", "main", "res", folder)
    os.makedirs(target_dir, exist_ok=True)
    
    # 1. ic_launcher.webp (legacy square/rounded)
    legacy = adaptive_icon.resize((legacy_size, legacy_size), Image.Resampling.LANCZOS)
    legacy.save(os.path.join(target_dir, "ic_launcher.webp"), format="WEBP", quality=95)
    
    # 2. ic_launcher_round.webp (legacy circular)
    round_mask = Image.new("L", (legacy_size, legacy_size), 0)
    round_draw = ImageDraw.Draw(round_mask)
    round_draw.ellipse((0, 0, legacy_size, legacy_size), fill=255)
    round_icon = legacy.copy()
    round_icon.putalpha(round_mask)
    round_icon.save(os.path.join(target_dir, "ic_launcher_round.webp"), format="WEBP", quality=95)
    
    # 3. ic_launcher_foreground.webp (adaptive foreground)
    fg_adaptive = fg_1024.resize((adaptive_size, adaptive_size), Image.Resampling.LANCZOS)
    fg_adaptive.save(os.path.join(target_dir, "ic_launcher_foreground.webp"), format="WEBP", quality=95)
    
    # 4. ic_launcher_background.webp (adaptive background)
    bg_adaptive = bg_1024.resize((adaptive_size, adaptive_size), Image.Resampling.LANCZOS)
    bg_adaptive.save(os.path.join(target_dir, "ic_launcher_background.webp"), format="WEBP", quality=95)

print("All Android native mipmaps successfully generated!")
