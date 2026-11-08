/* ============================================================
   Entreacto entre pisos: resumen, tienda y stats
   ============================================================ */
import Phaser from 'phaser';
import { GAME_W, GAME_H, Store } from '../config';
import type { Progress } from '../systems/progress';
import { MOD_BY_ID, type ModId } from '../systems/mods';
import { Sfx } from '../systems/sfx';

interface Data { floor: number; score: number; kills: number; prog: Progress; }

export class IntermissionScene extends Phaser.Scene {
  private payload!: Data;
  private going = false;

  constructor() { super('Intermission'); }

  init(data: Data) { this.payload = data; this.going = false; }

  create() {
    this.cameras.main.setBackgroundColor(0x0a0618);
    this.add.tileSprite(0, 0, GAME_W, GAME_H, 'bg_sky').setOrigin(0).setAlpha(0.55);
    this.add.tileSprite(0, 140, GAME_W, 132, 'bg_mid').setOrigin(0).setAlpha(0.5);
    this.add.image(0, 0, 'fx_scanlines').setOrigin(0).setAlpha(0.5);

    const { floor, score, kills, prog } = this.payload;

    this.add.bitmapText(GAME_W / 2, 26, 'neon', 'PISO COMPLETADO', 10)
      .setOrigin(0.5).setTint(0x8ff7ff);
    this.add.bitmapText(GAME_W / 2, 44, 'neon', `SIGUIENTE: PISO ${floor}`, 7)
      .setOrigin(0.5).setTint(0xff7ad9);

    // panel de resumen
    const panel = this.add.image(GAME_W / 2, 100, 'panel_card').setScale(2.2, 1.35);
    panel.setTint(0x9aa0c0);
    const stats = [
      ['PUNTOS', `${score}`],
      ['BAJAS', `${kills}`],
      ['CHIPS', `${prog.chips}`],
      ['RECORD PISO', `${Store.data.bestFloor}`],
    ];
    stats.forEach(([k, v], i) => {
      const y = 78 + i * 13;
      this.add.bitmapText(GAME_W / 2 - 96, y, 'neon', k, 6).setTint(0x8a93b8);
      this.add.bitmapText(GAME_W / 2 + 96, y, 'neon', v, 6).setOrigin(1, 0).setTint(0x8ff7ff);
    });

    // mejoras activas
    this.add.bitmapText(GAME_W / 2, 142, 'neon', 'MODULOS ACTIVOS', 6).setOrigin(0.5).setTint(0xb58cff);
    const entries = (Object.entries(prog.mods) as [ModId, number][]).filter(([, n]) => n > 0);
    entries.slice(0, 12).forEach(([id, n], i) => {
      const def = MOD_BY_ID.get(id);
      if (!def) return;
      const x = GAME_W / 2 - 150 + (i % 12) * 26;
      const ic = this.add.image(x, 162, `icon_${def.icon}`).setScale(1.2);
      this.add.bitmapText(x + 9, 167, 'neon', `${n}`, 5).setOrigin(1, 0).setTint(0xffffff);
      ic.setName('mod' + i);
    });

    // tienda: curar
    const healCost = 30 + floor * 8;
    const healBtn = this.makeButton(GAME_W / 2 - 80, 208, `CURAR 40 [${healCost}]`, () => {
      if (prog.chips < healCost) { this.toast('CHIPS INSUFICIENTES', 0xe0333f); return; }
      prog.chips -= healCost;
      prog.hp = Math.min(prog.maxHp, prog.hp + 40);
      Sfx.heal();
      this.toast('+40 VIDA', 0x2fd67b);
      this.scene.restart({ ...this.data });
    });

    const hpCost = 50 + floor * 10;
    const hpBtn = this.makeButton(GAME_W / 2 + 80, 208, `+20 VIDA MAX [${hpCost}]`, () => {
      if (prog.chips < hpCost) { this.toast('CHIPS INSUFICIENTES', 0xe0333f); return; }
      prog.chips -= hpCost;
      prog.maxHp += 20;
      prog.hp = Math.min(prog.maxHp, prog.hp + 20);
      Sfx.heal();
      this.toast('NUCLEO AMPLIADO', 0x8ff7ff);
      this.scene.restart({ ...this.data });
    });

    const cont = this.makeButton(GAME_W / 2, 242, 'DESCENDER', () => this.go());
    cont.setScale(1.15);

    const kb = this.input.keyboard;
    kb?.once('keydown-ENTER', () => this.go());
    kb?.once('keydown-SPACE', () => this.go());
    this.time.delayedCall(60, () => this.input.keyboard?.once('keydown-ESC', () => this.go()));

    void healBtn; void hpBtn;
    this.add.image(0, 0, 'fx_vignette').setOrigin(0).setAlpha(0.7);
  }

  private makeButton(x: number, y: number, label: string, cb: () => void) {
    const c = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1d34, 0.95).fillRect(-64, -10, 128, 20);
    bg.lineStyle(1, 0x5b6494, 1).strokeRect(-64, -10, 128, 20);
    c.add(bg);
    const t = this.add.bitmapText(0, 0, 'neon', label, 6).setOrigin(0.5).setTint(0x8ff7ff);
    c.add(t);
    const zone = this.add.zone(0, 0, 128, 20).setInteractive({ useHandCursor: true });
    c.add(zone);
    zone.on('pointerover', () => { bg.clear(); bg.fillStyle(0x262b4a, 1).fillRect(-64, -10, 128, 20); bg.lineStyle(1, 0x19c8dc, 1).strokeRect(-64, -10, 128, 20); t.setTint(0xffffff); });
    zone.on('pointerout', () => { bg.clear(); bg.fillStyle(0x1a1d34, 0.95).fillRect(-64, -10, 128, 20); bg.lineStyle(1, 0x5b6494, 1).strokeRect(-64, -10, 128, 20); t.setTint(0x8ff7ff); });
    zone.on('pointerdown', () => { Sfx.ui(); cb(); });
    return c;
  }

  private toast(msg: string, color: number) {
    const t = this.add.bitmapText(GAME_W / 2, 190, 'neon', msg, 7).setOrigin(0.5).setTint(color);
    this.tweens.add({ targets: t, alpha: 0, y: 184, duration: 900, onComplete: () => t.destroy() });
  }

  private go() {
    if (this.going) return;
    this.going = true;
    Sfx.portal();
    this.cameras.main.flash(280, 123, 63, 242);
    this.time.delayedCall(260, () => {
      this.scene.start('Game', { floor: this.payload.floor, prog: this.payload.prog });
    });
  }
}
