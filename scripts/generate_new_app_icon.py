import os
import numpy as np
from PIL import Image, ImageDraw

SRC_PATH = r"C:\Users\Qaim\.gemini\antigravity-ide\brain\784215da-ae3e-4857-977d-794892ed6bce\.user_uploaded\media_1791224072186.jpg"

if not os.path.exists(SRC_PATH):
    raise FileNotFoundError(f"Source image not found: {SRC_PATH}")

src_img = Image.open(SRC_PATH).convert("RGBA")
w, h = src_img.size

# 1. Base App Icon (1024x1024)
src_img.save("assets/icon.png", format="PNG")
print("Saved assets/icon.png")

# 2. Smooth Background Gradient from 4 corners
W, H = 1024, 1024
tl = np.array([253, 215, 82], dtype=float)   # Yellow
tr = np.array([252, 46, 118], dtype=float)   # Pink/Magenta
bl = np.array([255, 56, 128], dtype=float)   # Magenta/Red
br = np.array([80, 80, 210], dtype=float)    # Royal Blue

u = np.linspace(0, 1, W)[None, :, None]
v = np.linspace(0, 1, H)[:, None, None]
bg = (1 - v) * ((1 - u) * tl + u * tr) + v * ((1 - u) * bl + u * br)
bg_1024 = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8)).convert("RGBA")
bg_1024.save("assets/android-icon-background.png", format="PNG")
print("Saved assets/android-icon-background.png")

# 3. Extract crisp white logo with antialiasing for Foreground Layer
arr = np.array(src_img, dtype=float)
min_rgb = np.min(arr[:, :, :3], axis=2)
alpha = np.clip((min_rgb - 160.0) / (230.0 - 160.0), 0.0, 1.0) * 255.0

fg_arr = np.zeros((1024, 1024, 4), dtype=np.uint8)
fg_arr[:, :, :3] = 255
fg_arr[:, :, 3] = alpha.astype(np.uint8)
fg_base = Image.fromarray(fg_arr, mode="RGBA")

# Safe zone scale (0.67 brings 752px box down to ~503px, well inside 682px safe diameter)
SCALE = 0.67
tw, th = int(1024 * SCALE), int(1024 * SCALE)
fg_scaled = fg_base.resize((tw, th), Image.Resampling.LANCZOS)

fg_1024 = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
ox = (1024 - tw) // 2
oy = (1024 - th) // 2
fg_1024.paste(fg_scaled, (ox, oy), fg_scaled)
fg_1024.save("assets/android-icon-foreground.png", format="PNG")
print("Saved assets/android-icon-foreground.png")

# Monochrome icon (for Material You themed icons)
fg_1024.save("assets/android-icon-monochrome.png", format="PNG")
print("Saved assets/android-icon-monochrome.png")

# 4. Composite Adaptive Icon
adaptive_icon = Image.alpha_composite(bg_1024, fg_1024)
adaptive_icon.save("assets/adaptive-icon.png", format="PNG")
print("Saved assets/adaptive-icon.png")

# 5. Favicon
favicon = adaptive_icon.resize((48, 48), Image.Resampling.LANCZOS)
favicon.save("assets/favicon.png", format="PNG")
print("Saved assets/favicon.png")

# 6. Android Native Mipmaps
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

    # 5. ic_launcher_monochrome.webp (adaptive monochrome)
    fg_adaptive.save(os.path.join(target_dir, "ic_launcher_monochrome.webp"), format="WEBP", quality=95)

print("All Android native mipmaps successfully generated!")
