"""Personajes: jugador, enemigos, boss. Frames dibujados pixel a pixel."""
import math
from pxlib import Px, C, P, mix, make_sheet, anim_strip

FW = FH = 24  # frame del jugador


# ============================================================ JUGADOR
def _player_base(bob=0, torso_lean=0, legs='stand', legs_phase=0,
                 sword_pose='idle', scarf_phase=0, arm_pose='idle', eyes='normal'):
    q = Px(FW, FH)
    oy = bob
    cx = 11  # centro del cuerpo

    # ---- piernas ----
    hipx = cx
    if legs == 'stand':
        # pierna trasera
        q.rect(hipx - 3, 17, 3, 5, C('dark3'))
        q.rect(hipx - 3, 21, 4, 2, C('ink'))
        q.rect(hipx - 3, 21, 1, 1, C('cyan_d'))
        # pierna delantera
        q.rect(hipx + 1, 17, 3, 5, C('steel'))
        q.rect(hipx + 1, 21, 4, 2, C('ink'))
        q.rect(hipx + 3, 21, 1, 1, C('cyan_d'))
    elif legs == 'run':
        ph = legs_phase  # 0..2
        # trasera
        if ph == 0:
            q.rect(hipx - 4, 17, 3, 2, C('dark3')); q.rect(hipx - 5, 19, 2, 3, C('dark3')); q.rect(hipx - 6, 22, 3, 1, C('ink'))
        elif ph == 1:
            q.rect(hipx - 3, 17, 3, 4, C('dark3')); q.rect(hipx - 4, 21, 3, 2, C('ink'))
        else:
            q.rect(hipx - 2, 17, 3, 3, C('dark3')); q.rect(hipx - 1, 20, 2, 3, C('dark3')); q.rect(hipx, 22, 3, 1, C('ink'))
        # delantera
        if ph == 0:
            q.rect(hipx + 1, 17, 3, 3, C('steel')); q.rect(hipx + 2, 20, 2, 3, C('steel')); q.rect(hipx + 2, 22, 3, 1, C('ink'))
        elif ph == 1:
            q.rect(hipx + 1, 17, 3, 4, C('steel')); q.rect(hipx + 1, 21, 3, 2, C('ink'))
        else:
            q.rect(hipx + 1, 17, 3, 2, C('steel')); q.rect(hipx + 4, 19, 2, 3, C('steel')); q.rect(hipx + 5, 22, 3, 1, C('ink'))
    elif legs == 'jump':
        q.rect(hipx - 3, 17, 3, 3, C('dark3')); q.rect(hipx - 4, 19, 3, 2, C('ink'))
        q.rect(hipx + 1, 17, 3, 3, C('steel')); q.rect(hipx + 2, 19, 3, 2, C('ink'))
    elif legs == 'fall':
        q.rect(hipx - 3, 17, 3, 4, C('dark3')); q.rect(hipx - 4, 21, 3, 1, C('ink'))
        q.rect(hipx + 1, 17, 3, 4, C('steel')); q.rect(hipx + 2, 21, 3, 1, C('ink'))
    elif legs == 'dash':
        q.rect(hipx - 5, 18, 4, 2, C('dark3'))
        q.rect(hipx + 1, 18, 4, 2, C('steel'))
        q.rect(hipx - 2, 20, 4, 2, C('ink'))
    elif legs == 'kneel':
        q.rect(hipx - 4, 19, 5, 3, C('dark3')); q.rect(hipx - 5, 21, 6, 2, C('ink'))
        q.rect(hipx + 1, 19, 4, 2, C('steel'))

    # ---- torso (con lean) ---
    ty = 10 + oy
    q.rect(cx - 2 + torso_lean, ty, 6, 7, C('dark2'))
    q.rect(cx - 1 + torso_lean, ty + 1, 4, 4, C('dark1'))
    # placas
    q.hline(cx - 1 + torso_lean, cx + 2 + torso_lean, ty + 2, C('steel'))
    q.hline(cx - 1 + torso_lean, cx + 1 + torso_lean, ty + 4, C('steel'))
    q.set(cx + 2 + torso_lean, ty + 5, C('magenta'))
    q.set(cx + 2 + torso_lean, ty + 6, C('magenta'))
    # cinturon
    q.hline(cx - 2 + torso_lean, cx + 3 + torso_lean, ty + 6, C('mag_d'))
    q.set(cx + 1 + torso_lean, ty + 6, C('yellow'))

    # ---- bufanda ----
    sy = ty - 1
    q.hline(cx - 1 + torso_lean, cx + 3 + torso_lean, sy, C('magenta'))
    q.set(cx + 2 + torso_lean, sy - 0, C('mag_l'))
    # cola de bufanda ondeando hacia atras
    wave = [0, 1, 0, -1][scarf_phase % 4]
    q.set(cx - 2 + torso_lean, sy + 1, C('magenta'))
    q.set(cx - 3 + torso_lean, sy + 1 + wave, C('mag_d'))
    q.set(cx - 4 + torso_lean, sy + 2 + wave, C('mag_d'))
    q.set(cx - 5 + torso_lean, sy + 3 + wave, C('mag_d'))
    q.set(cx - 4 + torso_lean, sy + 3 + wave, C('magenta'))

    # ---- cabeza ----
    hy = 3 + oy + torso_lean // 2
    # casco
    q.rect(cx - 2 + torso_lean, hy, 6, 6, C('dark2'))
    q.rect(cx - 2 + torso_lean, hy, 6, 1, C('steel'))
    q.rect(cx - 1 + torso_lean, hy + 1, 4, 2, C('dark1'))
    # visor neon
    if eyes == 'normal':
        q.hline(cx - 1 + torso_lean, cx + 2 + torso_lean, hy + 3, C('cyan'))
        q.set(cx + 2 + torso_lean, hy + 3, C('cyan_l'))
    else:  # 'angry' / dash
        q.hline(cx - 1 + torso_lean, cx + 2 + torso_lean, hy + 3, C('magenta'))
        q.set(cx + 2 + torso_lean, hy + 3, C('mag_l'))
    # antenna + aleta del casco
    q.set(cx - 3 + torso_lean, hy + 1, C('steel'))
    q.set(cx - 4 + torso_lean, hy + 1, C('magenta'))
    q.set(cx - 5 + torso_lean, hy, C('mag_l'))
    q.set(cx + 3 + torso_lean, hy + 2, C('steel'))

    # ---- brazo delantero + espada ----
    hand_x, hand_y = cx + 4 + torso_lean, ty + 3
    if arm_pose == 'idle':
        q.rect(cx + 2 + torso_lean, ty + 1, 2, 3, C('steel'))
        q.rect(hand_x, ty + 3, 1, 1, C('gray'))
    elif arm_pose == 'run':
        q.rect(cx + 2 + torso_lean, ty + 2, 2, 2, C('steel'))
        hand_x, hand_y = cx + 4 + torso_lean, ty + 4
        q.set(hand_x, hand_y, C('gray'))
    elif arm_pose == 'jump':
        q.rect(cx + 2 + torso_lean, ty, 2, 2, C('steel'))
        hand_x, hand_y = cx + 4 + torso_lean, ty + 1
        q.set(hand_x, hand_y, C('gray'))
    elif arm_pose == 'attack':
        hand_x, hand_y = cx + 4 + torso_lean, ty + 2
        q.rect(cx + 2 + torso_lean, ty + 1, 3, 2, C('steel'))

    # brazo trasero
    q.rect(cx - 3 + torso_lean, ty + 1, 1, 3, C('dark3'))

    # espada
    sword_len = 8
    ang = {'idle': -25, 'up': -70, 'mid': -5, 'down': 40, 'thrust': 0, 'back': 150}[sword_pose]
    if sword_pose == 'thrust':
        x0, y0 = hand_x, hand_y
        x1, y1 = hand_x + 9, hand_y
        q.line(x0, y0, x1, y1, C('cyan'))
        q.line(x0, y0 - 1, x1, y1 - 1, C('cyan_l'))
        q.set(x1 + 1, y1, C('cyan_l'))
    else:
        rad = math.radians(ang)
        x1 = hand_x + math.cos(rad) * sword_len
        y1 = hand_y + math.sin(rad) * sword_len
        q.line(hand_x, hand_y, x1, y1, C('cyan_d'))
        # filo brillante
        nx = math.cos(rad - math.pi / 2)
        ny = math.sin(rad - math.pi / 2)
        q.line(hand_x + nx, hand_y + ny, x1 + nx, y1 + ny, C('cyan_l'))
        q.set(x1 + math.cos(rad), y1 + math.sin(rad), C('cyan_l'))
        # guarda
        gx, gy = hand_x + math.cos(rad) * 2, hand_y + math.sin(rad) * 2
        q.set(gx + nx * 1.2, gy + ny * 1.2, C('steel_l'))
        q.set(gx - nx * 1.2, gy - ny * 1.2, C('steel_l'))

    q.outline(C('ink'), diagonal=False)
    return q


def gen_player(outdir):
    frames = []
    tags = []
    # idle x4 (bob + bufanda)
    for i, (bob, sp) in enumerate([(0, 0), (1, 1), (1, 2), (0, 3)]):
        frames.append(_player_base(bob=bob, scarf_phase=sp))
        tags.append('idle')
    # run x6
    for i in range(6):
        ph = [0, 1, 2, 1, 0, 2][i]
        bob = [0, -1, 0, 0, -1, 0][i]
        frames.append(_player_base(bob=bob, legs='run', legs_phase=ph, scarf_phase=i,
                                   arm_pose='run', sword_pose='idle'))
        tags.append('run')
    # jump / fall
    frames.append(_player_base(legs='jump', arm_pose='jump', sword_pose='up', scarf_phase=0, bob=-1))
    tags.append('jump')
    frames.append(_player_base(legs='fall', arm_pose='jump', sword_pose='mid', scarf_phase=2))
    tags.append('fall')
    # attack x3
    for i, (sp, sc) in enumerate([('back', 0), ('up', 1), ('down', 2)]):
        frames.append(_player_base(arm_pose='attack', sword_pose=sp, scarf_phase=sc, torso_lean=0, bob=0))
        tags.append('attack')
    # dash
    frames.append(_player_base(legs='dash', arm_pose='attack', sword_pose='thrust',
                               scarf_phase=1, torso_lean=2, eyes='angry', bob=-1))
    tags.append('dash')
    # hurt
    hurt = _player_base(arm_pose='idle', sword_pose='down', scarf_phase=3, eyes='angry')
    for y in range(hurt.h):
        for x in range(hurt.w):
            p = hurt.px[y][x]
            if p[3] > 0:
                hurt.px[y][x] = mix(p, C('white'), 0.45)
    frames.append(hurt)
    tags.append('hurt')
    # death (arrodillado)
    frames.append(_player_base(legs='kneel', arm_pose='idle', sword_pose='down', scarf_phase=2, bob=3))
    tags.append('death')

    path = f'{outdir}/player.png'
    make_sheet(frames, 8, path)
    return path, tags, len(frames)


# ============================================================ ENEMIGOS
def _drone(phase=0, hurt=False):
    q = Px(16, 16)
    bob = [0, -1, 0, 1][phase % 4]
    cy = 8 + bob
    # cuerpo
    q.ellipse(8, cy, 4, 4, C('dark2'))
    q.ellipse(8, cy - 1, 4, 3, C('dark3'))
    q.hline(6, 10, cy - 3, C('steel'))
    # ojo
    q.ellipse(8, cy, 2, 2, C('mag_d'))
    q.ellipse(8, cy, 1, 1, C('magenta'))
    q.set(8, cy, C('mag_l'))
    # alas/rotores
    wing = 2 if phase % 2 == 0 else 4
    q.hline(1, 1 + wing, cy - 2, C('steel_l'))
    q.hline(15 - wing, 15, cy - 2, C('steel_l'))
    q.set(0, cy - 2, C('cyan'))
    q.set(15, cy - 2, C('cyan'))
    # antena
    q.vline(8, cy - 6, cy - 4, C('steel'))
    q.set(8, cy - 7, C('red'))
    # patas
    q.line(6, cy + 3, 5, cy + 5, C('steel'))
    q.line(10, cy + 3, 11, cy + 5, C('steel'))
    q.outline(C('ink'))
    if hurt:
        for y in range(q.h):
            for x in range(q.w):
                p = q.px[y][x]
                if p[3] > 0:
                    q.px[y][x] = mix(p, C('white'), 0.6)
    return q


def _crawler(phase=0, hurt=False):
    """Aranita robot violeta 20x14."""
    q = Px(20, 14)
    bob = [0, -1, 0, 0][phase % 4]
    cy = 7 + bob
    # patas (4 pares animadas)
    for i, lx in enumerate([3, 6, 13, 16]):
        up = 1 if (i + phase) % 2 == 0 else 0
        q.line(lx, cy + 1, lx - 2 + (i % 2) * 4, cy + 4 - up, C('steel'))
        q.set(lx - 2 + (i % 2) * 4, cy + 4 - up, C('steel_l'))
    # cuerpo
    q.ellipse(10, cy, 5, 3, C('purp_d'))
    q.ellipse(10, cy - 1, 4, 2, C('purple'))
    q.hline(7, 12, cy - 2, C('purp_l'))
    # ojos
    q.set(11, cy - 1, C('red'))
    q.set(12, cy - 1, C('red_l'))
    q.set(12, cy, C('red_d'))
    q.outline(C('ink'))
    if hurt:
        for y in range(q.h):
            for x in range(q.w):
                p = q.px[y][x]
                if p[3] > 0:
                    q.px[y][x] = mix(p, C('white'), 0.6)
    return q


def _brute(phase=0, hurt=False):
    """Bruto robot 28x30, naranja/rojo."""
    q = Px(28, 30)
    bob = [0, -1, -1, 0][phase % 4]
    # piernas
    leg = [0, 1, 0, -1][phase % 4]
    q.rect(8, 21, 4, 6 + leg, C('dark3'))
    q.rect(7, 26 + leg, 6, 3, C('ink'))
    q.rect(16, 21, 4, 6 - leg, C('dark3'))
    q.rect(16, 26 - leg, 6, 3, C('ink'))
    q.set(8, 27 + leg, C('orange')); q.set(20, 27 - leg, C('orange'))
    # torso
    ty = 6 + bob
    q.rect(6, ty + 4, 16, 12, C('steel'))
    q.rect(7, ty + 5, 14, 10, C('dark3'))
    q.hline(8, 19, ty + 6, C('steel_l'))
    # nucleo
    q.ellipse(14, ty + 10, 3, 3, C('red_d'))
    q.ellipse(14, ty + 10, 2, 2, C('orange'))
    q.set(14, ty + 10, C('yellow'))
    # hombros
    q.rect(3, ty + 4, 5, 6, C('steel'))
    q.rect(20, ty + 4, 5, 6, C('steel'))
    q.hline(3, 7, ty + 4, C('orange'))
    q.hline(20, 24, ty + 4, C('orange'))
    # brazos
    swing = [0, 1, 0, -1][phase % 4]
    q.rect(2, ty + 10, 4, 6 + swing, C('dark3'))
    q.rect(22, ty + 10, 4, 6 - swing, C('dark3'))
    q.rect(1, ty + 15 + swing, 5, 3, C('ink'))
    q.rect(22, ty + 15 - swing, 5, 3, C('ink'))
    # cabeza
    q.rect(10, ty, 8, 6, C('steel'))
    q.rect(11, ty + 1, 6, 3, C('dark1'))
    q.hline(11, 16, ty + 2, C('orange'))
    q.set(16, ty + 2, C('yellow'))
    q.set(14, ty - 2, C('steel_l'))
    q.set(14, ty - 1, C('red'))
    q.outline(C('ink'))
    if hurt:
        for y in range(q.h):
            for x in range(q.w):
                p = q.px[y][x]
                if p[3] > 0:
                    q.px[y][x] = mix(p, C('white'), 0.6)
    return q


def _mage(phase=0, hurt=False):
    """Cultista flotante 20x26, purpura/cian."""
    q = Px(20, 26)
    bob = [0, -1, -1, 0][phase % 4]
    oy = bob
    # tunica
    q.poly([(6, 10 + oy), (14, 10 + oy), (16, 22 + oy), (4, 22 + oy)], C('purp_d'))
    q.poly([(7, 11 + oy), (13, 11 + oy), (15, 21 + oy), (5, 21 + oy)], C('purple'))
    # runas en la tunica
    q.set(10, 15 + oy, C('cyan_l')); q.set(9, 16 + oy, C('cyan')); q.set(11, 16 + oy, C('cyan'))
    q.set(10, 17 + oy, C('cyan_l'))
    q.set(7, 19 + oy, C('purp_l')); q.set(13, 19 + oy, C('purp_l'))
    # borde inferior flotante (trapecios)
    q.hline(4, 16, 22 + oy, C('purp_l'))
    q.set(5, 23 + oy, C('purp_l')); q.set(15, 23 + oy, C('purp_l'))
    # capucha
    q.ellipse(10, 8 + oy, 5, 5, C('purp_d'))
    q.ellipse(10, 7 + oy, 4, 4, C('purple'))
    q.rect(7, 7 + oy, 6, 4, C('dark1'))
    q.set(8, 8 + oy, C('cyan_l')); q.set(12, 8 + oy, C('cyan_l'))
    q.set(8, 9 + oy, C('cyan')); q.set(12, 9 + oy, C('cyan'))
    # capucha punta
    q.set(10, 2 + oy, C('purple')); q.set(10, 3 + oy, C('purp_l'))
    # orbe
    q.ellipse(2, 13 + oy, 2, 2, C('cyan_d'))
    q.ellipse(2, 13 + oy, 1, 1, C('cyan_l'))
    q.set(3, 13 + oy, C('cyan'))
    # manos
    q.set(6, 13 + oy, C('purp_l')); q.set(14, 13 + oy, C('purp_l'))
    q.outline(C('ink'))
    if hurt:
        for y in range(q.h):
            for x in range(q.w):
                p = q.px[y][x]
                if p[3] > 0:
                    q.px[y][x] = mix(p, C('white'), 0.6)
    return q


def gen_enemies(outdir):
    out = {}
    # dron: idle 4 + hurt 1
    frames = [_drone(i) for i in range(4)] + [_drone(0, hurt=True)]
    out['drone'] = make_sheet(frames, 5, f'{outdir}/enemy_drone.png')
    # crawler
    frames = [_crawler(i) for i in range(4)] + [_crawler(0, hurt=True)]
    out['crawler'] = make_sheet(frames, 5, f'{outdir}/enemy_crawler.png')
    # brute
    frames = [_brute(i) for i in range(4)] + [_brute(0, hurt=True)]
    out['brute'] = make_sheet(frames, 5, f'{outdir}/enemy_brute.png')
    # mage
    frames = [_mage(i) for i in range(4)] + [_mage(0, hurt=True)]
    out['mage'] = make_sheet(frames, 5, f'{outdir}/enemy_mage.png')
    return out


# ============================================================ BOSS
def _boss(phase=0, hurt=False):
    """OVERSEER 64x64: nucleo mecanico con anillos."""
    q = Px(64, 64)
    bob = [0, -1, 0, 1][phase % 4]
    cy = 32 + bob
    # anillos externos giratorios: arcos continuos con huecos
    for ri, (r, c, off, gap) in enumerate([(27, C('purp_d'), 0, 70),
                                           (23, C('purple'), 120, 90),
                                           (19, C('cyan_d'), 240, 110)]):
        a = 0.0
        while a < 360:
            deg = a + phase * 10 + off
            ang = math.radians(deg)
            x = 32 + math.cos(ang) * r
            y = cy + math.sin(ang) * r * 0.82
            q.rect(x - 1, y - 1, 2, 2, c)
            # brillo en el borde exterior
            if ri == 1 and int(a) % 8 == 0:
                q.set(32 + math.cos(ang) * (r + 1), cy + math.sin(ang) * (r + 1) * 0.82, C('purp_l'))
            if ri == 2 and int(a) % 10 == 0:
                q.set(32 + math.cos(ang) * (r + 1), cy + math.sin(ang) * (r + 1) * 0.82, C('cyan'))
            a += 360.0 / (r * 3.2)   # paso fino => arco continuo
            if int(deg) % 360 < gap * 0.25:
                a += 0
        # hueco visible
        for k in range(3):
            ang = math.radians(phase * 10 + off + 200 + k * 8)
            x, y = 32 + math.cos(ang) * r, cy + math.sin(ang) * r * 0.82
            q.set(x, y, (0, 0, 0, 0))
    # brazos mecanicos
    for side in (-1, 1):
        sx = 32 + side * 20
        q.rect(sx - 3, cy - 4, 6, 8, C('steel'))
        q.rect(sx - 2, cy - 3, 4, 6, C('dark3'))
        q.set(sx, cy, C('red'))
        # garras
        for gy in (-1, 1):
            q.line(sx + side * 3, cy - 2 * gy, sx + side * 8, cy - 5 * gy, C('steel_l'))
            q.line(sx + side * 3, cy - 2 * gy + 1, sx + side * 8, cy - 5 * gy + 1, C('steel'))
    # cuerpo principal
    q.ellipse(32, cy, 14, 13, C('dark2'))
    q.ellipse(32, cy - 2, 13, 10, C('dark3'))
    q.ring(32, cy, 13, C('steel'), 2)
    # placas
    q.hline(24, 40, cy - 8, C('steel_l'))
    for x in (22, 26, 36, 42):
        q.rect(x, cy - 4, 2, 2, C('steel'))
        q.rect(x, cy + 4, 2, 2, C('steel'))
    # nucleo
    q.ellipse(32, cy, 6, 6, C('mag_d'))
    q.ellipse(32, cy, 4, 4, C('magenta'))
    q.ellipse(32, cy - 1, 2, 2, C('mag_l'))
    q.set(31, cy - 2, C('white'))
    # ojo escaner
    q.rect(28, cy - 12, 8, 3, C('dark1'))
    q.hline(29, 34, cy - 11, C('red'))
    q.set(34, cy - 11, C('yellow'))
    # antenas
    q.vline(24, cy - 20, cy - 16, C('steel'))
    q.set(24, cy - 21, C('cyan'))
    q.vline(40, cy - 20, cy - 16, C('steel'))
    q.set(40, cy - 21, C('cyan'))
    q.outline(C('ink'))
    if hurt:
        for y in range(q.h):
            for x in range(q.w):
                p = q.px[y][x]
                if p[3] > 0:
                    q.px[y][x] = mix(p, C('white'), 0.55)
    return q


def gen_boss(outdir):
    frames = [_boss(i) for i in range(4)] + [_boss(0, hurt=True)]
    return make_sheet(frames, 5, f'{outdir}/boss_overseer.png')
