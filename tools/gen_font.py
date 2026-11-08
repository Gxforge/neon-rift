"""Genera fuente bitmap 3x5 (PNG+XML AngelCode) y overlays CRT."""
import os, sys, math, json
sys.path.insert(0, os.path.dirname(__file__))
from pxlib import Px, C, FONT_3x5, mix

OUT = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', 'public', 'assets'))

EXTRA = {
    '?': ["011", "001", "010", "000", "010"],
    ',': ["000", "000", "000", "010", "100"],
    "'": ["010", "010", "000", "000", "000"],
    '(': ["001", "010", "010", "010", "001"],
    ')': ["100", "010", "010", "010", "100"],
    '=': ["000", "111", "000", "111", "000"],
    '_': ["000", "000", "000", "000", "111"],
    '"': ["101", "101", "000", "000", "000"],
    '|': ["010", "010", "010", "010", "010"],
    '*': ["101", "010", "111", "010", "101"],
}

def build():
    glyphs = dict(FONT_3x5)
    glyphs.update(EXTRA)

    # ordenar: espacio, signos, digitos, mayusculas, minusculas(mismo glifo)
    entries = []  # (char, code, glyph)
    for ch, g in glyphs.items():
        entries.append((ch, ord(ch), g))
    lower = []
    for ch, g in glyphs.items():
        if 'A' <= ch <= 'Z':
            lower.append((ch.lower(), ord(ch.lower()), g))
    entries += lower
    entries.sort(key=lambda e: e[1])

    cw, chh = 3, 5
    pad = 1
    cell = cw + pad
    W = len(entries) * cell + 1
    H = chh + 2
    sheet = Px(W, H)

    chars = []
    x = 1
    for ch, code, g in entries:
        for gy, row in enumerate(g):
            for gx, bit in enumerate(row):
                if bit == '1':
                    sheet.set(x + gx, 1 + gy, C('white'))
        chars.append((code, x, 1, cw, chh, 4))
        x += cell

    sheet.save(os.path.join(OUT, 'font.png'))

    xml = ['<?xml version="1.0"?>', '<font>',
           '  <info face="neon" size="5" bold="0" italic="0" charset="" unicode="1" '
           'stretchH="100" smooth="0" aa="1" padding="0,0,0,0" spacing="1,1"/>',
           f'  <common lineHeight="7" base="6" scaleW="{W}" scaleH="{H}" pages="1" packed="0"/>',
           '  <pages>', '    <page id="0" file="font.png"/>', '  </pages>',
           f'  <chars count="{len(chars)}">']
    for code, cx, cy, w, h, adv in chars:
        xml.append(f'    <char id="{code}" x="{cx}" y="{cy}" width="{w}" height="{h}" '
                   f'xoffset="0" yoffset="0" xadvance="{adv}" page="0" chnl="15"/>')
    xml += ['  </chars>', '</font>']
    with open(os.path.join(OUT, 'font.xml'), 'w') as f:
        f.write('\n'.join(xml))

    # -------- overlays CRT --------
    W2, H2 = 480, 270
    # scanlines
    scan = Px(W2, H2)
    for y in range(0, H2, 2):
        for x in range(W2):
            scan.set(x, y, (0, 0, 0, 20))
    scan.save(os.path.join(OUT, 'fx_scanlines.png'))

    # vignette
    vig = Px(W2, H2)
    for y in range(H2):
        for x in range(W2):
            nx = (x - W2 / 2) / (W2 / 2)
            ny = (y - H2 / 2) / (H2 / 2)
            d = math.sqrt(nx * nx * 0.85 + ny * ny)
            a = int(min(235, max(0, (d - 0.55) ** 2 * 460)))
            if a > 3:
                vig.set(x, y, (0, 0, 0, a))
    vig.save(os.path.join(OUT, 'fx_vignette.png'))

    # linea de escaneo luminosa (barrido vertical) 1x270
    bar = Px(1, H2)
    for y in range(H2):
        d = abs(y - H2 / 2) / (H2 / 2)
        a = int(max(0, 60 - d * 55))
        bar.set(0, y, (150, 245, 255, a))
    bar.save(os.path.join(OUT, 'fx_sweep.png'))

    print('font.png', W, 'x', H, '| chars', len(chars))

if __name__ == '__main__':
    build()
