# Coarse, detailed, tileable paper textures for the Formcraft site (cold-press / handmade look):
# pulp clouds, tooth (relief lit from the top left), long fibres, short hairs, flecks and inclusions.
# Run: python3 scripts/make-textures.py public/textures   (needs numpy and Pillow; TEX_N=768 tile size)
# After changing a texture, bump the ?v= number on the texture URLs in src/ so browsers refetch it.
import numpy as np, sys, os
from PIL import Image, ImageDraw, ImageFilter
OUT = sys.argv[1]
N = int(os.environ.get("TEX_N", 768))
rng = np.random.default_rng(7)

def spectral(beta, seed, lo=0):
    r = np.random.default_rng(seed)
    w = r.standard_normal((N, N))
    F = np.fft.fft2(w)
    fx = np.fft.fftfreq(N)[:, None]; fy = np.fft.fftfreq(N)[None, :]
    f = np.sqrt(fx**2 + fy**2); f[0, 0] = 1
    amp = 1 / f**beta
    if lo: amp *= (f > lo)
    n = np.real(np.fft.ifft2(F * amp))
    n -= n.mean(); n /= n.std() + 1e-9
    return n

def fibre_layer(seed, count, length, width, wavy=0.35):
    """Draw fibres at 2x with wrap-around, return float mask 0..1 (N x N)"""
    S = 2 * N
    img = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(img)
    r = np.random.default_rng(seed)
    for _ in range(count):
        x, y = r.random() * S, r.random() * S
        a = r.random() * np.pi * 2
        L = length * (0.4 + r.random() * 1.2) * 2
        steps = 8
        pts = [(x, y)]
        for _k in range(steps):
            a += (r.random() - 0.5) * wavy
            x += np.cos(a) * L / steps; y += np.sin(a) * L / steps
            pts.append((x, y))
        val = int(120 + r.random() * 135)
        wd = max(1, int(round(width * 2 * (0.6 + r.random() * 0.8))))
        for ox in (-S, 0, S):
            for oy in (-S, 0, S):
                d.line([(px + ox, py + oy) for px, py in pts], fill=val, width=wd, joint="curve")
    img = img.resize((N, N), Image.LANCZOS)
    return np.asarray(img, dtype=np.float32) / 255

def flecks(seed, count, rmin, rmax):
    S = 2 * N
    img = Image.new("L", (S, S), 0)
    d = ImageDraw.Draw(img)
    r = np.random.default_rng(seed)
    for _ in range(count):
        x, y = r.random() * S, r.random() * S
        rr = (rmin + r.random() * (rmax - rmin)) * 2
        v = int(80 + r.random() * 175)
        # irregular speck: a few overlapping ellipses
        for _k in range(1 + int(r.random() * 3)):
            dx, dy = (r.random() - .5) * rr, (r.random() - .5) * rr
            ex, ey = rr * (0.5 + r.random()), rr * (0.3 + r.random() * .7)
            for ox in (-S, 0, S):
                for oy in (-S, 0, S):
                    d.ellipse([x + dx - ex + ox, y + dy - ey + oy, x + dx + ex + ox, y + dy + ey + oy], fill=v)
    img = img.resize((N, N), Image.LANCZOS)
    return np.asarray(img, dtype=np.float32) / 255

# shared structure (same sheet "pulp" so every edition feels like the same stock)
cloud = spectral(1.6, 1) * 0.65 + spectral(1.1, 2) * 0.35          # pulp clouds
tooth = spectral(0.55, 3)                                           # coarse cold-press tooth
grain = spectral(0.05, 4)                                           # fine grain
long_f = fibre_layer(5, int(900 * (N / 1024) ** 2), 46, 0.9)                               # long fibres
hairs = fibre_layer(6, int(4200 * (N / 1024) ** 2), 9, 0.6, wavy=0.9)                      # short hairs
specks = flecks(8, int(1800 * (N / 1024) ** 2), 0.4, 1.3)
inclusions = flecks(9, int(60 * (N / 1024) ** 2), 1.8, 4.5)                                # bits of bark / recycled pulp

height = cloud * 0.35 + tooth * 1.25 + grain * 0.45 + long_f * 2.0 + hairs * 0.9
# light from the top left: shading from the height gradient (wraps, so the tile stays seamless)
gx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) * 0.5
gy = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) * 0.5
shade = -(gx * 0.7 + gy * 0.7)
shade = np.tanh(shade * 0.9)

def make(name, base, light, dark, k):
    """base/light/dark: RGB 0..1. k: strengths"""
    base = np.array(base, np.float32); light = np.array(light, np.float32); dark = np.array(dark, np.float32)
    img = np.ones((N, N, 3), np.float32) * base
    lum = cloud[..., None] * k["cloud"] + grain[..., None] * k["grain"] + shade[..., None] * k["shade"]
    img = img + lum * (light - dark) * 0.5
    # fibres: mostly lighter strands, some darker
    lf = long_f[..., None]; hf = hairs[..., None]
    img = img * (1 - lf * k["fibre"]) + light * lf * k["fibre"]
    img = img * (1 - hf * k["hair"] * 0.5) + dark * hf * k["hair"] * 0.5 * k["hair_dark"] + light * hf * k["hair"] * 0.5 * (1 - k["hair_dark"])
    img = img * (1 - specks[..., None] * k["speck"]) + dark * specks[..., None] * k["speck"]
    inc_col = np.array(k.get("inc", dark), np.float32)
    img = img * (1 - inclusions[..., None] * k["inc_a"]) + inc_col * inclusions[..., None] * k["inc_a"]
    img = np.clip(img, 0, 1)
    im = Image.fromarray((img * 255).astype(np.uint8), "RGB")
    path = os.path.join(OUT, f"{name}.webp")
    im.save(path, "WEBP", quality=k.get("q", 60), method=6)
    print(name, os.path.getsize(path) // 1024, "kB")

c = lambda h: [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
make("paper", c("F1EFEA"), c("FFFFFF"), c("8A8274"),
     dict(cloud=.10, grain=.06, shade=.42, fibre=.7, hair=.45, hair_dark=.45, speck=.35, inc_a=.6, inc=c("6B5A44")))
make("orange", c("FFAE61"), c("FFD9AE"), c("B8622A"),
     dict(cloud=.16, grain=.07, shade=.45, fibre=.5, hair=.4, hair_dark=.5, speck=.35, inc_a=.5, inc=c("A04A22")))
make("navy", c("1C252D"), c("4A5966"), c("070A0D"),
     dict(cloud=.30, grain=.12, shade=.7, fibre=.4, hair=.45, hair_dark=.3, speck=.4, inc_a=.45, inc=c("3B4A57")))
make("black", c("171D1A"), c("3E4842"), c("050706"),
     dict(cloud=.30, grain=.12, shade=.7, fibre=.36, hair=.45, hair_dark=.3, speck=.4, inc_a=.45, inc=c("34403A")))
