"""
pxlib.py — Motor de pixel art por codigo para NEON RIFT.
Todo se dibuja pixel a pixel (RGBA). Nada de emoji ni SVG.
"""
from PIL import Image
import math

# ---------------------------------------------------------------- PALETA
P = {
    # neutros
    'ink':      (8, 8, 16, 255),
    'dark1':    (16, 18, 34, 255),
    'dark2':    (26, 29, 52, 255),
    'dark3':    (38, 43, 74, 255),
    'steel':    (58, 66, 104, 255),
    'steel_l':  (91, 100, 148, 255),
    'gray':     (138, 147, 184, 255),
    'white':    (244, 248, 255, 255),
    # cian
    'cyan_d':   (14, 96, 112, 255),
    'cyan':     (25, 200, 220, 255),
    'cyan_l':   (143, 247, 255, 255),
    # magenta / rosa
    'mag_d':    (116, 15, 92, 255),
    'magenta':  (227, 39, 158, 255),
    'mag_l':    (255, 122, 217, 255),
    # purpura
    'purp_d':   (61, 26, 102, 255),
    'purple':   (123, 63, 242, 255),
    'purp_l':   (181, 140, 255, 255),
    # calidos
    'yellow':   (255, 210, 63, 255),
    'orange':   (255, 139, 43, 255),
    'red_d':    (122, 31, 46, 255),
    'red':      (224, 51, 63, 255),
    'red_l':    (255, 107, 107, 255),
    'green_d':  (20, 82, 58, 255),
    'green':    (47, 214, 123, 255),
    'green_l':  (150, 255, 195, 255),
}

def C(name, a=255):
    """Color de la paleta con alfa opcional."""
    r, g, b, _ = P[name]
    return (r, g, b, a)

def hx(hexstr, a=255):
    hexstr = hexstr.lstrip('#')
    return (int(hexstr[0:2], 16), int(hexstr[2:4], 16), int(hexstr[4:6], 16), a)

def mix(c1, c2, t):
    """Mezcla lineal entre dos colores RGBA."""
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(4))

# ---------------------------------------------------------------- CANVAS
class Px:
    """Lienzo de pixeles con primitivas y efectos."""

    def __init__(self, w, h, bg=None):
        self.w, self.h = w, h
        self.px = [[(0, 0, 0, 0)] * w for _ in range(h)]
        if bg:
            self.rect(0, 0, w, h, bg)

    # -- basicos ---------------------------------------------------
    def set(self, x, y, c):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h and c is not None:
            self.px[y][x] = c

    def get(self, x, y):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            return self.px[y][x]
        return (0, 0, 0, 0)

    def alpha(self, x, y):
        return self.get(x, y)[3]

    def rect(self, x, y, w, h, c):
        for j in range(int(y), int(y + h)):
            for i in range(int(x), int(x + w)):
                self.set(i, j, c)

    def hline(self, x0, x1, y, c):
        for x in range(int(x0), int(x1) + 1):
            self.set(x, y, c)

    def vline(self, x, y0, y1, c):
        for y in range(int(y0), int(y1) + 1):
            self.set(x, y, c)

    def line(self, x0, y0, x1, y1, c):
        x0, y0, x1, y1 = int(x0), int(y0), int(x1), int(y1)
        dx, dy = abs(x1 - x0), -abs(y1 - y0)
        sx = 1 if x0 < x1 else -1
        sy = 1 if y0 < y1 else -1
        err = dx + dy
        while True:
            self.set(x0, y0, c)
            if x0 == x1 and y0 == y1:
                break
            e2 = 2 * err
            if e2 >= dy:
                err += dy
                x0 += sx
            if e2 <= dx:
                err += dx
                y0 += sy

    # -- formas ----------------------------------------------------
    def ellipse(self, cx, cy, rx, ry, c):
        for y in range(int(cy - ry), int(cy + ry) + 1):
            for x in range(int(cx - rx), int(cx + rx) + 1):
                v = ((x - cx) ** 2) / max(rx * rx, 0.01) + ((y - cy) ** 2) / max(ry * ry, 0.01)
                if v <= 1.0:
                    self.set(x, y, c)

    def circle(self, cx, cy, r, c):
        self.ellipse(cx, cy, r, r, c)

    def ring(self, cx, cy, r, c, thick=1):
        for y in range(int(cy - r - 1), int(cy + r + 2)):
            for x in range(int(cx - r - 1), int(cx + r + 2)):
                d = math.hypot(x - cx, y - cy)
                if r - thick + 0.01 <= d <= r + 0.35:
                    self.set(x, y, c)

    def poly(self, pts, c):
        if len(pts) < 3:
            return
        ys = [p[1] for p in pts]
        for y in range(int(min(ys)), int(max(ys)) + 1):
            xs = []
            n = len(pts)
            for i in range(n):
                x0, y0 = pts[i]
                x1, y1 = pts[(i + 1) % n]
                if y0 == y1:
                    continue
                if min(y0, y1) <= y + 0.5 <= max(y0, y1):
                    t = (y + 0.5 - y0) / (y1 - y0)
                    xs.append(x0 + t * (x1 - x0))
            xs.sort()
            for i in range(0, len(xs) - 1, 2):
                for x in range(int(math.ceil(xs[i])), int(xs[i + 1]) + 1):
                    self.set(x, y, c)

    def tri(self, p0, p1, p2, c):
        self.poly([p0, p1, p2], c)

    # -- efectos ---------------------------------------------------
    def outline(self, c, diagonal=False):
        """Borde 1px alrededor de todo lo opaco."""
        add = []
        nb = [(1, 0), (-1, 0), (0, 1), (0, -1)]
        if diagonal:
            nb += [(1, 1), (-1, 1), (1, -1), (-1, -1)]
        for y in range(self.h):
            for x in range(self.w):
                if self.px[y][x][3] == 0:
                    for dx, dy in nb:
                        if self.alpha(x + dx, y + dy) > 40:
                            add.append((x, y))
                            break
        for x, y in add:
            self.set(x, y, c)

    def shade(self, c, t=0.35, from_y=None):
        """Oscurece la mitad inferior (volumen simple)."""
        from_y = self.h // 2 if from_y is None else from_y
        for y in range(from_y, self.h):
            k = (y - from_y) / max(1, (self.h - from_y - 1))
            for x in range(self.w):
                p = self.px[y][x]
                if p[3] > 0:
                    self.px[y][x] = mix(p, c, min(1.0, k * t))

    def glow_mask(self, c, radius=2, strength=0.55):
        """Halo neon alrededor de los pixeles opacos (dentro del lienzo)."""
        src = [[self.px[y][x][3] > 40 for x in range(self.w)] for y in range(self.h)]
        for y in range(self.h):
            for x in range(self.w):
                if src[y][x]:
                    continue
                best = 999
                for j in range(max(0, y - radius), min(self.h, y + radius + 1)):
                    for i in range(max(0, x - radius), min(self.w, x + radius + 1)):
                        if src[j][i]:
                            d = math.hypot(i - x, j - y)
                            best = min(best, d)
                if best <= radius:
                    k = 1.0 - (best / (radius + 0.01))
                    a = int(255 * k * strength)
                    if a > 12:
                        self.set(x, y, (c[0], c[1], c[2], a))

    def dither(self, x, y, w, h, c, pattern=0):
        """Trama de 2x2 para transiciones."""
        pats = [(0, 0), (1, 1), (0, 1), (1, 0)]
        for j in range(int(y), int(y + h)):
            for i in range(int(x), int(x + w)):
                if (i % 2, j % 2) == pats[pattern]:
                    self.set(i, j, c)

    def blit(self, other, dx=0, dy=0):
        for y in range(other.h):
            for x in range(other.w):
                c = other.px[y][x]
                if c[3] > 0:
                    self.set(x + dx, y + dy, c)

    def flip_x(self):
        for row in self.px:
            row.reverse()
        return self

    def crop(self, x, y, w, h):
        out = Px(w, h)
        for j in range(h):
            for i in range(w):
                out.px[j][i] = self.get(x + i, y + j)
        return out

    def img(self):
        im = Image.new('RGBA', (self.w, self.h))
        im.putdata([self.px[y][x] for y in range(self.h) for x in range(self.w)])
        return im

    def save(self, path):
        self.img().save(path)


# ---------------------------------------------------------------- SHEETS
def make_sheet(frames, cols, path, pad=0):
    """Compone frames (Px del mismo tamano) en una grilla."""
    if pad:
        padded = []
        for f in frames:
            q = Px(f.w + pad * 2, f.h + pad * 2)
            q.blit(f, pad, pad)
            padded.append(q)
        frames = padded
    fw, fh = frames[0].w, frames[0].h
    rows = (len(frames) + cols - 1) // cols
    sheet = Px(cols * fw, rows * fh)
    for i, f in enumerate(frames):
        sheet.blit(f, (i % cols) * fw, (i // cols) * fh)
    sheet.save(path)
    return path


def anim_strip(frames, path):
    """Una fila horizontal de frames."""
    return make_sheet(frames, len(frames), path)


def upscale_preview(src, dst, scale=6, bg=(18, 18, 32, 255)):
    """Amplia con nearest-neighbor para inspeccion."""
    im = Image.open(src).convert('RGBA')
    bgim = Image.new('RGBA', im.size, bg)
    bgim.alpha_composite(im)
    bgim = bgim.resize((im.width * scale, im.height * scale), Image.NEAREST)
    bgim.save(dst)


def contact_sheet(paths, dst, scale=4, bg=(18, 18, 32, 255), cols=4, label=True):
    """Hoja de contacto para revisar todos los assets."""
    ims = []
    for p in paths:
        im = Image.open(p).convert('RGBA')
        im = im.resize((max(1, im.width * scale), max(1, im.height * scale)), Image.NEAREST)
        ims.append(im)
    w = max(i.width for i in ims) + 16
    h = max(i.height for i in ims) + 16
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new('RGBA', (cols * w, rows * h), bg)
    for idx, im in enumerate(ims):
        x = (idx % cols) * w + (w - im.width) // 2
        y = (idx // cols) * h + (h - im.height) // 2
        sheet.alpha_composite(im, (x, y))
    sheet.save(dst)


# ---------------------------------------------------------------- TEXTO PIXEL
FONT_3x5 = {
    'A': ["010", "101", "111", "101", "101"],
    'B': ["110", "101", "110", "101", "110"],
    'C': ["011", "100", "100", "100", "011"],
    'D': ["110", "101", "101", "101", "110"],
    'E': ["111", "100", "110", "100", "111"],
    'F': ["111", "100", "110", "100", "100"],
    'G': ["011", "100", "101", "101", "011"],
    'H': ["101", "101", "111", "101", "101"],
    'I': ["111", "010", "010", "010", "111"],
    'J': ["001", "001", "001", "101", "010"],
    'K': ["101", "101", "110", "101", "101"],
    'L': ["100", "100", "100", "100", "111"],
    'M': ["101", "111", "111", "101", "101"],
    'N': ["101", "111", "111", "111", "101"],
    'O': ["010", "101", "101", "101", "010"],
    'P': ["110", "101", "110", "100", "100"],
    'Q': ["010", "101", "101", "111", "011"],
    'R': ["110", "101", "110", "101", "101"],
    'S': ["011", "100", "010", "001", "110"],
    'T': ["111", "010", "010", "010", "010"],
    'U': ["101", "101", "101", "101", "011"],
    'V': ["101", "101", "101", "101", "010"],
    'W': ["101", "101", "111", "111", "101"],
    'X': ["101", "101", "010", "101", "101"],
    'Y': ["101", "101", "010", "010", "010"],
    'Z': ["111", "001", "010", "100", "111"],
    '0': ["111", "101", "101", "101", "111"],
    '1': ["010", "110", "010", "010", "111"],
    '2': ["110", "001", "010", "100", "111"],
    '3': ["110", "001", "010", "001", "110"],
    '4': ["101", "101", "111", "001", "001"],
    '5': ["111", "100", "110", "001", "110"],
    '6': ["011", "100", "111", "101", "111"],
    '7': ["111", "001", "010", "010", "010"],
    '8': ["111", "101", "111", "101", "111"],
    '9': ["111", "101", "111", "001", "110"],
    ' ': ["000", "000", "000", "000", "000"],
    '-': ["000", "000", "111", "000", "000"],
    '+': ["000", "010", "111", "010", "000"],
    '.': ["000", "000", "000", "000", "010"],
    ':': ["000", "010", "000", "010", "000"],
    '!': ["010", "010", "010", "000", "010"],
    '/': ["001", "001", "010", "100", "100"],
    '%': ["101", "001", "010", "100", "101"],
    'x': ["000", "101", "010", "101", "000"],
    '<': ["001", "010", "100", "010", "001"],
    '>': ["100", "010", "001", "010", "100"],
}


def text_px(canvas, txt, x, y, c, scale=1, spacing=1, shadow=None):
    """Dibuja texto con la fuente 3x5 dentro de un canvas Px."""
    cursor = x
    if shadow:
        text_px(canvas, txt, x + scale, y + scale, shadow, scale, spacing)
    for ch in txt.upper():
        glyph = FONT_3x5.get(ch, FONT_3x5[' '])
        for gy, row in enumerate(glyph):
            for gx, bit in enumerate(row):
                if bit == '1':
                    for sy in range(scale):
                        for sx in range(scale):
                            canvas.set(cursor + gx * scale + sx, y + gy * scale + sy, c)
        cursor += (3 + spacing) * scale
    return cursor - x


def text_width(txt, scale=1, spacing=1):
    return len(txt) * (3 + spacing) * scale
