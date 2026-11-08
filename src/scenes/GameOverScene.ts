/* ============================================================
   Fin de partida: resumen, record y reinicio
   ============================================================ */
import Phaser from 'phaser';
import { GAME_W, GAME_H, Store } from '../config';
import { Sfx } from '../systems/sfx';

interface Data { floor: number; score: number; kills: number; chips: number; mods: number; }

export class GameOverScene extends Phaser.Scene {
  private payload!: Data;

  constructor() { super('GameOver'); }

  init(data: Data) { this.payload = data; }

  create() {
    this.cameras.main.setBackgroundColor(0x080810);
    this.add.tileSprite(0, 0, GAME_W, GAME_H, 'bg_sky').setOrigin(0).setAlpha(0.35);
    const near = this.add.tileSprite(0, 188, GAME_W, 84, 'bg_near').setOrigin(0).setAlpha(0.4);
    this.tweens.add({ targets: near, tilePositionX: -200, duration: 9000, repeat: -1 });

    // lluvia de fragmentos
    for (let i = 0; i < 30; i++) {
      const p = this.add.image(Phaser.Math.Between(0, GAME_W), -10, 'p_mag_l').setAlpha(0.6);
      this.tweens.add({
        targets: p, y: GAME_H + 10, duration: Phaser.Math.Between(2200, 5000), repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    const title = this.add.bitmapText(GAME_W / 2, 56, 'neon', 'DESCONECTADO', 14)
      .setOrigin(0.5).setTint(0xff7ad9).setAlpha(0);
    this.tweens.add({ targets: title, alpha: 1, duration: 500 });
    this.cameras.main.shake(300, 0.004);

    const sub = this.add.bitmapText(GAME_W / 2, 78, 'neon', 'LA RED TE CONSUMIO', 7)
      .setOrigin(0.5).setTint(0x8a93b8);

    // panel
    const panel = this.add.image(GAME_W / 2, 140, 'panel_card').setScale(2.2, 1.25).setTint(0x8a93b8);

    const isRecord = this.payload.score >= Store.data.bestScore && this.payload.score > 0;
    const rows: [string, string][] = [
      ['PISO ALCANZADO', `${this.payload.floor}`],
      ['PUNTUACION', `${this.payload.score}`],
      ['BAJAS', `${this.payload.kills}`],
      ['CHIPS', `${this.payload.chips}`],
      ['MODULOS', `${this.payload.mods}`],
      ['RECORD', `${Store.data.bestScore}`],
    ];
    rows.forEach(([k, v], i) => {
      const y = 112 + i * 12;
      this.add.bitmapText(GAME_W / 2 - 96, y, 'neon', k, 6).setTint(0x8a93b8);
      this.add.bitmapText(GAME_W / 2 + 96, y, 'neon', v, 6).setOrigin(1, 0).setTint(0xffd23f);
    });
    void panel;

    if (isRecord) {
      const rec = this.add.bitmapText(GAME_W / 2, 196, 'neon', '¡NUEVO RECORD!', 8)
        .setOrigin(0.5).setTint(0xffd23f);
      this.tweens.add({ targets: rec, scale: 1.1, duration: 420, yoyo: true, repeat: -1 });
    }

    // botones
    this.makeButton(GAME_W / 2 - 70, 224, 'REINTENTAR', () => {
      Sfx.ui();
      this.scene.start('Game', { floor: 1, prog: null });
    });
    this.makeButton(GAME_W / 2 + 70, 224, 'MENU', () => {
      Sfx.ui();
      this.scene.start('Menu');
    });

    Sfx.resume();
    Sfx.startMusic(82);

    const kb = this.input.keyboard;
    kb?.once('keydown-ENTER', () => this.scene.start('Game', { floor: 1, prog: null }));
    kb?.once('keydown-SPACE', () => this.scene.start('Game', { floor: 1, prog: null }));
    kb?.once('keydown-ESC', () => this.scene.start('Menu'));

    void sub;
  }

  private makeButton(x: number, y: number, label: string, cb: () => void) {
    const c = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1d34, 0.95).fillRect(-60, -11, 120, 22);
    bg.lineStyle(1, 0x19c8dc, 0.9).strokeRect(-60, -11, 120, 22);
    c.add(bg);
    const t = this.add.bitmapText(0, 0, 'neon', label, 7).setOrigin(0.5).setTint(0x8ff7ff);
    c.add(t);
    const z = this.add.zone(0, 0, 120, 22).setInteractive({ useHandCursor: true });
    c.add(z);
    z.on('pointerover', () => { bg.clear(); bg.fillStyle(0x262b4a, 1).fillRect(-60, -11, 120, 22); bg.lineStyle(1, 0xffffff, 1).strokeRect(-60, -11, 120, 22); t.setTint(0xffffff); });
    z.on('pointerout', () => { bg.clear(); bg.fillStyle(0x1a1d34, 0.95).fillRect(-60, -11, 120, 22); bg.lineStyle(1, 0x19c8dc, 0.9).strokeRect(-60, -11, 120, 22); t.setTint(0x8ff7ff); });
    z.on('pointerdown', cb);
    return c;
  }
}
