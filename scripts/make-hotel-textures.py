# Paper for the Home 3D hotel: a colour map and a normal map you can almost feel (ideas log #11).
# The old baked paper had almost no contrast (std dev ~9/255) and its grain was finer than a screen pixel
# once the model was on screen, so it vanished. This version sizes everything in metres of wall:
# the textures cover 4 m (the scenes' uvScale tile), so 1024 px = 4 m = 256 px per metre:
#   pulp clouds ~0.5-1.5 m, cold-press tooth ~4-10 cm, fibres 1-1.5 cm wide and 10-45 cm long.
# The relief goes into a normal map (light catches it at any distance) instead of a bump map.
# Tune with RELIEF and CONTRAST below.
# Run: python3 scripts/make-hotel-textures.py public/textures   (needs numpy and Pillow)
# Writes hotel-paper.webp (1024), hotel-paper-512.webp (phones) and hotel-normal-512.webp (relief; 512 px is
# enough for light to catch and keeps the download small); all tile seamlessly.
# After changing them, bump TEX_V in src/components/scene/HotelScene.jsx so browsers fetch the new files.
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

OUT = sys.argv[1] if len(sys.argv) > 1 else "public/textures"
N = 1024
# The two dials (owner, 2026-10-24: the first pass at RELIEF 1.4 / CONTRAST 1.0 was too much; the old paper
# at about RELIEF 0 / CONTRAST 0.5 didn't show at all; aim for "a little more than before").
RELIEF = 0.4     # how strongly light catches the tooth (normal-map strength)
CONTRAST = 0.6   # how much the paper's colour varies (mottling, shading, fibres)


def spectral(beta, seed, lo=0.0, hi=1.0):
    """Tileable noise with a 1/f^beta spectrum, optionally band-limited (frequencies in cycles per pixel)."""
    r = np.random.default_rng(seed)
    F = np.fft.fft2(r.standard_normal((N, N)))
    fx = np.fft.fftfreq(N)[:, None]
    fy = np.fft.fftfreq(N)[None, :]
    f = np.sqrt(fx**2 + fy**2)
    f[0, 0] = 1
    amp = 1 / f**beta
    amp *= (f >= lo) & (f <= hi)
    n = np.real(np.fft.ifft2(F * amp))
    n -= n.mean()
    return n / (n.std() + 1e-9)


def wrap_blur(a, radius):
    """Gaussian blur done in the frequency domain, which wraps around the edges, so the tile stays seamless."""
    fx = np.fft.fftfreq(a.shape[0])[:, None]
    fy = np.fft.fftfreq(a.shape[1])[None, :]
    g = np.exp(-2 * (np.pi * radius) ** 2 * (fx**2 + fy**2))
    return np.real(np.fft.ifft2(np.fft.fft2(a) * g))


def fibres(seed, count, length, width):
    """Wavy fibres drawn at 2x with wrap-around; returns (raised, dark) masks 0..1."""
    S = 2 * N
    up = Image.new("L", (S, S), 0)
    dn = Image.new("L", (S, S), 0)
    du, dd = ImageDraw.Draw(up), ImageDraw.Draw(dn)
    r = np.random.default_rng(seed)
    for _ in range(count):
        x, y = r.random() * S, r.random() * S
        a = r.random() * np.pi * 2
        L = (length[0] + r.random() * (length[1] - length[0])) * 2
        w = int(round((width[0] + r.random() * (width[1] - width[0])) * 2))
        pts = [(x, y)]
        for _ in range(8):
            a += (r.random() - 0.5) * 0.6
            x += np.cos(a) * L / 8
            y += np.sin(a) * L / 8
            pts.append((x, y))
        draw, val = (dd, int(120 + r.random() * 100)) if r.random() < 0.22 else (du, int(150 + r.random() * 105))
        for ox in (-S, 0, S):  # draw shifted copies so fibres crossing an edge wrap around
            for oy in (-S, 0, S):
                draw.line([(px + ox, py + oy) for px, py in pts], fill=val, width=max(1, w))
    m_up = np.asarray(up.filter(ImageFilter.GaussianBlur(1.2)).resize((N, N), Image.LANCZOS), dtype=np.float64) / 255
    m_dn = np.asarray(dn.filter(ImageFilter.GaussianBlur(1.2)).resize((N, N), Image.LANCZOS), dtype=np.float64) / 255
    return m_up, m_dn


def main():
    os.makedirs(OUT, exist_ok=True)
    # --- height field (relief) ---
    pulp = spectral(1.7, 11, hi=1 / 60)                                 # soft clouds, metre scale
    tooth = wrap_blur(spectral(0.4, 12, lo=1 / 48, hi=1 / 10), 2.4)     # cold-press tooth, 4-10 cm lumps
    tooth = np.sign(tooth) * np.abs(tooth) ** 0.8                        # rounder tops, crisper valleys
    tooth /= tooth.std() + 1e-9
    fine = wrap_blur(spectral(0.2, 13, lo=1 / 10), 1.4)                  # fine tooth between the lumps
    fine /= fine.std() + 1e-9
    f_up, f_dn = fibres(14, 1300, (26, 115), (2.0, 3.6))
    H = 0.6 * pulp + 0.55 * tooth + 0.15 * fine + 1.4 * f_up - 0.8 * f_dn

    # --- colour: near-white so the material colours stay true; mottled, toothy, fibrous, flecked ---
    gy, gx = np.gradient(H)
    light = np.clip((gx * 0.7 + gy * 0.7) * 1.4, -1, 1)                   # lit from the top left, like the site textures
    v = 0.925 + CONTRAST * (0.05 * pulp + 0.085 * light + 0.05 * f_up - 0.09 * f_dn)
    r = np.random.default_rng(15)
    fl = Image.new("L", (N, N), 0)                                       # small dark inclusions, 2-6 mm, round
    dfl = ImageDraw.Draw(fl)
    for _ in range(700):
        x, y, s = r.random() * N, r.random() * N, 0.6 + r.random() * 1.0
        dfl.ellipse((x - s, y - s, x + s, y + s), fill=int(40 + r.random() * 90))
    v -= wrap_blur(np.asarray(fl, dtype=np.float64) / 255, 0.5) * 0.9 * CONTRAST
    rgb = np.stack([v * 1.0, v * 0.993, v * 0.982], axis=-1)             # a touch warm, like real paper
    rgb = np.clip(rgb, 0, 1)
    col = Image.fromarray((rgb * 255).round().astype(np.uint8), "RGB")

    # --- normal map (OpenGL / three.js convention: green = up; textures are flipped so rows run downward) ---
    strength = RELIEF
    nx = -gx * strength
    ny = gy * strength
    nz = np.ones_like(H)
    ln = np.sqrt(nx**2 + ny**2 + nz**2)
    nrm = np.stack([nx / ln, ny / ln, nz / ln], axis=-1)
    nor = Image.fromarray(((nrm * 0.5 + 0.5) * 255).round().astype(np.uint8), "RGB")

    col.save(os.path.join(OUT, "hotel-paper.webp"), quality=80, method=6)
    col.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, "hotel-paper-512.webp"), quality=80, method=6)
    nor.resize((512, 512), Image.LANCZOS).save(os.path.join(OUT, "hotel-normal-512.webp"), quality=70, method=6)
    print("paper std dev (0-255):", round(float((rgb[..., 0] * 255).std()), 1))
    for f in ("hotel-paper.webp", "hotel-paper-512.webp", "hotel-normal-512.webp"):
        print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, "kB")


if __name__ == "__main__":
    main()
