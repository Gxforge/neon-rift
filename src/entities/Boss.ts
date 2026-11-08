/* ============================================================
   OVERSEER — jefe de piso con 3 patrones de ataque
   ============================================================ */
import Phaser from 'phaser';
import { Sfx } from '../systems/sfx';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  hp: number;
  maxHp: number;
  phase = 0;
  dead = false;

  private hpBar: Phaser.GameObjects.Graphics;
  private glow: Phaser.GameObjects.Image;
  private atkTimer = 2.2;
  private pattern = 0;
  private moveTimer = 0;
  private hurtTimer = 0;
  private floor: number;

  onShoot?: (x: number, y: number, tx: number, ty: number, damage: number, speed?: number) => void;
  onBurst?: (x: number, y: number, count: number, damage: number) => void;
  onSlam?: (x: number, y: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, floor: number) {
    super(scene, x, y, 'boss_overseer', 0);
    this.floor = floor;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(1.5);
    this.body.setAllowGravity(false);
    this.body.setSize(30, 30);
    this.body.setOffset(17, 17);
    this.maxHp = 320 + floor * 140;
    this.hp = this.maxHp;
    this.play('b_boss');
    this.setDepth(9);

    this.glow = scene.add.image(x, y, 'p_glow').setTint(0xe3279e)
      .setScale(4.2).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(8);
    this.hpBar = scene.add.graphics().setDepth(21);
  }

  update(_t: number, delta: number) {
    if (this.dead || !this.active || !this.scene) return;
    const dt = delta / 1000;
    const hpPct = this.hp / this.maxHp;
    this.phase = hpPct > 0.6 ? 0 : hpPct > 0.3 ? 1 : 2;

    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    if (this.hurtTimer <= 0) this.clearTint();

    this.glow.setPosition(this.x, this.y);
    this.glow.setScale(4.2 + Math.sin(this.scene.time.now / 240) * 0.3);
    this.glow.setAlpha(0.32 + this.phase * 0.1);

    // flotar
    this.body.setVelocityY(Math.sin(this.scene.time.now / 900) * 14);
    this.moveTimer -= dt;
    if (this.moveTimer <= 0) {
      this.moveTimer = Phaser.Math.FloatBetween(1.2, 2.4);
      this.body.setVelocityX(Phaser.Math.Between(-60, 60) * (1 + this.phase * 0.4));
    }
    // se mantiene cerca del jugador para que la pelea sea justa
    const py = (this.scene as unknown as { playerRef?: { y: number } }).playerRef?.y;
    if (py !== undefined) {
      const desired = py - 76;
      this.body.setVelocityY(Phaser.Math.Clamp((desired - this.y) * 1.4, -46, 46));
    }

    this.atkTimer -= dt * (1 + this.phase * 0.45);
    if (this.atkTimer <= 0) {
      this.atkTimer = Phaser.Math.FloatBetween(1.5, 2.4);
      this.attack();
    }

    // barra de vida (arriba de la pantalla)
    const g = this.hpBar;
    g.clear();
    const w = 210, x = (480 - w) / 2 + 30, y = 24;
    g.fillStyle(0x080810, 0.85).fillRect(x - 2, y - 2, w + 4, 10);
    g.fillStyle(0x3d1a66, 1).fillRect(x, y, w, 6);
    const col = this.phase === 0 ? 0xe3279e : this.phase === 1 ? 0xff8b2b : 0xe0333f;
    g.fillStyle(col, 1).fillRect(x, y, Math.round(w * hpPct), 6);
    g.fillStyle(0xffffff, 0.55).fillRect(x, y, Math.round(w * hpPct), 2);
    for (let i = 1; i < 4; i++) {
      g.fillStyle(0x080810, 0.7).fillRect(x + Math.round(w * i / 4), y, 1, 6);
    }
  }

  private attack() {
    const p = this.pattern++ % 3;

    if (p === 0) {
      // rafaga dirigida
      Sfx.spawn();
      const t = this.scene.children.list.find(o => o.name === 'player-target');
      const tx = (this.scene as unknown as { playerRef?: { x: number; y: number } }).playerRef?.x ?? this.x + 40;
      const ty = (this.scene as unknown as { playerRef?: { x: number; y: number } }).playerRef?.y ?? this.y;
      void t;
      for (let i = 0; i < 3 + this.phase; i++) {
        this.scene.time.delayedCall(i * 130, () => {
          if (!this.dead) this.onShoot?.(this.x, this.y, tx + Phaser.Math.Between(-18, 18), ty, 14, 120 + this.phase * 25);
        });
      }
    } else if (p === 1) {
      // lluvia radial
      Sfx.spawn();
      this.onBurst?.(this.x, this.y, 8 + this.phase * 4, 12);
    } else {
      // golpe al suelo con onda
      Sfx.bossWarn();
      this.scene.tweens.add({
        targets: this, y: this.y + 26, duration: 260, yoyo: true, ease: 'Quad.easeIn',
        onYoyo: () => {
          this.onSlam?.(this.x, this.y + 30);
          Sfx.explosion();
        },
      });
    }
  }

  takeDamage(amount: number, source = 'hit'): boolean {
    if (this.dead) return false;
    this.hp -= amount;
    this.hurtTimer = 0.07;
    this.setTint(0xffffff);
    this.scene.events.emit('damage-number', this.x, this.y - 30, amount, source);
    if (this.hp <= 0) {
      this.hp = 0;
      this.die();
      return true;
    }
    return false;
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    Sfx.explosion();
    this.glow.destroy();
    this.hpBar.destroy();
    this.scene.cameras.main.shake(420, 0.012);

    for (let i = 0; i < 5; i++) {
      this.scene.time.delayedCall(i * 130, () => {
        const ex = this.scene.add.sprite(this.x + Phaser.Math.Between(-30, 30),
          this.y + Phaser.Math.Between(-24, 24), 'fx_explosion').setDepth(14).setScale(1.4);
        ex.play('a_explosion');
        ex.once('animationcomplete', () => ex.destroy());
      });
    }
    this.scene.events.emit('boss-killed', this.x, this.y);
    this.destroy();
  }

  destroy(fromScene?: boolean) {
    this.hpBar?.destroy();
    this.glow?.destroy();
    super.destroy(fromScene);
  }
}
