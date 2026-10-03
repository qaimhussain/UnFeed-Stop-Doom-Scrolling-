from PIL import Image, ImageDraw, ImageFont
import math

# Android adaptive icon size: 432x432
SIZE = 432

# 1. Background layer
bg_img = Image.new("RGBA", (SIZE, SIZE), (16, 16, 20, 255))
bg_draw = ImageDraw.Draw(bg_img)
# Subtle inner glow / circle
bg_draw.ellipse([36, 36, SIZE - 36, SIZE - 36], outline=(35, 35, 42, 255), width=2)
bg_img.save("assets/android-icon-background.png")

# 2. Foreground layer: Transparent with gradient "U"
fg_img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))

# Create gradient texture
gradient = Image.new("RGBA", (SIZE, SIZE))
g_draw = ImageDraw.Draw(gradient)

# Instagram gradient colors: #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5
colors = [
    (254, 218, 117), # yellow
    (250, 126, 30),  # orange
    (214, 41, 118),  # magenta
    (150, 47, 191),  # purple
    (79, 91, 213)    # blue
]

for y in range(SIZE):
    for x in range(SIZE):
        # Diagonal ratio
        t = (x + (SIZE - y)) / (2.0 * SIZE)
        t = max(0.0, min(1.0, t))
        idx = t * (len(colors) - 1)
        i = int(idx)
        rem = idx - i
        if i >= len(colors) - 1:
            c = colors[-1]
        else:
            c1 = colors[i]
            c2 = colors[i + 1]
            c = (
                int(c1[0] + (c2[0] - c1[0]) * rem),
                int(c1[1] + (c2[1] - c1[1]) * rem),
                int(c1[2] + (c2[2] - c1[2]) * rem),
                255
            )
        gradient.putpixel((x, y), c)

# Mask for letter "U"
mask = Image.new("L", (SIZE, SIZE), 0)
mask_draw = ImageDraw.Draw(mask)

# Draw bold modern "U" using shapes (safe zone is center 264x264)
# Left stem: x: 140..175, y: 130..250
# Right stem: x: 257..292, y: 130..250
# Bottom arc: connecting both stems
# Or draw arc with width 36
u_left = 138
u_top = 130
u_right = 294
u_bottom = 290
stroke = 38

# Outer arc + inner cutout
mask_draw.rounded_rectangle([u_left, u_top, u_right, u_bottom], radius=78, fill=255)
# Cut inside the U
mask_draw.rounded_rectangle([u_left + stroke, u_top - 10, u_right - stroke, u_bottom - stroke], radius=40, fill=0)

# Apply mask to gradient
fg_img.paste(gradient, (0, 0), mask)
fg_img.save("assets/android-icon-foreground.png")

# 3. Monochrome layer (white shape on transparent background for Android 13+ themed icons)
mono_img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
white_fill = Image.new("RGBA", (SIZE, SIZE), (255, 255, 255, 255))
mono_img.paste(white_fill, (0, 0), mask)
mono_img.save("assets/android-icon-monochrome.png")

# 4. Standard 1024x1024 App Icon (Combined bg + fg)
ICON_SIZE = 1024
full_icon = Image.new("RGBA", (ICON_SIZE, ICON_SIZE), (16, 16, 20, 255))
scaled_fg = fg_img.resize((ICON_SIZE, ICON_SIZE), Image.Resampling.LANCZOS)
full_icon.paste(scaled_fg, (0, 0), scaled_fg)
full_icon.save("assets/icon.png")
full_icon.save("assets/adaptive-icon.png")

# 5. Favicon (48x48)
favicon = full_icon.resize((48, 48), Image.Resampling.LANCZOS)
favicon.save("assets/favicon.png")

print("All Android adaptive icons, monochrome icons, and app icons successfully generated!")
