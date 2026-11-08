import Phaser from 'phaser';
import { GAME_W, GAME_H, CSS } from '../config';
import { buildParticles, buildUtility, sliceIcons } from '../systems/fx';

const IMAGES: [string, string][] = [
  ['bg_sky', 'assets/bg_sky.png'],
  ['bg_far', 'assets/bg_far.png'],
  ['bg_mid', 'assets/bg_mid.png'],
  ['bg_near', 'assets/bg_near.png'],
  ['bg_fog', 'assets/bg_fog.png'],
  ['fx_scanlines', 'assets/fx_scanlines.png'],
  ['fx_vignette', 'assets/fx_vignette.png'],
  ['fx_sweep', 'assets/fx_sweep.png'],
  ['icons_mods', 'assets/icons_mods.png'],
  ['hud_bar_frame', 'assets/hud_bar_frame.png'],
  ['hud_bar_fill', 'assets/hud_bar_fill.png'],
  ['hud_heart', 'assets/hud_heart.png'],
  ['hud_slot', 'assets/hud_slot.png'],
  ['hud_slot_sel', 'assets/hud_slot_sel.png'],
  ['hud_reticle', 'assets/hud_reticle.png'],
  ['panel_card', 'assets/panel_card.png'],
  ['px_white', 'assets/px_white.png'],
  ['logo', 'assets/logo.png'],
  ['favicon', 'assets/favicon.png'],
  ['shadow', 'assets/shadow.png'],
  ['btn_attack', 'assets/btn_attack.png'],
  ['btn_jump', 'assets/btn_jump.png'],
  ['btn_dash', 'assets/btn_dash.png'],
  ['joy_base', 'assets/joy_base.png'],
  ['joy_knob', 'assets/joy_knob.png'],
  ['btn_sound_on', 'assets/btn_sound_on.png'],
  ['btn_sound_off', 'assets/btn_sound_off.png'],
  ['pickup_key', 'assets/pickup_key.png'],
];

/** key, url, ancho de frame, alto de frame (tiras de una sola fila) */
const SHEETS: [string, string, number, number][] = [
  ['tileset', 'assets/tileset.png', 16, 16],
  ['player', 'assets/player.png', 24, 24],
  ['enemy_drone', 'assets/enemy_drone.png', 16, 16],
  ['enemy_crawler', 'assets/enemy_crawler.png', 20, 14],
  ['enemy_brute', 'assets/enemy_brute.png', 28, 30],
  ['enemy_mage', 'assets/enemy_mage.png', 20, 26],
  ['boss_overseer', 'assets/boss_overseer.png', 64, 64],
  ['fx_slash', 'assets/fx_slash.png', 32, 32],
  ['fx_hit', 'assets/fx_hit.png', 20, 20],
  ['fx_explosion', 'assets/fx_explosion.png', 32, 32],
  ['fx_dash', 'assets/fx_dash.png', 26, 26],
  ['fx_bolt', 'assets/fx_bolt.png', 14, 8],
  ['fx_orb', 'assets/fx_orb.png', 10, 10],
  ['fx_shockwave', 'assets/fx_shockwave.png', 40, 40],
  ['fx_spawn', 'assets/fx_spawn.png', 24, 24],
  ['fx_shield', 'assets/fx_shield.png', 40, 40],
  ['fx_portal', 'assets/fx_portal.png', 16, 16],
  ['fx_beam', 'assets/fx_beam.png', 18, 18],
  ['pickup_chip', 'assets/pickup_chip.png', 12, 12],
  ['pickup_heal', 'assets/pickup_heal.png', 12, 12],
  ['pickup_mod', 'assets/pickup_mod.png', 14, 14],
  ['pickup_coin', 'assets/pickup_coin.png', 12, 12],
  ['prop_lamp', 'assets/prop_lamp.png', 16, 32],
  ['prop_holo', 'assets/prop_holo.png', 22, 22],
  ['prop_plant', 'assets/prop_plant.png', 14, 18],
  ['prop_fan', 'assets/prop_fan.png', 18, 10],
  ['gate', 'assets/gate.png', 16, 32],
];

export class PreloadScene extends Phaser.Scene {
  constructor() { super('Preload'); }

  preload() {
    const g = this.add.graphics().setDepth(10);
    g.fillStyle(0x080810, 1).fillRect(0, 0, GAME_W, GAME_H);

    // marco
    g.lineStyle(1, 0x19c8dc, 0.8).strokeRect(150, 126, 180, 10);
    const bar = this.add.graphics().setDepth(11);
    const label = this.add.text(GAME_W / 2, 150, 'CARGANDO', {
      fontFamily: 'monospace', fontSize: '10px', color: CSS.cyan,
    }).setOrigin(0.5).setDepth(11);

    this.load.on('progress', (p: number) => {
      bar.clear();
      bar.fillStyle(0x19c8dc, 0.85).fillRect(152, 128, Math.round(176 * p), 6);
      bar.fillStyle(0xe3279e, 0.9).fillRect(152, 128, Math.round(176 * p), 1);
    });
    this.load.on('complete', () => {
      bar.clear();
      label.setText('LISTO');
    });

    // fuente bitmap
    this.load.bitmapFont('neon', 'assets/font.png', 'assets/font.xml');

    for (const [key, url] of IMAGES) this.load.image(key, url);
    for (const [key, url, fw, fh] of SHEETS) this.load.spritesheet(key, url, { frameWidth: fw, frameHeight: fh });
  }

  create() {
    buildParticles(this);
    buildUtility(this);
    sliceIcons(this);
    this.makeAnimations();
    this.scene.start('Menu');
  }

  private makeAnimations() {
    const A = this.anims;
    const frames = (key: string, start: number, end: number, fw = 24, fh = 24) => {
      const out = [];
      for (let i = start; i <= end; i++) out.push({ key, frame: i });
      void fw; void fh;
      return out;
    };

    // jugador 8 columnas x 24px
    if (!A.exists('p_idle')) {
      A.create({ key: 'p_idle', frames: A.generateFrameNumbers('player', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
      A.create({ key: 'p_run', frames: A.generateFrameNumbers('player', { start: 4, end: 9 }), frameRate: 14, repeat: -1 });
      A.create({ key: 'p_jump', frames: A.generateFrameNumbers('player', { start: 10, end: 10 }), frameRate: 1, repeat: -1 });
      A.create({ key: 'p_fall', frames: A.generateFrameNumbers('player', { start: 11, end: 11 }), frameRate: 1, repeat: -1 });
      A.create({ key: 'p_attack', frames: A.generateFrameNumbers('player', { start: 12, end: 14 }), frameRate: 22, repeat: 0 });
      A.create({ key: 'p_dash', frames: A.generateFrameNumbers('player', { start: 15, end: 15 }), frameRate: 1, repeat: -1 });
      A.create({ key: 'p_hurt', frames: A.generateFrameNumbers('player', { start: 16, end: 16 }), frameRate: 1, repeat: -1 });
      A.create({ key: 'p_death', frames: A.generateFrameNumbers('player', { start: 17, end: 17 }), frameRate: 1, repeat: -1 });
    }
    // enemigos (tiras de 5)
    if (!A.exists('e_drone')) {
      A.create({ key: 'e_drone', frames: A.generateFrameNumbers('enemy_drone', { start: 0, end: 3 }), frameRate: 9, repeat: -1 });
      A.create({ key: 'e_crawler', frames: A.generateFrameNumbers('enemy_crawler', { start: 0, end: 3 }), frameRate: 11, repeat: -1 });
      A.create({ key: 'e_brute', frames: A.generateFrameNumbers('enemy_brute', { start: 0, end: 3 }), frameRate: 7, repeat: -1 });
      A.create({ key: 'e_mage', frames: A.generateFrameNumbers('enemy_mage', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
      A.create({ key: 'b_boss', frames: A.generateFrameNumbers('boss_overseer', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
    }
    // fx
    if (!A.exists('a_slash')) {
      A.create({ key: 'a_slash', frames: A.generateFrameNumbers('fx_slash', { start: 0, end: 4 }), frameRate: 30, repeat: 0 });
      A.create({ key: 'a_hit', frames: A.generateFrameNumbers('fx_hit', { start: 0, end: 3 }), frameRate: 30, repeat: 0 });
      A.create({ key: 'a_explosion', frames: A.generateFrameNumbers('fx_explosion', { start: 0, end: 5 }), frameRate: 22, repeat: 0 });
      A.create({ key: 'a_explosion_s', frames: A.generateFrameNumbers('fx_explosion', { start: 0, end: 5 }), frameRate: 22, repeat: 0 });
      A.create({ key: 'a_dash', frames: A.generateFrameNumbers('fx_dash', { start: 0, end: 3 }), frameRate: 24, repeat: 0 });
      A.create({ key: 'a_bolt', frames: A.generateFrameNumbers('fx_bolt', { start: 0, end: 1 }), frameRate: 16, repeat: -1 });
      A.create({ key: 'a_orb', frames: A.generateFrameNumbers('fx_orb', { start: 0, end: 3 }), frameRate: 12, repeat: -1 });
      A.create({ key: 'a_shock', frames: A.generateFrameNumbers('fx_shockwave', { start: 0, end: 4 }), frameRate: 24, repeat: 0 });
      A.create({ key: 'a_spawn', frames: A.generateFrameNumbers('fx_spawn', { start: 0, end: 4 }), frameRate: 20, repeat: 0 });
      A.create({ key: 'a_shield', frames: A.generateFrameNumbers('fx_shield', { start: 0, end: 2 }), frameRate: 10, repeat: -1 });
      A.create({ key: 'a_portal', frames: A.generateFrameNumbers('fx_portal', { start: 0, end: 5 }), frameRate: 9, repeat: -1 });
      A.create({ key: 'a_beam', frames: A.generateFrameNumbers('fx_beam', { start: 0, end: 3 }), frameRate: 24, repeat: 0 });
      A.create({ key: 'a_chip', frames: A.generateFrameNumbers('pickup_chip', { start: 0, end: 3 }), frameRate: 9, repeat: -1 });
      A.create({ key: 'a_heal', frames: A.generateFrameNumbers('pickup_heal', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
      A.create({ key: 'a_mod', frames: A.generateFrameNumbers('pickup_mod', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
      A.create({ key: 'a_coin', frames: A.generateFrameNumbers('pickup_coin', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
      A.create({ key: 'a_gate', frames: A.generateFrameNumbers('gate', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
      A.create({ key: 'a_lamp', frames: A.generateFrameNumbers('prop_lamp', { start: 0, end: 2 }), frameRate: 3, repeat: -1 });
      A.create({ key: 'a_holo', frames: A.generateFrameNumbers('prop_holo', { start: 0, end: 3 }), frameRate: 5, repeat: -1 });
      A.create({ key: 'a_fan', frames: A.generateFrameNumbers('prop_fan', { start: 0, end: 3 }), frameRate: 12, repeat: -1 });
    }
  }
}
