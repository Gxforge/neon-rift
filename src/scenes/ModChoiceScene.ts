/* ============================================================
   Eleccion de modulo entre 3 opciones (congela el juego)
   ============================================================ */
import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../config';
import type { ModDef, ModId } from '../systems/mods';
import { Sfx } from '../systems/sfx';

interface Data { mods: ModDef[]; floor: number; onPick: (id: ModId) => void; }

export class ModChoiceScene extends Phaser.Scene {
  private payload!: Data;

  constructor() { super('ModChoice'); }

  init(data: Data) { this.payload = data; }

  create() {
    this.scene.bringToTop();
    const overlay = this.add.graphics();
    overlay.fillStyle(0x080810, 0.82).fillRect(0, 0, GAME_W, GAME_H);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 180 });

    const title = this.add.bitmapText(GAME_W / 2, 24, 'neon', 'ELIGE UN MODULO', 10)
      .setOrigin(0.5).setTint(0x8ff7ff).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, y: 28, duration: 240, delay: 80 });

    const rarityColor = (r: ModDef['rarity']) => r === 'epico' ? 0xff7ad9 : r === 'raro' ? 0xb58cff : 0x8ff7ff;

    this.payload.mods.forEach((m, i) => {
      const x = GAME_W / 2 + (i - 1) * 130;
      const y = 130;
      const card = this.add.container(x, y).setAlpha(0);
      const bg = this.add.image(0, 0, 'panel_card').setOrigin(0.5);
      bg.setScale(0.95, 0.92);
      card.add(bg);

      // marco de color por rareza
      const frame = this.add.graphics();
      const col = rarityColor(m.rarity);
      frame.lineStyle(1, col, 1).strokeRect(-44, -24, 88, 48);
      card.add(frame);

      // icono (textura ya recortada y limpia)
      const ic = this.add.image(0, -8, `icon_${m.icon}`).setScale(2.2);
      card.add(ic);

      // halo
      const halo = this.add.image(0, -8, 'p_glow').setTint(col).setScale(1.3).setAlpha(0.35)
        .setBlendMode(Phaser.BlendModes.ADD);
      card.addAt(halo, 1);

      card.add(this.add.bitmapText(0, -34, 'neon', m.rarity.toUpperCase(), 5).setOrigin(0.5).setTint(col));
      card.add(this.add.bitmapText(0, 12, 'neon', m.name, 6).setOrigin(0.5).setTint(0xffffff));

      // descripcion en varias lineas
      const words = m.desc.split(' ');
      const lines: string[] = [];
      let line = '';
      for (const w of words) {
        if ((line + ' ' + w).trim().length > 16) { lines.push(line); line = w; }
        else line = (line + ' ' + w).trim();
      }
      if (line) lines.push(line);
      lines.slice(0, 2).forEach((l, li) => {
        card.add(this.add.bitmapText(0, 22 + li * 7, 'neon', l, 5).setOrigin(0.5).setTint(0x8a93b8));
      });

      this.tweens.add({ targets: card, alpha: 1, y: y - 4, duration: 240, delay: 120 + i * 90 });

      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerover', () => { card.setScale(1.04); frame.lineStyle(2, col, 1).strokeRect(-44, -24, 88, 48); Sfx.ui(); });
      bg.on('pointerout', () => { card.setScale(1); frame.lineStyle(1, col, 1).strokeRect(-44, -24, 88, 48); });
      bg.on('pointerdown', () => this.pick(m));
    });

    // teclado 1/2/3
    const kb = this.input.keyboard;
    kb?.once('keydown-ONE', () => this.pick(this.payload.mods[0]));
    kb?.once('keydown-TWO', () => this.pick(this.payload.mods[1]));
    kb?.once('keydown-THREE', () => this.pick(this.payload.mods[2]));

    // bloquea interaccion con la escena de abajo
    this.input.on('pointerdown', () => { /* evita paso */ });
  }

  private picking = false;
  private pick(m: ModDef) {
    if (this.picking) return;
    this.picking = true;
    Sfx.mod();
    this.cameras.main.flash(160, 123, 63, 242);
    this.payload.onPick(m.id);
    this.time.delayedCall(180, () => this.scene.stop());
  }
}
