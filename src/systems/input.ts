/* ============================================================
   Input unificado: teclado (desktop) + tactil (Android)
   ============================================================ */
import Phaser from 'phaser';

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jumpPressed: boolean;
  attackPressed: boolean;
  attackHeld: boolean;
  dashPressed: boolean;
}

export type LayoutMode = 'desktop' | 'touch';

export class InputManager {
  scene: Phaser.Scene;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  pad!: Phaser.Input.Gamepad.Gamepad | null;

  state: InputState = {
    left: false, right: false, up: false, down: false,
    jumpPressed: false, attackPressed: false, attackHeld: false, dashPressed: false,
  };

  mode: LayoutMode = 'desktop';

  // tactil
  private leftZone!: Phaser.GameObjects.Rectangle;
  private rightZone!: Phaser.GameObjects.Zone;
  private joyBase!: Phaser.GameObjects.Image;
  private joyKnob!: Phaser.GameObjects.Image;
  private btnA!: Phaser.GameObjects.Image;
  private btnB!: Phaser.GameObjects.Image;
  private btnC!: Phaser.GameObjects.Image;
  private pointerId: number | null = null;
  private origin = new Phaser.Math.Vector2();
  private vec = new Phaser.Math.Vector2();

  constructor(scene: Phaser.Scene, mode: LayoutMode) {
    this.scene = scene;
    this.mode = mode;
    const kb = scene.input.keyboard;
    if (kb) {
      this.keys = kb.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S,SPACE,J,K,L,SHIFT,X,Z,C') as Record<string, Phaser.Input.Keyboard.Key>;
    }
    if (mode === 'touch') this.buildTouch();
  }

  enableTouch() {
    if (this.leftZone) return;
    this.buildTouch();
  }

  private buildTouch() {
    const w = this.scene.scale.width;
    const h = this.scene.scale.height;
    const d = 90;

    // zona invisible izquierda para joystick flotante
    this.leftZone = this.scene.add.rectangle(0, 0, w * 0.5, h, 0x000000, 0)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(d).setInteractive();

    this.joyBase = this.scene.add.image(80, h - 70, 'joy_base')
      .setScrollFactor(0).setDepth(d + 1).setAlpha(0.55);
    this.joyKnob = this.scene.add.image(80, h - 70, 'joy_knob')
      .setScrollFactor(0).setDepth(d + 2).setAlpha(0.8);

    this.leftZone.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (this.pointerId !== null) return;
      this.pointerId = p.id;
      this.origin.set(p.x, p.y);
      this.joyBase.setPosition(p.x, p.y).setAlpha(0.8);
      this.joyKnob.setPosition(p.x, p.y).setAlpha(0.95);
    });

    this.scene.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id !== this.pointerId) return;
      this.vec.set(p.x - this.origin.x, p.y - this.origin.y);
      const max = 34;
      if (this.vec.length() > max) this.vec.setLength(max);
      this.joyKnob.setPosition(this.origin.x + this.vec.x, this.origin.y + this.vec.y);
    });

    const release = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.pointerId) return;
      this.pointerId = null;
      this.vec.set(0, 0);
      this.joyBase.setAlpha(0.55).setPosition(80, this.scene.scale.height - 70);
      this.joyKnob.setAlpha(0.8).setPosition(80, this.scene.scale.height - 70);
    };
    this.scene.input.on('pointerup', release);
    this.scene.input.on('pointerupoutside', release);

    // botones
    const mkBtn = (x: number, y: number, key: string, label: string, color: number) => {
      const b = this.scene.add.image(x, y, key).setScrollFactor(0).setDepth(d + 1)
        .setAlpha(0.85).setInteractive({ useHandCursor: false });
      const t = this.scene.add.bitmapText(x, y - 4, 'neon', label, 8)
        .setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(d + 2).setTint(color);
      b.on('pointerdown', () => {
        b.setScale(0.92); t.setScale(0.92);
        if (label === 'SALTO') this.state.jumpPressed = true;
        if (label === 'GOLPE') { this.state.attackPressed = true; this.state.attackHeld = true; }
        if (label === 'DASH') this.state.dashPressed = true;
      });
      const up = () => {
        b.setScale(1); t.setScale(1);
        if (label === 'GOLPE') this.state.attackHeld = false;
      };
      b.on('pointerup', up);
      b.on('pointerout', up);
      b.on('pointerupoutside', up);
      return b;
    };

    this.btnA = mkBtn(w - 46, h - 46, 'btn_attack', 'GOLPE', 0xff7ad9);
    this.btnB = mkBtn(w - 108, h - 40, 'btn_jump', 'SALTO', 0x8ff7ff);
    this.btnC = mkBtn(w - 44, h - 108, 'btn_dash', 'DASH', 0xb58cff);
  }

  setVisible(v: boolean) {
    if (this.mode !== 'touch') return;
    [this.joyBase, this.joyKnob, this.btnA, this.btnB, this.btnC]
      .forEach(o => o && o.setVisible(v));
  }

  update() {
    const s = this.state;
    s.left = s.right = false;

    // teclado
    if (this.keys) {
      s.left = this.keys.LEFT.isDown || this.keys.A.isDown;
      s.right = this.keys.RIGHT.isDown || this.keys.D.isDown;
      if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.W)
        || Phaser.Input.Keyboard.JustDown(this.keys.UP)) s.jumpPressed = true;
      if (Phaser.Input.Keyboard.JustDown(this.keys.J) || Phaser.Input.Keyboard.JustDown(this.keys.X)
        || Phaser.Input.Keyboard.JustDown(this.keys.Z)) s.attackPressed = true;
      s.attackHeld = this.keys.J.isDown || this.keys.X.isDown || this.keys.Z.isDown || s.attackHeld;
      if (Phaser.Input.Keyboard.JustDown(this.keys.K) || Phaser.Input.Keyboard.JustDown(this.keys.SHIFT)
        || Phaser.Input.Keyboard.JustDown(this.keys.C) || Phaser.Input.Keyboard.JustDown(this.keys.L)) s.dashPressed = true;
    }

    // tactil
    if (this.mode === 'touch') {
      const dz = 12;
      if (this.vec.x < -dz) s.left = true;
      if (this.vec.x > dz) s.right = true;
      if (this.vec.y < -dz) { /* tap para saltar */ }
    }

    // gamepad (opcional, funciona en Android con mando)
    const gp = this.scene.input.gamepad;
    if (gp && gp.total > 0) {
      const pad = gp.getPad(0);
      if (pad) {
        if (pad.left || pad.leftStick.x < -0.3) s.left = true;
        if (pad.right || pad.leftStick.x > 0.3) s.right = true;
        if (pad.buttons[0]?.value && !this.pad?.[0]) s.jumpPressed = true;
        if (pad.buttons[2]?.value) s.attackPressed = true;
        if (pad.buttons[1]?.value) s.dashPressed = true;
        this.pad = pad;
      }
    }
  }

  /** Consumir flags de un solo disparo al final del frame. */
  clear() {
    this.state.jumpPressed = false;
    this.state.attackPressed = false;
    this.state.dashPressed = false;
  }
}
