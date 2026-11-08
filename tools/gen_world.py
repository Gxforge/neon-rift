"""Mundo: tileset, parallax, FX, pickups, props, iconos, HUD y logo."""
import math, random
from pxlib import Px, C, P, mix, make_sheet, anim_strip, text_px, text_width

T = 16  # tamano de tile


# ============================================================ TILESET
def tile_floor(variant=0):
    q = Px(T, T, C('dark2'))
    random.seed(10 + variant)
    # base con paneles
    q.rect(0, 0, T, T, C('dark1'))
    q.rect(1, 1, 14, 14, C('dark2'))
    # lineas de panel
    q.hline(0, 15, 0, C('dark3'))
    q.vline(0, 0, 15, C('dark3'))
    q.hline(0, 15, 15, C('ink'))
    # detalle segun variante
    if variant == 0:
        q.rect(3, 3, 10, 10, C('dark1'))
        q.set(3, 3, C('dark3')); q.set(12, 12, C('dark3'))
        q.set(7, 7, C('steel'))
        q.set(8, 8, C('steel'))
    elif variant == 1:
        for _ in range(5):
            x, y = random.randint(2, 13), random.randint(2, 13)
            q.set(x, y, C('dark3'))
        q.hline(2, 13, 8, C('dark3'))
        q.hline(2, 13, 9, C('dark1'))
    elif variant == 2:  # con grieta
        q.line(4, 2, 6, 7, C('ink'))
        q.line(6, 7, 5, 10, C('ink'))
        q.line(5, 10, 9, 14, C('ink'))
        q.set(6, 8, C('steel'))
    elif variant == 3:  # rejilla
        for x in range(2, 15, 3):
            q.vline(x, 2, 13, C('dark3'))
        for y in range(2, 15, 3):
            q.hline(2, 13, y, C('dark3'))
        q.rect(2, 2, 12, 12, None) if False else None
        for x in range(3, 14, 3):
            for y in range(3, 14, 3):
                q.set(x, y, C('ink'))
    elif variant == 4:  # franja de peligro
        for x in range(0, T):
            for y in range(0, T):
                if ((x + y) // 4) % 2 == 0:
                    q.set(x, y, C('yellow') if 4 < y < 12 else C('dark1'))
                else:
                    q.set(x, y, C('dark1') if 4 < y < 12 else C('dark1'))
        q.hline(0, 15, 4, C('dark3'))
        q.hline(0, 15, 11, C('dark3'))
    elif variant == 5:  # circuito
        q.line(2, 3, 12, 3, C('cyan_d'))
        q.line(12, 3, 12, 10, C('cyan_d'))
        q.line(4, 12, 12, 12, C('cyan_d'))
        q.set(12, 10, C('cyan'))
        q.set(4, 3, C('cyan'))
        q.rect(6, 6, 3, 3, C('dark3'))
        q.set(7, 7, C('cyan'))
    elif variant == 6:  # agua/metal reflectante
        q.rect(2, 2, 12, 12, C('dark3'))
        q.hline(3, 12, 4, C('steel'))
        q.hline(3, 10, 9, C('steel'))
        q.hline(5, 12, 12, C('dark2'))
    elif variant == 7:  # alcantarilla
        q.ellipse(8, 8, 5, 5, C('dark1'))
        q.ring(8, 8, 5, C('steel'), 1)
        for x in range(5, 12, 2):
            q.vline(x, 5, 11, C('dark3'))
    elif variant == 8:  # baldosa con logo H
        q.rect(4, 4, 8, 8, C('dark1'))
        q.hline(4, 11, 4, C('mag_d'))
        q.hline(4, 11, 11, C('mag_d'))
        q.set(7, 7, C('magenta')); q.set(8, 8, C('magenta'))
        q.set(7, 8, C('mag_d')); q.set(8, 7, C('mag_d'))
    elif variant == 9:  # rejilla con luz
        q.rect(3, 3, 10, 10, C('dark1'))
        for x in range(4, 13, 2):
            q.vline(x, 4, 12, C('dark3'))
        q.hline(4, 12, 8, C('cyan_d'))
        q.set(8, 8, C('cyan'))
    return q


def tile_wall_cap(variant=0):
    q = Px(T, T)
    q.rect(0, 0, T, T, C('dark3'))
    q.rect(1, 1, 14, 14, C('steel'))
    q.rect(2, 2, 12, 12, C('dark3'))
    q.hline(2, 13, 2, C('steel_l'))
    q.hline(2, 13, 13, C('ink'))
    q.vline(13, 2, 13, C('ink'))
    if variant == 1:
        q.rect(5, 5, 6, 6, C('dark2'))
        q.hline(5, 10, 5, C('steel'))
    elif variant == 2:
        for i in range(3):
            q.hline(3 + i * 4, 12 - i * 2, 4 + i * 3, C('steel_l'))
    elif variant == 3:
        q.set(6, 6, C('magenta')); q.set(9, 9, C('magenta'))
    elif variant == 4:
        q.vline(8, 3, 12, C('cyan_d'))
        q.set(8, 7, C('cyan'))
    return q


def tile_wall_face(variant=0):
    """Muro visto de frente (borde vertical de sala)."""
    q = Px(T, T, C('dark1'))
    q.rect(0, 0, T, T, C('dark2'))
    # ladrillos
    for row, y in enumerate(range(0, 16, 4)):
        q.hline(0, 15, y, C('ink'))
        off = 0 if row % 2 == 0 else 8
        for x in range(off, 16, 8):
            q.vline(x, y, y + 3, C('ink'))
        for x in range(off + 1, 16, 8):
            q.hline(x, min(15, x + 4), y + 1, C('dark3'))
    if variant == 1:  # con respiradero
        q.rect(4, 5, 8, 6, C('ink'))
        for y in range(6, 11, 2):
            q.hline(5, 10, y, C('steel'))
    elif variant == 2:  # grafiti neón
        q.line(3, 12, 6, 8, C('mag_d'))
        q.line(6, 8, 9, 12, C('mag_d'))
        q.set(6, 8, C('mag_l'))
    elif variant == 3:  # panel de datos
        q.rect(3, 4, 10, 8, C('dark1'))
        q.hline(4, 11, 5, C('cyan_d'))
        q.hline(4, 9, 7, C('cyan'))
        q.hline(4, 10, 9, C('cyan_d'))
        q.set(11, 9, C('green'))
    elif variant == 4:  # tuberia vertical
        q.rect(6, 0, 4, 16, C('steel'))
        q.vline(7, 0, 15, C('steel_l'))
        q.vline(9, 0, 15, C('dark3'))
        q.rect(5, 6, 6, 3, C('dark3'))
    return q


def tile_door(open_=False):
    q = Px(T, T, C('dark1'))
    if open_:
        q.rect(0, 0, 16, 16, C('ink'))
        q.rect(2, 0, 12, 16, C('dark1'))
        q.hline(3, 12, 1, C('cyan'))
        q.hline(3, 12, 14, C('cyan_d'))
        q.vline(3, 1, 14, C('cyan_d'))
        q.vline(12, 1, 14, C('cyan_d'))
    else:
        q.rect(1, 0, 14, 16, C('steel'))
        q.rect(2, 0, 12, 16, C('dark3'))
        q.vline(7, 0, 15, C('ink'))
        q.vline(8, 0, 15, C('ink'))
        q.rect(4, 6, 3, 2, C('magenta'))
        q.rect(9, 6, 3, 2, C('magenta'))
        q.hline(3, 12, 2, C('steel_l'))
        q.hline(3, 12, 13, C('ink'))
    q.outline(C('ink'))
    return q


def tile_spikes():
    q = Px(T, T, C('dark1'))
    q.rect(0, 12, 16, 4, C('steel'))
    q.hline(0, 15, 12, C('steel_l'))
    for i, x in enumerate([2, 7, 12]):
        q.tri((x, 12), (x + 2, 6), (x + 4, 12), C('gray'))
        q.tri((x + 1, 12), (x + 2, 7), (x + 3, 12), C('white'))
        q.set(x + 2, 6, C('cyan_l'))
    return q


def tile_vent_floor():
    q = Px(T, T, C('ink'))
    q.rect(1, 1, 14, 14, C('dark3'))
    for y in range(3, 14, 3):
        q.hline(3, 12, y, C('ink'))
        q.hline(3, 12, y + 1, C('steel'))
    q.outline(C('ink'))
    return q


def tile_crate():
    q = Px(T, T, C('ink'))
    q.rect(1, 1, 14, 14, C('steel'))
    q.rect(2, 2, 12, 12, C('dark3'))
    q.line(3, 3, 12, 12, C('steel_l'))
    q.line(12, 3, 3, 12, C('steel_l'))
    q.rect(5, 5, 6, 6, C('dark2'))
    q.hline(5, 10, 5, C('steel'))
    q.outline(C('ink'))
    return q


def tile_barrel(explosive=False):
    q = Px(T, T)
    base = C('red_d') if explosive else C('green_d')
    light = C('red') if explosive else C('green')
    q.rect(3, 2, 10, 13, base)
    q.rect(4, 2, 8, 13, light)
    q.hline(3, 12, 4, C('ink'))
    q.hline(3, 12, 11, C('ink'))
    q.vline(7, 2, 14, base)
    q.hline(3, 12, 1, C('steel'))
    q.hline(3, 12, 14, C('steel'))
    if explosive:
        q.rect(6, 6, 4, 4, C('yellow'))
        q.set(7, 7, C('ink')); q.set(8, 8, C('ink'))
        q.set(7, 8, C('ink')); q.set(8, 7, C('ink'))
    else:
        q.hline(5, 10, 7, C('green_l'))
    q.outline(C('ink'))
    return q


def tile_terminal():
    q = Px(T, T, C('ink'))
    q.rect(1, 3, 14, 11, C('steel'))
    q.rect(2, 4, 12, 8, C('dark1'))
    q.hline(3, 12, 5, C('cyan'))
    q.hline(3, 10, 7, C('cyan_d'))
    q.hline(3, 9, 9, C('cyan_d'))
    q.set(11, 9, C('green'))
    q.rect(5, 12, 6, 2, C('dark3'))
    q.rect(4, 14, 8, 1, C('steel'))
    q.outline(C('ink'))
    return q


def tile_server():
    q = Px(T, T, C('ink'))
    q.rect(2, 1, 12, 15, C('dark3'))
    q.rect(3, 2, 10, 13, C('dark2'))
    for y in range(3, 14, 3):
        q.hline(4, 11, y, C('ink'))
        q.set(5, y, C('green'))
        q.set(6, y, C('green_d'))
        q.hline(8, 11, y, C('steel'))
    q.outline(C('ink'))
    return q


def tile_portal(phase=0):
    q = Px(T, T, C('ink'))
    q.ellipse(8, 8, 7, 7, C('purp_d'))
    q.ellipse(8, 8, 6, 6, C('purple'))
    q.ellipse(8, 8, 4, 4, C('cyan_d'))
    q.ellipse(8, 8, 3, 3, C('cyan'))
    q.ellipse(8, 8, 1, 1, C('cyan_l'))
    for i in range(3):
        a = math.radians(phase * 30 + i * 120)
        q.set(8 + math.cos(a) * 6, 8 + math.sin(a) * 6, C('cyan_l'))
    return q


def tile_spawn_pad():
    q = Px(T, T, C('ink'))
    q.ellipse(8, 8, 6, 6, C('dark3'))
    q.ring(8, 8, 6, C('mag_d'), 1)
    q.ring(8, 8, 3, C('magenta'), 1)
    q.set(8, 8, C('mag_l'))
    return q


def tile_pipe():
    q = Px(T, T, C('ink'))
    q.rect(0, 5, 16, 6, C('steel'))
    q.hline(0, 15, 6, C('steel_l'))
    q.hline(0, 15, 10, C('dark3'))
    q.rect(6, 4, 4, 8, C('dark3'))
    q.rect(7, 5, 2, 6, C('steel'))
    q.outline(C('ink'))
    return q


def gen_tileset(outdir):
    import json
    tiles, names = [], []

    def add(name, tile):
        names.append(name)
        tiles.append(tile)

    for v in range(8):
        add(f'floor_{v}', tile_floor(v))
    add('floor_8', tile_floor(8))
    add('floor_9', tile_floor(9))
    add('vent', tile_vent_floor())
    add('spikes', tile_spikes())
    for v in range(5):
        add(f'wallcap_{v}', tile_wall_cap(v))
    for v in range(4):
        add(f'wallface_{v}', tile_wall_face(v))
    add('plate', tile_wall_cap(1))
    add('crate', tile_crate())
    add('barrel_red', tile_barrel(True))
    add('barrel_green', tile_barrel(False))
    add('terminal', tile_terminal())
    add('server', tile_server())
    add('pipe', tile_pipe())
    add('door_closed', tile_door(False))
    add('door_open', tile_door(True))
    add('portal', tile_portal(0))
    add('spawnpad', tile_spawn_pad())
    add('wallcap_x', tile_wall_cap(3))
    make_sheet(tiles, 12, f'{outdir}/tileset.png')
    with open(f'{outdir}/tileset.json', 'w') as f:
        json.dump({n: i for i, n in enumerate(names)}, f, indent=1)
    return f'{outdir}/tileset.png'


def gen_portal_fx(outdir):
    frames = [tile_portal(i) for i in range(6)]
    return anim_strip(frames, f'{outdir}/fx_portal.png')


# ============================================================ PARALLAX
def gen_bg(outdir):
    # cielo
    sky = Px(480, 272)
    top = (12, 6, 30, 255)
    mid = (36, 12, 62, 255)
    bot = (10, 22, 46, 255)
    for y in range(272):
        t = y / 271
        c = mix(top, mid, min(1, t * 1.6)) if t < 0.55 else mix(mid, bot, (t - 0.55) / 0.45)
        sky.hline(0, 479, y, c)
    # luna/luna holografica
    sky.circle(392, 54, 18, C('mag_d'))
    sky.circle(392, 54, 15, C('magenta'))
    sky.ring(392, 54, 17, C('mag_l'), 1)
    sky.circle(388, 50, 4, C('mag_l'))
    sky.circle(398, 60, 3, C('magenta'))
    # estrellas
    random.seed(7)
    for _ in range(90):
        x, y = random.randint(0, 479), random.randint(0, 150)
        b = random.choice([C('white'), C('cyan_l'), C('purp_l'), C('mag_l')])
        sky.set(x, y, b)
    for _ in range(14):
        x, y = random.randint(0, 470), random.randint(0, 110)
        sky.hline(x, x + 1, y, C('white'))
        sky.set(x - 1, y, C('cyan_l'))
    sky.save(f'{outdir}/bg_sky.png')

    # skyline lejano (tileable 480)
    far = Px(480, 140)
    random.seed(21)
    x = 0
    while x < 480:
        w = random.randint(20, 46)
        h = random.randint(40, 110)
        far.rect(x, 140 - h, w, h, C('dark1'))
        far.rect(x, 140 - h, w, 2, C('dark2'))
        # antenas
        if random.random() < 0.4:
            ax = x + w // 2
            far.vline(ax, 140 - h - random.randint(6, 14), 140 - h, C('dark2'))
            far.set(ax, 140 - h - random.randint(6, 14), C('red'))
        # ventanas
        for wy in range(140 - h + 6, 136, 6):
            for wx in range(x + 3, x + w - 2, 5):
                if random.random() < 0.28:
                    far.set(wx, wy, random.choice([C('cyan_d'), C('purp_d'), C('mag_d')]))
        x += w + random.randint(2, 10)
    far.save(f'{outdir}/bg_far.png')

    # edificios medios con neones (tileable 480x170)
    m = Px(480, 170)
    random.seed(33)
    x = 0
    while x < 480:
        w = random.randint(34, 70)
        h = random.randint(70, 160)
        m.rect(x, 170 - h, w, h, C('dark2'))
        m.rect(x + 1, 170 - h + 1, w - 2, h - 1, C('dark1'))
        m.hline(x, x + w - 1, 170 - h, C('dark3'))
        # ventanas iluminadas
        for wy in range(170 - h + 6, 166, 7):
            for wx in range(x + 4, x + w - 4, 6):
                r = random.random()
                if r < 0.18:
                    m.rect(wx, wy, 3, 4, C('cyan_d'))
                    m.set(wx, wy, C('cyan'))
                elif r < 0.32:
                    m.rect(wx, wy, 3, 4, C('mag_d'))
                    m.set(wx, wy, C('magenta'))
                elif r < 0.42:
                    m.rect(wx, wy, 3, 4, C('yellow') if random.random() < 0.3 else C('steel'))
        # letrero neon vertical
        if random.random() < 0.5 and h > 90:
            nx = x + w - 8
            ny = 170 - h + 12
            col = random.choice(['cyan', 'magenta', 'purple'])
            for i in range(random.randint(3, 7)):
                m.rect(nx, ny + i * 9, 5, 7, C(col))
                m.rect(nx + 1, ny + i * 9 + 1, 3, 5, C('dark1'))
            m.rect(nx - 1, ny - 2, 7, 2, C('steel'))
        x += w + random.randint(4, 14)
    m.save(f'{outdir}/bg_mid.png')

    # primer plano: cables, tuberias (tileable 480x80, transparente)
    n = Px(480, 90)
    random.seed(55)
    # cables colgando
    for i in range(5):
        x0 = random.randint(0, 460)
        x1 = x0 + random.randint(60, 140)
        y0 = random.randint(4, 22)
        sag = random.randint(8, 24)
        steps = 30
        for s in range(steps + 1):
            t = s / steps
            x = x0 + (x1 - x0) * t
            y = y0 + math.sin(math.pi * t) * sag
            n.set(x, y, C('dark3'))
            n.set(x, y + 1, C('ink'))
    # tuberia horizontal
    n.rect(0, 66, 480, 5, C('dark3'))
    n.hline(0, 479, 66, C('steel'))
    n.hline(0, 479, 70, C('ink'))
    for x in range(20, 480, 90):
        n.rect(x, 63, 8, 11, C('steel'))
        n.rect(x + 2, 64, 4, 9, C('dark3'))
    n.save(f'{outdir}/bg_near.png')

    # niebla
    fog = Px(480, 120)
    random.seed(77)
    for _ in range(60):
        x = random.randint(0, 479)
        y = random.randint(60, 119)
        fog.ellipse(x, y, random.randint(20, 50), random.randint(4, 10), (123, 63, 242, 18))
    for _ in range(40):
        x = random.randint(0, 479)
        y = random.randint(70, 119)
        fog.ellipse(x, y, random.randint(15, 40), random.randint(3, 8), (25, 200, 220, 14))
    fog.save(f'{outdir}/bg_fog.png')


# ============================================================ FX
def gen_fx(outdir):
    # slash (arco de energia)
    frames = []
    for i in range(5):
        q = Px(32, 32)
        prog = i / 4
        for a in range(-70, 71, 2):
            ang = math.radians(a)
            r = 15
            x = 16 + math.cos(ang) * r
            y = 16 + math.sin(ang) * r
            al = int(255 * (1 - abs(a) / 90))
            col = C('cyan_l')[:3] + (al,)
            q.set(x, y, col)
            q.set(x + math.cos(ang), y + math.sin(ang), C('cyan_d')[:3] + (al // 2,))
        # brillo interior que se desvanece
        for a in range(-60, 61, 3):
            ang = math.radians(a + prog * 20)
            r = 11
            x = 16 + math.cos(ang) * r
            y = 16 + math.sin(ang) * r
            al = int(200 * (1 - prog))
            q.set(x, y, C('white')[:3] + (al,))
        frames.append(q)
    anim_strip(frames, f'{outdir}/fx_slash.png')

    # impacto / chispas
    frames = []
    random.seed(101)
    for i in range(4):
        q = Px(20, 20)
        n = 8 - i * 2
        for k in range(n):
            a = random.random() * math.tau
            r = 2 + i * 3
            x = 10 + math.cos(a) * r
            y = 10 + math.sin(a) * r
            q.set(x, y, random.choice([C('white'), C('cyan_l'), C('yellow')]))
            if i < 2:
                q.set(x - math.cos(a) * 2, y - math.sin(a) * 2, C('yellow'))
        if i == 0:
            q.circle(10, 10, 3, C('white'))
        frames.append(q)
    anim_strip(frames, f'{outdir}/fx_hit.png')

    # explosion
    frames = []
    random.seed(202)
    for i in range(6):
        q = Px(32, 32)
        r = 3 + i * 4
        if i < 4:
            q.circle(16, 16, max(1, r - 3), C('yellow'))
            q.circle(16, 16, max(1, r - 5), C('white'))
        q.ring(16, 16, r, C('orange'), 2)
        q.ring(16, 16, r + 1, C('red')[:3] + (140,), 1)
        for k in range(10):
            a = random.random() * math.tau
            rr = r + random.randint(0, 6)
            x = 16 + math.cos(a) * rr
            y = 16 + math.sin(a) * rr
            q.set(x, y, random.choice([C('orange'), C('yellow'), C('red')]))
        frames.append(q)
    anim_strip(frames, f'{outdir}/fx_explosion.png')

    # dash trail (4 frames de siluetas)
    frames = []
    for i in range(4):
        q = Px(26, 26)
        al = 150 - i * 35
        for k in range(3):
            x0 = 4 + k * 4 + i * 3
            q.rect(x0, 10, 3, 6, C('cyan')[:3] + (max(20, al - k * 30),))
            q.rect(x0 + 1, 8, 2, 2, C('cyan_l')[:3] + (max(20, al - k * 30),))
        q.hline(2, 20 - i * 3, 9, C('cyan_l')[:3] + (al,))
        q.hline(4, 22 - i * 3, 16, C('cyan')[:3] + (al,))
        frames.append(q)
    anim_strip(frames, f'{outdir}/fx_dash.png')

    # proyectil del jugador (dardo de plasma horizontal)
    frames = []
    for i in range(2):
        q = Px(14, 8)
        q.rect(1, 2, 9, 4, C('cyan_d'))
        q.rect(2, 2, 8, 3, C('cyan'))
        q.hline(3, 9, 3, C('cyan_l'))
        q.tri((10, 1), (13, 4), (10, 6), C('cyan_l'))
        q.set(1, 3, C('white'))
        if i:
            q.set(13, 3, C('white'))
        frames.append(q)
    anim_strip(frames, f'{outdir}/fx_bolt.png')

    # orbe enemigo
    frames = []
    for i in range(4):
        q = Px(10, 10)
        q.circle(5, 5, 4, C('red_d'))
        q.circle(5, 5, 3, C('red'))
        q.circle(5, 5, 2, C('orange'))
        ang = i * 90
        q.set(5 + math.cos(math.radians(ang)) * 3, 5 + math.sin(math.radians(ang)) * 3, C('yellow'))
        q.set(4, 4, C('white'))
        frames.append(q)
    anim_strip(frames, f'{outdir}/fx_orb.png')

    # onda de choque
    frames = []
    for i in range(5):
        q = Px(40, 40)
        r = 4 + i * 8
        a = max(30, 255 - i * 55)
        q.ring(20, 20, r, C('cyan_l')[:3] + (a,), 2)
        q.ring(20, 20, r - 2, C('cyan')[:3] + (a // 2,), 1)
        frames.append(q)
    anim_strip(frames, f'{outdir}/fx_shockwave.png')

    # teletransporte / spawn enemigo
    frames = []
    for i in range(5):
        q = Px(24, 24)
        h = 2 + i * 4
        q.rect(4, 24 - h, 16, h, C('mag_d')[:3] + (200 - i * 30,))
        q.rect(7, 24 - h + 2, 10, max(1, h - 2), C('magenta')[:3] + (150,))
        q.hline(4, 19, 23 - h, C('mag_l')[:3] + (220,))
        frames.append(q)
    anim_strip(frames, f'{outdir}/fx_spawn.png')

    # hud de escudo
    frames = []
    for i in range(3):
        q = Px(40, 40)
        q.ring(20, 20, 17, C('cyan_d')[:3] + (90 + i * 50,), 2)
        for a in range(0, 360, 45):
            ang = math.radians(a + i * 15)
            q.set(20 + math.cos(ang) * 17, 20 + math.sin(ang) * 17, C('cyan_l')[:3] + (200,))
        frames.append(q)
    anim_strip(frames, f'{outdir}/fx_shield.png')


# ============================================================ PICKUPS
def gen_pickups(outdir):
    # chip (moneda)
    frames = []
    for i in range(4):
        q = Px(12, 12)
        w = [5, 3, 1, 3][i]
        q.ellipse(6, 6, w, 5, C('green_d'))
        q.ellipse(6, 6, max(1, w - 1), 4, C('green'))
        if w > 1:
            q.hline(6 - w + 1, 5 + w, 5, C('green_l'))
        q.set(6, 6, C('white'))
        for k in range(4):
            if w > 2:
                q.set(6, 2 + k * 3, C('green_l'))
        frames.append(q)
    anim_strip(frames, f'{outdir}/pickup_chip.png')

    # celda de vida
    frames = []
    for i in range(2):
        q = Px(12, 12)
        q.rect(2, 2, 8, 9, C('steel'))
        q.rect(3, 3, 6, 7, C('white'))
        q.rect(4, 2, 4, 1, C('gray'))
        q.rect(4, 4, 4, 2, C('red'))
        q.rect(5, 4, 2, 5, C('red'))
        q.rect(4, 5, 4, 2, C('red'))
        q.set(4, 4, C('red_l'))
        q.hline(3, 8, 10, C('dark3'))
        if i:
            q.set(4, 3, C('white'))
        frames.append(q)
    anim_strip(frames, f'{outdir}/pickup_heal.png')

    # modulo (mejora)
    frames = []
    for i in range(4):
        q = Px(14, 14)
        q.rect(2, 2, 10, 10, C('purp_d'))
        q.rect(3, 3, 8, 8, C('purple'))
        q.rect(4, 4, 6, 6, C('dark1'))
        q.rect(5, 5, 4, 4, C('purp_l'))
        q.set(6, 6, C('cyan_l'))
        for k in range(4):
            dirs = [(0, -1), (1, 0), (0, 1), (-1, 0)]
            dx, dy = dirs[(k + i) % 4]
            q.rect(6 + dx * 4, 6 + dy * 4, 2, 2, C('cyan'))
        frames.append(q)
    anim_strip(frames, f'{outdir}/pickup_mod.png')

    # moneda meta (rombo dorado)
    frames = []
    for i in range(4):
        q = Px(12, 12)
        q.tri((6, 1), (11, 6), (6, 11), C('yellow'))
        q.tri((6, 1), (1, 6), (6, 11), C('orange'))
        q.tri((6, 2), (9, 6), (6, 6), C('white'))
        q.set(6, 6, C('yellow'))
        frames.append(q)
    anim_strip(frames, f'{outdir}/pickup_coin.png')

    # llave de puerta / acceso
    q = Px(14, 14)
    q.ring(4, 7, 3, C('yellow'), 1)
    q.rect(5, 6, 8, 2, C('yellow'))
    q.rect(10, 8, 2, 2, C('yellow'))
    q.rect(12, 8, 1, 3, C('yellow'))
    q.set(3, 7, C('white'))
    q.save(f'{outdir}/pickup_key.png')


# ============================================================ PROPS
def gen_props(outdir):
    # lampara neon
    frames = []
    for i in range(3):
        q = Px(16, 32)
        q.rect(6, 0, 4, 18, C('steel'))
        q.rect(7, 0, 2, 18, C('steel_l'))
        q.rect(3, 18, 10, 6, C('dark3'))
        glow = [C('cyan'), C('cyan_l'), C('cyan')][i]
        q.rect(4, 20, 8, 4, glow)
        q.rect(5, 21, 6, 2, C('white'))
        for k in range(3):
            q.hline(4 - k, 11 + k, 24 + k, C('cyan_d')[:3] + (90 - k * 25,))
        frames.append(q)
    anim_strip(frames, f'{outdir}/prop_lamp.png')

    # holograma / letrero
    frames = []
    for i in range(4):
        q = Px(22, 22)
        q.rect(2, 3, 18, 12, C('cyan_d')[:3] + (120,))
        q.rect(3, 4, 16, 10, C('cyan')[:3] + (60,))
        off = i % 2
        for x in range(4, 18, 4):
            q.rect(x + off, 6, 2, 6, C('cyan_l')[:3] + (170,))
        q.hline(2, 19, 3, C('cyan'))
        q.hline(2, 19, 14, C('cyan'))
        q.vline(2, 3, 14, C('cyan'))
        q.vline(19, 3, 14, C('cyan'))
        q.rect(9, 15, 4, 4, C('steel'))
        q.rect(6, 19, 10, 2, C('dark3'))
        frames.append(q)
    anim_strip(frames, f'{outdir}/prop_holo.png')

    # planta / contenedor decorativo
    q = Px(14, 18)
    q.rect(3, 10, 8, 8, C('dark3'))
    q.rect(4, 11, 6, 6, C('steel'))
    q.hline(3, 10, 10, C('steel_l'))
    q.ellipse(7, 6, 4, 5, C('cyan_d'))
    q.ellipse(7, 5, 3, 4, C('cyan'))
    q.set(6, 4, C('cyan_l')); q.set(8, 6, C('cyan_l'))
    q.vline(7, 8, 10, C('green_d'))
    q.outline(C('ink'))
    q.save(f'{outdir}/prop_plant.png')

    # ventilador de techo / dron decorativo
    frames = []
    for i in range(4):
        q = Px(18, 10)
        q.rect(2, 4, 14, 3, C('steel'))
        q.rect(3, 5, 12, 1, C('dark3'))
        for k in range(3):
            x = 4 + k * 5
            q.rect(x, 2, 2, 7, C('steel_l') if (k + i) % 2 else C('dark3'))
        q.set(9, 3, C('cyan'))
        frames.append(q)
    anim_strip(frames, f'{outdir}/prop_fan.png')


# ============================================================ ICONOS (mejoras)
ICONS = [
    ('dmg',      'sword'),
    ('aspd',     'bolt'),
    ('hp',       'heart'),
    ('heal',     'cross'),
    ('dash',     'dash'),
    ('crit',     'star'),
    ('shield',   'shield'),
    ('magnet',   'magnet'),
    ('speed',    'boot'),
    ('multi',    'triple'),
    ('pierce',   'arrow'),
    ('lifesteal','drop'),
    ('thorns',   'spike'),
    ('lucky',    'clover'),
    ('bomb',     'bomb'),
    ('range',    'ring'),
    ('longsword','longsword'),
    ('chip',     'chip'),
    ('armor',    'armor'),
    ('revive',   'phoenix'),
    ('freeze',   'snow'),
    ('venom',    'flask'),
    ('laser',    'laser'),
    ('turret',   'turret'),
]

def icon_glyph(name, s=16):
    q = Px(s, s)
    w = C('white')
    cy = s // 2
    if name == 'sword':
        q.line(3, 12, 12, 3, C('cyan_l'))
        q.line(4, 12, 12, 4, C('cyan'))
        q.line(4, 13, 11, 13, C('steel'))
        q.line(4, 12, 4, 13, C('steel_l'))
        q.set(13, 2, C('white'))
    elif name == 'longsword':
        q.line(2, 13, 13, 2, C('cyan_l'))
        q.line(3, 13, 13, 3, C('cyan'))
        q.hline(2, 6, 11, C('steel_l'))
        q.vline(5, 9, 13, C('steel_l'))
        q.set(13, 2, C('white'))
    elif name == 'bolt':
        q.poly([(9, 2), (5, 9), (8, 9), (6, 14), (12, 6), (9, 6)], C('yellow'))
        q.line(8, 9, 6, 13, C('white'))
    elif name == 'heart':
        q.ellipse(5, 6, 3, 3, C('red'))
        q.ellipse(10, 6, 3, 3, C('red'))
        q.tri((2, 7), (13, 7), (7, 13), C('red'))
        q.ellipse(4, 5, 1, 1, C('red_l'))
        q.set(5, 4, C('white'))
    elif name == 'cross':
        q.rect(6, 2, 4, 12, C('white'))
        q.rect(2, 6, 12, 4, C('white'))
        q.rect(7, 3, 2, 10, C('red'))
        q.rect(3, 7, 10, 2, C('red'))
    elif name == 'dash':
        for k in range(3):
            q.hline(2, 10 - k * 2, 4 + k * 4, C('cyan_l') if k == 1 else C('cyan'))
            q.tri((10 - k * 2, 1 + k * 4 + (3 if k < 2 else 0)), (14 - k, 4 + k * 4), (10 - k * 2, 7 + k * 4), C('cyan'))
    elif name == 'star':
        pts = []
        for i in range(10):
            a = math.radians(-90 + i * 36)
            r = 6 if i % 2 == 0 else 2.6
            pts.append((8 + math.cos(a) * r, 8 + math.sin(a) * r))
        q.poly(pts, C('yellow'))
        q.circle(8, 8, 2, C('white'))
    elif name == 'shield':
        q.poly([(8, 1), (14, 4), (13, 11), (8, 15), (3, 11), (2, 4)], C('cyan_d'))
        q.poly([(8, 3), (12, 5), (11, 10), (8, 13), (5, 10), (4, 5)], C('cyan'))
        q.vline(8, 4, 12, C('cyan_l'))
        q.set(8, 3, C('white'))
    elif name == 'magnet':
        # herradura roja con puntas metalicas
        q.rect(2, 2, 4, 8, C('red'))
        q.rect(10, 2, 4, 8, C('red'))
        q.rect(2, 8, 12, 4, C('red'))
        q.rect(3, 3, 1, 6, C('red_l'))
        q.rect(11, 3, 1, 6, C('red_l'))
        q.rect(2, 9, 12, 1, C('red_l'))
        q.rect(2, 2, 4, 3, C('steel_l'))
        q.rect(10, 2, 4, 3, C('steel_l'))
        q.hline(2, 5, 2, C('white'))
        q.hline(10, 13, 2, C('white'))
        q.rect(6, 6, 4, 3, C('dark1'))
    elif name == 'boot':
        # zapatilla vista de lado
        q.rect(4, 3, 4, 7, C('cyan_d'))
        q.rect(2, 6, 3, 4, C('steel'))
        q.poly([(2, 9), (11, 6), (14, 11), (11, 12), (3, 12)], C('cyan'))
        q.hline(2, 14, 13, C('dark3'))
        q.hline(2, 14, 12, C('ink'))
        q.hline(4, 7, 5, C('cyan_l'))
        q.hline(4, 7, 7, C('cyan_l'))
        q.hline(4, 7, 9, C('cyan_l'))
        q.set(12, 10, C('white'))
        # lineas de velocidad
        q.hline(0, 3, 2, C('cyan_l'))
        q.hline(0, 2, 4, C('cyan'))
    elif name == 'triple':
        for k, x in enumerate([3, 7, 11]):
            q.rect(x, 4, 2, 8, C('cyan_l') if k == 1 else C('cyan'))
            q.tri((x, 12), (x + 2, 12), (x + 1, 14), C('cyan'))
        q.hline(3, 12, 2, C('purp_l'))
    elif name == 'arrow':
        q.hline(2, 10, 8, C('cyan_l'))
        q.tri((10, 4), (15, 8), (10, 12), C('cyan'))
        q.hline(2, 5, 5, C('steel'))
        q.hline(2, 5, 11, C('steel'))
    elif name == 'drop':
        q.ellipse(8, 10, 4, 4, C('red'))
        q.tri((8, 1), (4, 10), (12, 10), C('red'))
        q.ellipse(7, 9, 2, 2, C('red_l'))
        q.set(6, 8, C('white'))
    elif name == 'spike':
        q.tri((8, 1), (12, 14), (4, 14), C('steel_l'))
        q.hline(4, 11, 12, C('steel'))
        for k in range(3):
            q.set(7 + k, 5 + k * 2, C('white'))
    elif name == 'clover':
        q.circle(5, 5, 3, C('green'))
        q.circle(11, 5, 3, C('green'))
        q.circle(5, 11, 3, C('green'))
        q.circle(11, 11, 3, C('green'))
        q.circle(8, 8, 2, C('green_l'))
        q.vline(8, 10, 14, C('green_d'))
    elif name == 'bomb':
        q.circle(8, 9, 5, C('dark2'))
        q.circle(6, 7, 2, C('steel'))
        q.rect(7, 2, 2, 3, C('steel'))
        q.set(9, 2, C('yellow'))
        q.set(10, 1, C('orange'))
        q.set(10, 0, C('red_l'))
    elif name == 'ring':
        q.ring(8, 8, 6, C('cyan'), 2)
        q.ring(8, 8, 3, C('cyan_l'), 1)
        q.set(8, 8, C('white'))
    elif name == 'chip':
        q.rect(3, 3, 10, 10, C('green_d'))
        q.rect(4, 4, 8, 8, C('green'))
        q.rect(6, 6, 4, 4, C('dark1'))
        for k in range(3):
            q.rect(5 + k * 3, 1, 1, 2, C('green_l'))
            q.rect(5 + k * 3, 13, 1, 2, C('green_l'))
            q.rect(1, 5 + k * 3, 2, 1, C('green_l'))
            q.rect(13, 5 + k * 3, 2, 1, C('green_l'))
    elif name == 'armor':
        # peto con hombreras
        q.rect(1, 2, 4, 4, C('steel_l'))
        q.rect(11, 2, 4, 4, C('steel_l'))
        q.poly([(5, 3), (11, 3), (12, 9), (8, 14), (4, 9)], C('steel'))
        q.poly([(6, 4), (10, 4), (11, 8), (8, 12), (5, 8)], C('steel_l'))
        q.tri((6, 4), (8, 7), (10, 4), C('dark3'))
        q.hline(6, 10, 9, C('dark3'))
        q.hline(6, 9, 10, C('dark3'))
        q.set(8, 6, C('cyan'))
        q.hline(1, 4, 2, C('white'))
        q.hline(11, 14, 2, C('white'))
    elif name == 'phoenix':
        q.tri((8, 1), (12, 8), (4, 8), C('orange'))
        q.tri((8, 3), (10, 8), (6, 8), C('yellow'))
        q.ellipse(8, 10, 5, 4, C('orange'))
        q.ellipse(8, 10, 3, 2, C('yellow'))
        q.set(8, 13, C('white'))
        q.tri((3, 5), (1, 1), (6, 3), C('red'))
        q.tri((13, 5), (15, 1), (10, 3), C('red'))
    elif name == 'snow':
        for a in range(0, 360, 60):
            ang = math.radians(a)
            q.line(8, 8, 8 + math.cos(ang) * 6, 8 + math.sin(ang) * 6, C('cyan_l'))
        q.circle(8, 8, 2, C('white'))
    elif name == 'flask':
        q.rect(6, 2, 4, 4, C('steel_l'))
        q.rect(7, 3, 2, 3, C('green_l'))
        q.poly([(4, 6), (12, 6), (14, 14), (2, 14)], C('steel'))
        q.poly([(5, 8), (11, 8), (12, 13), (4, 13)], C('green'))
        q.set(6, 10, C('green_l'))
        q.set(9, 11, C('white'))
    elif name == 'laser':
        q.hline(1, 14, 8, C('red'))
        q.hline(1, 14, 7, C('white'))
        q.rect(1, 5, 3, 7, C('steel'))
        q.rect(12, 5, 3, 7, C('steel'))
        q.set(2, 6, C('red_l'))
    elif name == 'turret':
        q.rect(3, 9, 10, 5, C('steel'))
        q.rect(4, 10, 8, 3, C('dark3'))
        q.circle(8, 6, 3, C('steel_l'))
        q.rect(8, 4, 6, 2, C('cyan'))
        q.set(9, 6, C('red'))
    else:
        q.rect(4, 4, 8, 8, w)
    q.outline(C('ink'))
    return q


def gen_icons(outdir):
    frames = [icon_glyph(name) for _, name in ICONS]
    make_sheet(frames, 8, f'{outdir}/icons_mods.png')
    return [n for n, _ in ICONS]


# ============================================================ HUD
def gen_hud(outdir):
    # marco de barra de vida
    q = Px(64, 10)
    q.rect(0, 0, 64, 10, C('ink'))
    q.rect(1, 1, 62, 8, C('dark3'))
    q.rect(2, 2, 60, 6, C('dark1'))
    q.save(f'{outdir}/hud_bar_frame.png')

    # relleno de vida (blanco -> tinte en codigo)
    q = Px(60, 6, C('white'))
    q.hline(0, 59, 0, C('white'))
    q.hline(0, 59, 5, C('gray'))
    q.save(f'{outdir}/hud_bar_fill.png')

    # corazon pequeno hud
    q = Px(10, 9)
    q.ellipse(3, 3, 2, 2, C('red'))
    q.ellipse(6, 3, 2, 2, C('red'))
    q.tri((1, 4), (8, 4), (4, 8), C('red'))
    q.set(3, 2, C('white'))
    q.outline(C('ink'))
    q.save(f'{outdir}/hud_heart.png')

    # marco de slot de mejora
    for size, name in [(20, 'hud_slot'), (24, 'hud_slot_sel')]:
        q = Px(size, size)
        q.rect(0, 0, size, size, C('ink'))
        q.rect(1, 1, size - 2, size - 2, C('steel'))
        q.rect(2, 2, size - 4, size - 4, C('dark2'))
        q.hline(2, size - 3, 2, C('dark3'))
        if name.endswith('sel'):
            q.rect(0, 0, size, 1, C('cyan_l'))
            q.rect(0, size - 1, size, 1, C('cyan_l'))
            q.rect(0, 0, 1, size, C('cyan_l'))
            q.rect(size - 1, 0, 1, size, C('cyan_l'))
        q.save(f'{outdir}/{name}.png')

    # botones tactiles
    for name, col in [('btn_attack', 'magenta'), ('btn_jump', 'cyan'), ('btn_dash', 'purple')]:
        q = Px(40, 40)
        q.circle(20, 20, 19, C('dark2')[:0] + (0, 0, 0, 0))
        q.circle(20, 20, 19, C('dark2')[:3] + (170,))
        q.ring(20, 20, 19, C(col)[:3] + (255,), 2)
        q.ring(20, 20, 15, C(col)[:3] + (90,), 1)
        q.save(f'{outdir}/{name}.png')

    # joystick base + perilla
    q = Px(56, 56)
    q.circle(28, 28, 26, C('dark1')[:3] + (120,))
    q.ring(28, 28, 26, C('steel')[:3] + (180,), 2)
    q.ring(28, 28, 18, C('dark3')[:3] + (120,), 1)
    q.save(f'{outdir}/joy_base.png')
    q = Px(28, 28)
    q.circle(14, 14, 13, C('dark3')[:3] + (220,))
    q.ring(14, 14, 13, C('cyan'), 2)
    q.circle(14, 14, 8, C('cyan_d')[:3] + (200,))
    q.circle(12, 11, 3, C('cyan_l')[:3] + (180,))
    q.save(f'{outdir}/joy_knob.png')

    # mira
    q = Px(14, 14)
    q.ring(7, 7, 5, C('cyan_l'), 1)
    q.hline(0, 2, 7, C('cyan_l')); q.hline(11, 13, 7, C('cyan_l'))
    q.vline(7, 0, 2, C('cyan_l')); q.vline(7, 11, 13, C('cyan_l'))
    q.set(7, 7, C('magenta'))
    q.save(f'{outdir}/hud_reticle.png')

    # panel de mejora
    q = Px(96, 56)
    q.rect(0, 0, 96, 56, C('ink'))
    q.rect(1, 1, 94, 54, C('steel'))
    q.rect(2, 2, 92, 52, C('dark2'))
    q.rect(3, 3, 90, 50, C('dark1'))
    q.hline(3, 92, 3, C('purp_d'))
    q.hline(3, 92, 52, C('purp_d'))
    q.vline(3, 3, 52, C('purp_d'))
    q.vline(92, 3, 52, C('purp_d'))
    for x, y in [(2, 2), (93, 2), (2, 53), (93, 53)]:
        q.set(x, y, C('cyan'))
    q.save(f'{outdir}/panel_card.png')

    # popup dano / criticos
    q = Px(3, 5, C('white'))
    q.save(f'{outdir}/px_white.png')


# ============================================================ LOGO
def gen_logo(outdir):
    q = Px(240, 96)
    # texto principal con glow
    glow = Px(240, 96)
    text_px(glow, 'NEON', 30, 14, C('cyan')[:3] + (90,), 4, 2)
    text_px(glow, 'RIFT', 108, 44, C('magenta')[:3] + (90,), 4, 2)
    from PIL import ImageFilter
    gim = glow.img().filter(ImageFilter.GaussianBlur(3))
    q.img_gauss = gim

    # sombra
    text_px(q, 'NEON', 32, 18, C('ink'), 4, 2)
    text_px(q, 'RIFT', 110, 48, C('ink'), 4, 2)
    # relleno degradado simulado por filas
    tmp = Px(240, 96)
    text_px(tmp, 'NEON', 30, 14, C('white'), 4, 2)
    text_px(tmp, 'RIFT', 108, 44, C('white'), 4, 2)
    for y in range(96):
        for x in range(240):
            if tmp.px[y][x][3] > 0:
                if y < 40:
                    col = mix(C('cyan'), C('cyan_l'), (y - 14) / 26) if y >= 14 else C('cyan')
                else:
                    col = mix(C('magenta'), C('mag_l'), (y - 44) / 30) if y >= 44 else C('magenta')
                q.set(x, y, col)
    # brillo especular
    for y in range(96):
        for x in range(240):
            if tmp.px[y][x][3] > 0:
                if y in (20, 21, 50, 51) and (x + y) % 5 != 0:
                    q.set(x, y, C('white')[:3] + (170,))
    # linea decorativa
    q.hline(30, 210, 12, C('cyan_d'))
    q.hline(30, 150, 11, C('cyan'))
    q.hline(30, 210, 86, C('mag_d'))
    q.set(30, 12, C('cyan_l')); q.set(210, 12, C('cyan_l'))
    # subtitulo
    text_px(q, 'ROGUELIKE // CYBERPUNK', 62, 80, C('steel_l'), 1, 1)

    img = q.img()
    from PIL import Image
    base = Image.new('RGBA', (240, 96))
    base.alpha_composite(gim.crop((0, 0, 240, 96)))
    base.alpha_composite(img)
    base.save(f'{outdir}/logo.png')

    # favicon 32
    f = Px(32, 32)
    f.rect(0, 0, 32, 32, C('dark1'))
    f.rect(1, 1, 30, 30, C('dark2'))
    f.ring(16, 16, 13, C('cyan'), 1)
    f.ring(16, 16, 10, C('magenta'), 1)
    text_px(f, 'N', 12, 12, C('cyan_l'), 2, 1)
    f.set(22, 9, C('mag_l')); f.set(9, 22, C('mag_l'))
    f.save(f'{outdir}/favicon.png')


# ============================================================ RUN
if __name__ == '__main__':
    import os, sys
    out = sys.argv[1] if len(sys.argv) > 1 else '../public/assets'
    os.makedirs(out, exist_ok=True)
    print('tileset  ->', gen_tileset(out))
    print('portal   ->', gen_portal_fx(out))
    gen_bg(out); print('fondos   -> ok')
    gen_fx(out); print('fx       -> ok')
    gen_pickups(out); print('pickups  -> ok')
    gen_props(out); print('props    -> ok')
    names = gen_icons(out); print('iconos   ->', len(names))
    gen_hud(out); print('hud      -> ok')
    gen_logo(out); print('logo     -> ok')


# ============================================================ EXTRAS
def gen_extra(outdir):
    from PIL import Image
    # puerta de energia (tileable vertical 16x32)
    frames = []
    for f in range(4):
        q = Px(16, 32)
        for y in range(32):
            for x in range(16):
                if x in (1, 2, 13, 14):
                    q.set(x, y, C('mag_d')[:3] + (210,))
                elif x in (7, 8):
                    q.set(x, y, C('magenta')[:3] + (120,))
        for k in range(4):
            y = (k * 8 + f * 2) % 32
            q.hline(2, 13, y, C('mag_l')[:3] + (230,))
            q.hline(3, 12, y + 1, C('magenta')[:3] + (110,))
        q.vline(0, 0, 31, C('dark3')[:3] + (255,))
        q.vline(15, 0, 31, C('dark3')[:3] + (255,))
        q.rect(0, 0, 16, 2, C('steel'))
        q.rect(0, 30, 16, 2, C('steel'))
        frames.append(q)
    anim_strip(frames, f'{outdir}/gate.png')

    # sombra de personaje
    q = Px(24, 8)
    q.ellipse(12, 4, 11, 3, (0, 0, 0, 110))
    q.ellipse(12, 4, 8, 2, (0, 0, 0, 90))
    q.save(f'{outdir}/shadow.png')

    # iconos de app (nearest, para manifest)
    logo = Image.open(f'{outdir}/favicon.png').convert('RGBA')
    for size in (192, 512):
        im = logo.resize((size, size), Image.NEAREST)
        bg = Image.new('RGBA', (size, size), (8, 8, 16, 255))
        bg.alpha_composite(im)
        import os
        bg.convert('RGB').save(os.path.join(outdir, '..', 'icon-%d.png' % size))

    # boton de sonido on/off
    for name, on in (('btn_sound_on', True), ('btn_sound_off', False)):
        q = Px(14, 14)
        q.rect(2, 5, 2, 4, C('white'))
        q.tri((4, 5), (8, 2), (8, 12), C('white'))
        q.tri((4, 9), (8, 2), (8, 12), C('white'))
        if on:
            for r in (2, 4):
                for a in range(-50, 51, 6):
                    ang = math.radians(a)
                    q.set(8 + math.cos(ang) * r, 7 + math.sin(ang) * r, C('cyan_l'))
        else:
            q.line(9, 4, 13, 10, C('red'))
            q.line(13, 4, 9, 10, C('red'))
        q.save(f'{outdir}/{name}.png')
