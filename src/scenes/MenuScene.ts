import Phaser from 'phaser';
import { GAME_W, GAME_H, CSS, Store } from '../config';
import { Sfx } from '../systems/sfx';

export class MenuScene extends Phaser.Scene {
  private title!: Phaser.GameObjects.Container;
  private selIndex = 0;
  private options: { label: string; action: () => void; y: number }[] = [];
  private cursor!: Phaser.GameObjects.Image;
  private started = false;

  constructor() { super('Menu'); }

  create() {
    this.started = false;
    Sfx.stopMusic();

    // fondo animado
    this.add.tileSprite(0, 0, 480, 272, 'bg_sky').setOrigin(0).setScrollFactor(0);
    const far = this.add.tileSprite(0, 130, 480, 140, 'bg_far').setOrigin(0).setScrollFactor(0);
    const mid = this.add.tileSprite(0, 100, 480, 170, 'bg_mid').setOrigin(0).setScrollFactor(0);
    const near = this.add.tileSprite(0, 180, 480, 90, 'bg_near').setOrigin(0).setScrollFactor(0);
    this.tweens.add({ targets: far, tilePositionX: -60, duration: 22000, repeat: -1 });
    this.tweens.add({ targets: mid, tilePositionX: -120, duration: 14000, repeat: -1 });
    this.tweens.add({ targets: near, tilePositionX: -240, duration: 8000, repeat: -1 });

    // lluvia de datos
    for (let i = 0; i < 26; i++) {
      const p = this.add.image(Phaser.Math.Between(0, GAME_W), Phaser.Math.Between(-80, GAME_H),
        Phaser.Math.RND.pick(['p_cyan', 'p_mag_l', 'p_purple', 'p_white'])).setAlpha(0.7).setDepth(2);
      this.tweens.add({
        targets: p, y: p.y + Phaser.Math.Between(60, 140), alpha: 0,
        duration: Phaser.Math.Between(3000, 7000), repeat: -1, delay: Phaser.Math.Between(0, 3000),
        onRepeat: () => { p.y = -10; p.x = Phaser.Math.Between(0, GAME_W); p.setAlpha(0.7); },
      });
    }

    // logo
    this.title = this.add.container(0, 0).setDepth(10);
    const logo = this.add.image(GAME_W / 2, 74, 'logo').setScale(2.2);
    this.title.add(logo);

    const glow = this.add.image(GAME_W / 2, 74, 'p_glow').setTint(0x19c8dc).setScale(8).setAlpha(0.18)
      .setBlendMode(Phaser.BlendModes.ADD);
    this.title.addAt(glow, 0);

    // parpadeo del logo
    this.tweens.add({ targets: logo, alpha: 0.92, duration: 90, yoyo: true, repeat: -1, repeatDelay: 2600 });
    this.tweens.add({ targets: this.title, y: 2, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });


    const v = this.add.bitmapText(GAME_W - 4, GAME_H - 6, 'neon', 'v1.0', 5).setOrigin(1, 1).setTint(0x5b6494).setDepth(10);
    void v;

    // opciones
    const baseY = 160;
    const defs: { label: string; action: () => void }[] = [
      { label: 'JUGAR', action: () => this.startRun() },
      { label: Store.data.muted ? 'SONIDO OFF' : 'SONIDO ON', action: () => this.toggleSound() },
      { label: 'CONTROLES', action: () => this.showControls() },
      { label: 'BORRAR DATOS', action: () => this.resetBest() },
    ];
    this.options = defs.map((d, i) => ({ ...d, y: baseY + i * 22 }));

    this.cursor = this.add.image(0, 0, 'diamond').setTint(0x19c8dc).setDepth(10);
    this.refreshSel();

    this.options.forEach((o, i) => {
      const t = this.add.bitmapText(GAME_W / 2, o.y, 'neon', o.label, 8).setOrigin(0.5).setDepth(10)
        .setTint(i === 0 ? 0x8ff7ff : 0x8a93b8);
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => { this.selIndex = i; this.refreshSel(); });
      t.on('pointerdown', () => { Sfx.ui(); o.action(); });
      t.setName('opt' + i);
    });

    // record
    if (Store.data.bestFloor > 1) {
      this.add.bitmapText(GAME_W / 2, 128, 'neon', `RECORD: PISO ${Store.data.bestFloor}`, 6)
        .setOrigin(0.5).setTint(0xff7ad9).setDepth(10);
    }

    // creditos
    this.add.bitmapText(GAME_W / 2, GAME_H - 6, 'neon', 'ARTE PIXEL GENERADO POR CODIGO', 5)
      .setOrigin(0.5).setTint(0x5b6494).setDepth(10);

    // teclado
    const kb = this.input.keyboard;
    if (kb) {
      kb.on('keydown-UP', () => { this.selIndex = (this.selIndex + this.options.length - 1) % this.options.length; this.refreshSel(); });
      kb.on('keydown-DOWN', () => { this.selIndex = (this.selIndex + 1) % this.options.length; this.refreshSel(); });
      kb.on('keydown-ENTER', () => this.activate());
      kb.on('keydown-SPACE', () => this.activate());
    }

    this.input.on('pointerdown', () => { Sfx.resume(); });
  }

  private activate() {
    const o = this.options[this.selIndex];
    if (!o) return;
    Sfx.ui();
    o.action();
  }

  private refreshSel() {
    this.options.forEach((o, i) => {
      const t = this.children.getByName('opt' + i) as Phaser.GameObjects.BitmapText | null;
      if (t) t.setTint(i === this.selIndex ? 0x8ff7ff : 0x8a93b8);
    });
    const o = this.options[this.selIndex];
    if (o) this.cursor.setPosition(GAME_W / 2 - 90 - (o.label.length * 2), o.y - 4);
  }

  private startRun() {
    if (this.started) return;
    this.started = true;
    Sfx.resume();
    Sfx.portal();
    this.cameras.main.flash(220, 25, 200, 220);
    this.time.delayedCall(240, () => {
      this.scene.start('Game', { floor: 1, prog: null });
    });
  }

  private toggleSound() {
    Sfx.setMuted(!Store.data.muted);
    const t = this.children.getByName('opt1') as Phaser.GameObjects.BitmapText;
    if (t) t.setText(Store.data.muted ? 'SONIDO OFF' : 'SONIDO ON');
    if (this.options[1]) this.options[1].label = Store.data.muted ? 'SONIDO OFF' : 'SONIDO ON';
    if (!Store.data.muted) Sfx.pickup();
  }

  private showControls() {
    const overlay = this.add.container(0, 0).setDepth(50);
    const bg = this.add.graphics();
    bg.fillStyle(0x080810, 0.88).fillRect(0, 0, GAME_W, GAME_H);
    overlay.add(bg);

    const lines = [
      'CONTROLES',
      '',
      'TECLADO',
      'A/D o FLECHAS — MOVER',
      'ESPACIO/W — SALTO',
      'J / X / Z — GOLPE',
      'K / SHIFT / C — DASH',
      'ESC — PAUSA',
      '',
      'TACTIL (ANDROID)',
      'JOYSTICK — MOVER',
      'GOLPE / SALTO / DASH',
    ];
    lines.forEach((l, i) => {
      overlay.add(this.add.bitmapText(GAME_W / 2, 40 + i * 15, 'neon', l, i === 0 ? 8 : 7)
        .setOrigin(0.5).setTint(i === 0 ? 0x8ff7ff : 0x8a93b8));
    });
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 160 });
    overlay.add(this.add.bitmapText(GAME_W / 2, GAME_H - 24, 'neon', 'TOCA PARA CERRAR', 7)
      .setOrigin(0.5).setTint(0xff7ad9));
    const close = () => { overlay.destroy(); };
    this.time.delayedCall(50, () => this.input.once('pointerdown', close));
    const kb = this.input.keyboard;
    kb?.once('keydown-ESC', close);
    kb?.once('keydown-ENTER', close);
  }

  private resetBest() {
    if (Store.data.bestFloor > 1) {
      this.add.bitmapText(GAME_W / 2, 246, 'neon', 'RECORD ACTUAL: ' + Store.data.bestFloor, 7)
        .setOrigin(0.5).setTint(0xffd23f);
      return;
    }
    Store.reset();
    Sfx.pickup();
    const t = this.add.bitmapText(GAME_W / 2, 246, 'neon', 'DATOS BORRADOS', 7)
      .setOrigin(0.5).setTint(0x2fd67b);
    this.time.delayedCall(900, () => t.destroy());
  }

  get _css() { return CSS; }
}
