/* ============================================================
   HUD en pantalla: vida, chips, piso, mejoras y minimapa
   ============================================================ */
import Phaser from 'phaser';
import { CSS, GAME_W, GAME_H } from '../config';
import type { Player } from '../entities/Player';
import type { Progress } from '../systems/progress';
import { MOD_BY_ID, type ModId } from '../systems/mods';
import type { Dungeon } from '../systems/dungeon';

export class Hud {
  scene: Phaser.Scene;
  root: Phaser.GameObjects.Container;

  private hpG: Phaser.GameObjects.Graphics;
  private hpBack: Phaser.GameObjects.Image;
  private chipText: Phaser.GameObjects.BitmapText;
  private floorText: Phaser.GameObjects.BitmapText;
  private chipIcon: Phaser.GameObjects.Sprite;
  private modContainer: Phaser.GameObjects.Container;
  private shieldIcons: Phaser.GameObjects.Image[] = [];
  private dashG: Phaser.GameObjects.Graphics;
  private minimap: Phaser.GameObjects.Graphics;
  private pip: Phaser.GameObjects.Container;
  private dashMax = 1;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.root = scene.add.container(0, 0).setScrollFactor(0).setDepth(60);

    const bg = scene.add.graphics().setScrollFactor(0);
    bg.fillStyle(0x080810, 0.62).fillRect(0, 0, GAME_W, 22);
    bg.fillStyle(0x19c8dc, 0.28).fillRect(0, 22, GAME_W, 1);
    bg.fillStyle(0xe3279e, 0.18).fillRect(0, 23, GAME_W, 1);
    this.root.add(bg);

    // barra de vida
    const heart = scene.add.image(9, 9, 'hud_heart').setScale(1);
    this.root.add(heart);
    this.hpBack = scene.add.image(22, 6, 'hud_bar_frame').setOrigin(0, 0);
    this.root.add(this.hpBack);
    this.hpG = scene.add.graphics();
    this.root.add(this.hpG);

    // chips
    this.chipIcon = scene.add.sprite(104, 10, 'pickup_chip', 0).play('a_chip');
    this.root.add(this.chipIcon);
    this.chipText = scene.add.bitmapText(116, 6, 'neon', '0', 8).setTint(0x96ffc3);
    this.root.add(this.chipText);

    // piso
    this.floorText = scene.add.bitmapText(GAME_W - 8, 6, 'neon', 'PISO 1', 8)
      .setOrigin(1, 0).setTint(0xff7ad9);
    this.root.add(this.floorText);

    // dash cooldown
    this.dashG = scene.add.graphics();
    this.root.add(this.dashG);

    // mejoras (iconos abajo a la izquierda)
    this.modContainer = scene.add.container(6, GAME_H - 20);
    this.root.add(this.modContainer);

    // minimapa arriba derecha
    this.minimap = scene.add.graphics();
    this.root.add(this.minimap);

    // pip de escudo
    this.pip = scene.add.container(0, 0);
    this.root.add(this.pip);
  }

  setStats(dashCd: number) { this.dashMax = dashCd; }

  update(player: Player, prog: Progress, floor: number, dungeon: Dungeon | null,
    dashPct: number, shields: number) {
    // vida
    const pct = Phaser.Math.Clamp(prog.hp / prog.maxHp, 0, 1);
    const g = this.hpG;
    g.clear();
    const x = 24, y = 8, w = 58, h = 6;
    g.fillStyle(0x1a1d34, 1).fillRect(x, y, w, h);
    const col = pct > 0.55 ? 0x2fd67b : pct > 0.25 ? 0xffd23f : 0xe0333f;
    g.fillStyle(col, 1).fillRect(x, y, Math.round(w * pct), h);
    g.fillStyle(0xffffff, 0.45).fillRect(x, y, Math.round(w * pct), 2);
    g.fillStyle(0x080810, 0.85);
    for (let i = 1; i < 5; i++) g.fillRect(x + Math.round(w * i / 5), y, 1, h);
    // marco
    g.lineStyle(1, 0x5b6494, 1).strokeRect(x - 1, y - 1, w + 2, h + 2);

    this.chipText.setText(`${prog.chips}`);
    this.floorText.setText(`PISO ${floor}`);

    // dash
    const dg = this.dashG;
    dg.clear();
    const dw = 26, dx = 104, dy = 16;
    dg.fillStyle(0x1a1d34, 1).fillRect(dx, dy, dw, 3);
    const ready = dashPct >= 1;
    dg.fillStyle(ready ? 0xb58cff : 0x5b6494, 1).fillRect(dx, dy, Math.round(dw * Phaser.Math.Clamp(dashPct, 0, 1)), 3);
    if (ready) dg.fillStyle(0xffffff, 0.6).fillRect(dx, dy, dw, 1);

    // escudos
    this.pip.removeAll(true);
    for (let i = 0; i < shields; i++) {
      const ic = this.scene.add.image(150 + i * 13, 10, 'icon_6').setScale(0.6).setTint(0x8ff7ff);
      this.root.add(ic);
      this.pip.add(ic);
    }

    // mejoras
    this.drawMods(prog);

    // minimapa
    this.drawMinimap(dungeon);

    void player;
    void this.dashMax;
    void this.hpBack;
  }

  private modKey = '';
  private drawMods(prog: Progress) {
    const entries = (Object.entries(prog.mods) as [ModId, number][])
      .filter(([, n]) => n > 0).slice(0, 8);
    const key = entries.map(([k, n]) => `${k}${n}`).join(',');
    if (key === this.modKey) return;
    this.modKey = key;
    this.modContainer.removeAll(true);
    entries.forEach(([id, n], i) => {
      const def = MOD_BY_ID.get(id);
      if (!def) return;
      const ic = this.scene.add.image(i * 18, 0, `icon_${def.icon}`)
        .setScale(1).setOrigin(0, 0.5);
      this.modContainer.add(ic);
      if (n > 1) {
        const t = this.scene.add.bitmapText(i * 17 + 11, 4, 'neon', `${n}`, 5)
          .setOrigin(1, 0).setTint(0xffffff);
        this.modContainer.add(t);
      }
    });
  }

  private drawMinimap(dungeon: Dungeon | null) {
    const g = this.minimap;
    g.clear();
    if (!dungeon || !dungeon.nodes.length) return;
    const cell = 7, ox = GAME_W - 8 - 60, oy = 30;
    for (const n of dungeon.nodes) {
      const x = ox + (n.gx + 1) * cell * 1.2;
      const y = oy + (n.gy + 1) * cell * 1.2;
      const isCur = dungeon.current === n;
      let col = 0x3a4268;
      if (n.type === 'boss') col = 0xe3279e;
      else if (n.type === 'treasure') col = 0xffd23f;
      else if (n.type === 'elite') col = 0xff8b2b;
      else if (n.type === 'secret') col = 0x7b3ff2;
      else if (n.visited) col = 0x5b6494;
      if (n.cleared) col = n.type === 'combat' ? 0x2fd67b : col;
      g.fillStyle(isCur ? 0xffffff : col, isCur ? 1 : 0.9);
      g.fillRect(x, y, cell - 2, cell - 2);
      if (isCur) g.lineStyle(1, 0x19c8dc, 1).strokeRect(x - 1, y - 1, cell, cell);
    }
  }

  setVisible(v: boolean) { this.root.setVisible(v); }

  flashHp() {
    const flash = this.scene.add.graphics().setScrollFactor(0).setDepth(61);
    flash.fillStyle(0xe0333f, 0.18).fillRect(0, 0, GAME_W, GAME_H);
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: 220, onComplete: () => flash.destroy() });
  }

  get chipColor() { return CSS.green; }
}
