"""Construye TODOS los assets de NEON RIFT y genera una hoja de contacto."""
import os, sys, glob
sys.path.insert(0, os.path.dirname(__file__))
from pxlib import contact_sheet
from gen_characters import gen_player, gen_enemies, gen_boss
from gen_world import (gen_tileset, gen_portal_fx, gen_bg, gen_fx, gen_pickups,
                       gen_props, gen_icons, gen_hud, gen_logo, gen_extra)

OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')
OUT = os.path.normpath(OUT)

def main():
    os.makedirs(OUT, exist_ok=True)
    p, tags, n = gen_player(OUT)
    print(f'[jugador]  {p}  frames={n}  anims={sorted(set(tags))}')
    for k, v in gen_enemies(OUT).items():
        print(f'[enemigo]  {k}: {v}')
    print('[boss]    ', gen_boss(OUT))
    print('[world]   ', gen_tileset(OUT))
    gen_portal_fx(OUT)
    gen_bg(OUT)
    gen_fx(OUT)
    gen_pickups(OUT)
    gen_props(OUT)
    names = gen_icons(OUT)
    print('[icons]   ', len(names), names)
    gen_hud(OUT)
    gen_logo(OUT)
    gen_extra(OUT)

    files = sorted(glob.glob(f'{OUT}/*.png'))
    total = sum(os.path.getsize(f) for f in files)
    print(f'\n== {len(files)} PNG, {total/1024:.1f} KB ==')
    for f in files:
        print('  ', os.path.basename(f))
    contact_sheet(files, os.path.join(OUT, '..', 'contact_sheet.png'), scale=3)
    print('\ncontact sheet -> public/contact_sheet.png')

if __name__ == '__main__':
    main()
