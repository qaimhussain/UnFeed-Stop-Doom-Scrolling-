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
print("Adaptive icon foreground and background successfully generated!")
