/* ============================================================
   Proyectiles: del jugador, de enemigos y del laser orbital
   ============================================================ */
import Phaser from 'phaser';
import { CSS } from '../config';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  damage = 0;
  friendly = false;
  pierce = 0;
  private life = 3;
  private hitSet = new Set<Phaser.GameObjects.GameObject>();

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string, anim?: string) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setCircle(3, this.width / 2 - 3, this.height / 2 - 3);
    this.setDepth(11);
    if (anim) this.play(anim);
  }

  fire(x: number, y: number, vx: number, vy: number, damage: number, friendly: boolean, pierce = 0) {
    this.setPosition(x, y);
    this.setActive(true).setVisible(true);
    this.body.enable = true;
    this.body.setVelocity(vx, vy);
    this.damage = damage;
    this.friendly = friendly;
    this.pierce = pierce;
    this.life = 3;
    this.hitSet.clear();
    return this;
  }

  update(_t: number, delta: number) {
    if (!this.active) return;
    this.life -= delta / 1000;
    if (this.life <= 0) this.kill();
  }

  registerHit(target: Phaser.GameObjects.GameObject): boolean {
    if (this.hitSet.has(target)) return false;
    this.hitSet.add(target);
    if (this.pierce > 0) {
      this.pierce--;
    } else {
      this.kill();
    }
    return true;
  }

  kill() {
    this.setActive(false).setVisible(false);
    if (this.body) this.body.enable = false;
  }
}

export function shoot(scene: Phaser.Scene, x: number, y: number, tx: number, ty: number,
  damage: number, friendly: boolean, speed = 150, texture = 'fx_orb', anim = 'a_orb',
  spread = 0): Projectile {
  const ang = Math.atan2(ty - y, tx - x) + spread;
  const p = new Projectile(scene, x, y, texture, anim);
  p.fire(x, y, Math.cos(ang) * speed, Math.sin(ang) * speed, damage, friendly);
  return p;
}

export class BoltPool {
  private pool: Projectile[] = [];
  constructor(private scene: Phaser.Scene, private texture: string, private anim: string) {}

  get(): Projectile {
    const p = this.pool.find(b => !b.active);
    if (p) return p;
    const np = new Projectile(this.scene, -100, -100, this.texture, this.anim);
    np.setActive(false).setVisible(false);
    np.body.enable = false;
    this.pool.push(np);
    return np;
  }

  get all() { return this.pool; }
}

/** Regenera un tinte de color sobre el sprite blanco (para barras). */
export function tintBarGfx(g: Phaser.GameObjects.Graphics, x: number, y: number,
  w: number, h: number, pct: number, color: string) {
  g.clear();
  g.fillStyle(0x080810, 1).fillRect(x - 1, y - 1, w + 2, h + 2);
  g.fillStyle(Phaser.Display.Color.HexStringToColor(CSS.dark).color, 1).fillRect(x, y, w, h);
  g.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1)
    .fillRect(x, y, Math.round(w * Phaser.Math.Clamp(pct, 0, 1)), h);
}
