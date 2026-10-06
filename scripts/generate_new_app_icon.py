import os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC_PATH = r"C:\Users\Qaim\.gemini\antigravity-ide\brain\784215da-ae3e-4857-977d-794892ed6bce\.user_uploaded\media_1791314076617.jpg"

if not os.path.exists(SRC_PATH):
    raise FileNotFoundError(f"Source image not found: {SRC_PATH}")

src_img = Image.open(SRC_PATH).convert("RGBA")
W, H = 1024, 1024

# 1. Base App Icon (1024x1024)
src_img.save("assets/icon.png", format="PNG")
print("Saved assets/icon.png")

# 2. Reconstruct High-Fidelity Split Diagonal Background for Adaptive Icon
y, x = np.mgrid[0:H, 0:W].astype(float)

# Diagonal distance: positive for top-right (x > y), negative for bottom-left (y > x)
diag_dist = (x - y) / np.sqrt(2.0)
mask_tr = np.clip(diag_dist * 0.7 + 0.5, 0.0, 1.0)[:, :, None]

# Radial centers for natural mesh gradient matching the uploaded art:
d_yellow = np.sqrt((x - 980)**2 + (y - 80)**2) / 1000.0
d_magenta = np.sqrt((x - 650)**2 + (y - 400)**2) / 1000.0
d_purple = np.sqrt((x - 150)**2 + (y - 0)**2) / 1000.0
d_blue = np.sqrt((x - 950)**2 + (y - 950)**2) / 1000.0

w_yellow = np.exp(-3.5 * d_yellow**2)
w_magenta = np.exp(-2.5 * d_magenta**2)
w_purple = np.exp(-3.0 * d_purple**2)
w_blue = np.exp(-3.5 * d_blue**2)
total_w = w_yellow + w_magenta + w_purple + w_blue + 1e-6

c_yellow = np.array([254, 212, 92], dtype=float)
c_magenta = np.array([225, 48, 138], dtype=float)
c_purple = np.array([145, 60, 168], dtype=float)
c_blue = np.array([75, 75, 140], dtype=float)

grad_vibrant = (
    w_yellow[:, :, None] * c_yellow +
    w_magenta[:, :, None] * c_magenta +
    w_purple[:, :, None] * c_purple +
    w_blue[:, :, None] * c_blue
) / total_w[:, :, None]

# Charcoal side (bottom-left)
d_graph = np.sqrt((x - 0)**2 + (y - 1023)**2) / 1000.0
w_graph = np.clip(1.0 - d_graph * 1.4, 0.0, 1.0)[:, :, None]
c_graph = np.array([115, 114, 119], dtype=float)
c_deep = np.array([58, 56, 60], dtype=float)
grad_dark = w_graph * c_graph + (1.0 - w_graph) * c_deep

# Composite background
bg = mask_tr * grad_vibrant + (1.0 - mask_tr) * grad_dark
bg_1024 = Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8)).convert("RGBA")
bg_1024.save("assets/android-icon-background.png", format="PNG")
print("Saved assets/android-icon-background.png")

# 3. Extract Crisp White Neon Logo with Anti-aliasing & Drop Shadow for Foreground
arr = np.array(src_img, dtype=float)
min_rgb = np.min(arr[:, :, :3], axis=2)
alpha = np.clip((min_rgb - 160.0) / (230.0 - 160.0), 0.0, 1.0) * 255.0

fg_arr = np.zeros((1024, 1024, 4), dtype=np.uint8)
fg_arr[:, :, :3] = 255
fg_arr[:, :, 3] = alpha.astype(np.uint8)
fg_base = Image.fromarray(fg_arr, mode="RGBA")

# Drop shadow for depth matching original artwork
shadow_mask = fg_base.split()[3].filter(ImageFilter.GaussianBlur(radius=7))
shadow_arr = np.zeros((1024, 1024, 4), dtype=np.uint8)
shadow_arr[:, :, 3] = (np.array(shadow_mask, dtype=float) * 0.45).astype(np.uint8)
shadow_base = Image.fromarray(shadow_arr, mode="RGBA")
fg_combined = Image.alpha_composite(shadow_base, fg_base)

# Safe zone scale (0.68 ensures 429px corner radius fits well within 341px radius circle)
SCALE = 0.68
tw, th = int(1024 * SCALE), int(1024 * SCALE)
fg_scaled = fg_combined.resize((tw, th), Image.Resampling.LANCZOS)

fg_1024 = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
ox = (1024 - tw) // 2
oy = (1024 - th) // 2
fg_1024.paste(fg_scaled, (ox, oy), fg_scaled)
fg_1024.save("assets/android-icon-foreground.png", format="PNG")
print("Saved assets/android-icon-foreground.png")

# Monochrome icon (for Material You themed launcher icons)
fg_mono_scaled = fg_base.resize((tw, th), Image.Resampling.LANCZOS)
fg_mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
fg_mono.paste(fg_mono_scaled, (ox, oy), fg_mono_scaled)
fg_mono.save("assets/android-icon-monochrome.png", format="PNG")
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
    mono_adaptive = fg_mono.resize((adaptive_size, adaptive_size), Image.Resampling.LANCZOS)
    mono_adaptive.save(os.path.join(target_dir, "ic_launcher_monochrome.webp"), format="WEBP", quality=95)

print("All Android native mipmaps successfully generated!")
