/* ============================================================
   Jugador — movimiento, salto, dash, ataque y estados
   ============================================================ */
import Phaser from 'phaser';
import { CSS } from '../config';
import type { Stats } from '../systems/progress';
import { Sfx } from '../systems/sfx';

export type PlayerState = 'idle' | 'run' | 'jump' | 'fall' | 'attack' | 'dash' | 'hurt' | 'death';

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  stats!: Stats;
  facing = 1;
  stateName: PlayerState = 'idle';

  private coyote = 0;
  private jumpBuffer = 0;
  private jumpHeld = false;
  private attackTimer = 0;
  private dashTimer = 0;
  private dashCd = 0;
  private invuln = 0;
  private lastHurt = 0;
  private shadows: Phaser.GameObjects.Image;
  private slashSprite?: Phaser.GameObjects.Sprite;

  // eventos hacia la escena
  onAttack?: (x: number, y: number, dir: number, stats: Stats) => void;
  onDash?: (x: number, y: number, dir: number) => void;
  onStep?: (x: number, y: number, running: boolean) => void;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.body.setSize(12, 18);
    this.body.setOffset(6, 6);
    this.body.setCollideWorldBounds(true);
    this.body.setMaxVelocity(400, 420);
    this.body.setDragX(1200);

    this.shadows = scene.add.image(x, y + 12, 'shadow').setAlpha(0.55).setDepth(1);

    this.play('p_idle');
    this.setDepth(10);
  }

  setStats(s: Stats) { this.stats = s; }

  update(time: number, delta: number, input: {
    left: boolean; right: boolean; jumpPressed: boolean;
    attackPressed: boolean; attackHeld: boolean; dashPressed: boolean;
  }) {
    const dt = delta / 1000;
    const body = this.body;
    if (!body || this.stateName === 'death') return;

    this.invuln = Math.max(0, this.invuln - dt);
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.dashCd = Math.max(0, this.dashCd - dt);
    this.dashTimer = Math.max(0, this.dashTimer - dt);

    const onGround = body.blocked.down || body.touching.down;
    if (onGround) this.coyote = 0.1; else this.coyote = Math.max(0, this.coyote - dt);

    if (input.jumpPressed) this.jumpBuffer = 0.12;
    else this.jumpBuffer = Math.max(0, this.jumpBuffer - dt);

    // ---- dash ----
    if (input.dashPressed && this.dashCd <= 0 && this.stateName !== 'dash') {
      this.dashTimer = 0.17;
      this.dashCd = this.stats.dashCd;
      this.invuln = 0.28;
      this.body.setAllowGravity(false);
      this.body.setVelocity(this.facing * 430, 0);
      this.setStateName('dash');
      this.play('p_dash', true);
      this.onDash?.(this.x, this.y, this.facing);
      Sfx.dash();
      return;
    }

    if (this.dashTimer > 0) {
      this.body.setAllowGravity(false);
      this.body.setVelocity(this.facing * 430, 0);
      this.spawnDashGhost();
      return;
    }
    this.body.setAllowGravity(true);

    // ---- movimiento horizontal ----
    const speed = 150 * this.stats.speedMult;
    if (input.left && !input.right) {
      this.body.setAccelerationX(-speed * 12);
      this.setFlipX(true);
      this.facing = -1;
    } else if (input.right && !input.left) {
      this.body.setAccelerationX(speed * 12);
      this.setFlipX(false);
      this.facing = 1;
    } else {
      this.body.setAccelerationX(0);
    }
    if (Math.abs(this.body.velocity.x) > speed) {
      this.body.setVelocityX(Phaser.Math.Clamp(this.body.velocity.x, -speed, speed));
    }

    // ---- salto con coyote + buffer ----
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.body.setVelocityY(-268);
      this.coyote = 0;
      this.jumpBuffer = 0;
      this.jumpHeld = true;
      Sfx.jump();
    }
    // salto variable
    if (!input.jumpPressed && this.jumpHeld && this.body.velocity.y < -90) {
      this.body.setVelocityY(this.body.velocity.y * 0.9);
      if (this.body.velocity.y > -90) this.jumpHeld = false;
    }
    if (this.body.velocity.y > 0) this.jumpHeld = false;

    // ---- ataque ----
    if ((input.attackPressed || input.attackHeld) && this.attackTimer <= 0 && this.stateName !== 'dash') {
      this.attackTimer = 1 / this.stats.attackRate;
      this.doAttack();
    }

    // ---- estado/anim ----
    if (this.dashTimer > 0) {
      this.setStateName('dash');
    } else if (!onGround) {
      this.setStateName(this.body.velocity.y < 0 ? 'jump' : 'fall');
      this.play(this.body.velocity.y < 0 ? 'p_jump' : 'p_fall', true);
    } else if (Math.abs(this.body.velocity.x) > 16) {
      this.setStateName('run');
      this.play('p_run', true);
      if (this.attackTimer <= 0) this.onStep?.(this.x, this.y, true);
    } else {
      this.setStateName('idle');
      this.play('p_idle', true);
    }

    // sombra
    this.shadows.setPosition(this.x, this.y + 11);
    this.setAlpha(this.invuln > 0 && this.dashTimer <= 0 ? (Math.floor(time / 70) % 2 ? 0.45 : 1) : 1);
  }

  private setStateName(s: PlayerState) {
    if (this.stateName === s) return;
    this.stateName = s;
  }

  private dashGhostTimer = 0;
  private spawnDashGhost() {
    const now = this.scene.time.now;
    if (now - this.dashGhostTimer < 40) return;
    this.dashGhostTimer = now;
    const g = this.scene.add.sprite(this.x, this.y, 'player', this.frame.name as unknown as number)
      .setFlipX(this.flipX).setAlpha(0.35).setTint(0x19c8dc).setDepth(9);
    this.scene.tweens.add({ targets: g, alpha: 0, scaleX: 0.7, scaleY: 0.7, duration: 180, onComplete: () => g.destroy() });
  }

  private doAttack() {
    this.play('p_attack', true);
    const range = 34 * this.stats.rangeMult + this.stats.longSword * 10;
    const sx = this.x + this.facing * 14;
    const sy = this.y - 2;

    // arco visual
    const slash = this.scene.add.sprite(sx, sy, 'fx_slash')
      .setFlipX(this.facing < 0)
      .setScale(range / 30, 1)
      .setDepth(this.depth + 1);
    slash.play('a_slash');
    slash.once('animationcomplete', () => slash.destroy());
    if (this.facing < 0) slash.setFlipX(true);

    this.onAttack?.(this.x, this.y, this.facing, this.stats);
    Sfx.slash();
  }

  /** Dano recibido. Devuelve true si murio. */
  takeDamage(amount: number): { died: boolean; blocked: boolean } {
    if (this.invuln > 0 || this.stateName === 'death') return { died: false, blocked: true };
    const real = Math.max(1, Math.round(amount * (1 - (this.stats?.armor ?? 0))));
    this.scene.events.emit('player-damage', real);
    this.invuln = 0.9;
    this.lastHurt = this.scene.time.now;
    this.setTint(0xff6b6b);
    this.scene.time.delayedCall(120, () => this.clearTint());
    this.body.setVelocityY(-160);
    const away = this.body.velocity.x > 0 ? -1 : 1;
    this.body.setVelocityX(130 * away);
    Sfx.hurt();
    return { died: false, blocked: false };
  }

  playDeath() {
    this.stateName = 'death';
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(true);
    this.play('p_death', true);
    this.setTint(0x8a93b8);
  }

  reviveAt(x: number, y: number) {
    this.stateName = 'idle';
    this.setPosition(x, y);
    this.body.setVelocity(0, 0);
    this.clearTint();
    this.invuln = 2;
    this.play('p_idle', true);
  }

  get isDashing() { return this.dashTimer > 0; }
  get invulnerable() { return this.invuln > 0; }
  get isDead() { return this.stateName === 'death'; }
  get hurtFlash() { return this.scene.time.now - this.lastHurt < 160; }
  get hpColor() { return CSS.cyan; }
}
