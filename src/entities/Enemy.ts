/* ============================================================
   Enemigos — 4 arquetipos con IA propia
   ============================================================ */
import Phaser from 'phaser';
import { Sfx } from '../systems/sfx';

export type EnemyKind = 'drone' | 'crawler' | 'brute' | 'mage';

interface EnemyCfg {
  hp: number;
  speed: number;
  damage: number;
  flying: boolean;
  scale: number;
  bodyW: number;
  bodyH: number;
  texture: string;
  anim: string;
  score: number;
  chips: [number, number];
}

const CFG: Record<EnemyKind, EnemyCfg> = {
  drone: { hp: 22, speed: 42, damage: 10, flying: true, scale: 1.35, bodyW: 12, bodyH: 10, texture: 'enemy_drone', anim: 'e_drone', score: 10, chips: [2, 5] },
  crawler: { hp: 30, speed: 58, damage: 12, flying: false, scale: 1.3, bodyW: 14, bodyH: 9, texture: 'enemy_crawler', anim: 'e_crawler', score: 14, chips: [2, 6] },
  brute: { hp: 80, speed: 30, damage: 20, flying: false, scale: 1.15, bodyW: 16, bodyH: 24, texture: 'enemy_brute', anim: 'e_brute', score: 26, chips: [5, 10] },
  mage: { hp: 38, speed: 34, damage: 14, flying: true, scale: 1.2, bodyW: 12, bodyH: 18, texture: 'enemy_mage', anim: 'e_mage', score: 22, chips: [4, 9] },
};

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;

  kind: EnemyKind;
  hp: number;
  maxHp: number;
  damage: number;
  score: number;
  chips: number;
  elite = false;
  dead = false;

  private cfg: EnemyCfg;
  private hpBar: Phaser.GameObjects.Graphics;
  private shadowImg?: Phaser.GameObjects.Image;
  private aiTimer = 0;
  private homeY = 0;
  private dir = 1;
  private frozen = 0;
  private venom = 0;
  private venomTick = 0;
  private hurtTimer = 0;
  private target: Phaser.GameObjects.Components.Transform & { y: number; x: number; body?: Phaser.Physics.Arcade.Body };

  onShoot?: (x: number, y: number, tx: number, ty: number, damage: number) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: EnemyKind, hpScale = 1, elite = false) {
    const cfg = CFG[kind];
    super(scene, x, y, cfg.texture, 0);
    this.kind = kind;
    this.cfg = cfg;
    this.elite = elite;
    const hp = Math.round(cfg.hp * hpScale * (elite ? 2.2 : 1));
    this.hp = hp;
    this.maxHp = hp;
    this.damage = Math.round(cfg.damage * (elite ? 1.35 : 1));
    this.score = cfg.score * (elite ? 3 : 1);
    this.chips = Phaser.Math.Between(cfg.chips[0], cfg.chips[1]) * (elite ? 3 : 1);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setScale(cfg.scale * (elite ? 1.12 : 1));
    this.body.setSize(cfg.bodyW, cfg.bodyH);
    this.body.setOffset((this.width - cfg.bodyW) / 2, (this.height - cfg.bodyH) / 2);
    this.body.setAllowGravity(!cfg.flying);
    if (elite) this.setTint(0xff7ad9);

    this.homeY = y;
    this.play(cfg.anim);
    
    this.setDepth(8);

    if (!cfg.flying) {
      this.shadowImg = scene.add.image(x, y + 8, 'shadow').setAlpha(0.4).setScale(0.7).setDepth(2);
    }
    this.hpBar = scene.add.graphics().setDepth(20);
    this.target = { x: 0, y: 0 } as unknown as typeof this.target;
  }

  setTarget(t: Phaser.GameObjects.Components.Transform) { this.target = t as typeof this.target; }

  private baseRate = 1;
  private setAnimRate(r: number) {
    if (this.baseRate === r) return;
    this.baseRate = r;
    const anim = this.anims.currentAnim;
    if (!anim) return;
    this.anims.msPerFrame = 1000 / Math.max(0.1, (anim.frameRate || 10) * r);
  }

  update(_time: number, delta: number) {
    if (this.dead) return;
    const dt = delta / 1000;
    this.aiTimer -= dt;
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);

    if (this.frozen > 0) {
      this.frozen -= dt;
      this.anims.timeScale = 0.25;
      this.setTint(0x8ff7ff);
      if (this.frozen <= 0) this.clearTint();
    } else {
      this.anims.timeScale = 1;
    }

    if (this.venom > 0) {
      this.venom -= dt;
      this.venomTick -= dt;
      if (this.venomTick <= 0) {
        this.venomTick = 0.5;
        this.takeDamage(3, 'venom');
      }
      this.setTint(this.frozen > 0 ? 0x8ff7ff : 0x96ffc3);
    }

    const slow = this.frozen > 0 ? 0.35 : 1;
    const tx = this.target?.x ?? this.x;
    const ty = this.target?.y ?? this.y;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);

    if (this.hurtTimer <= 0) this.clearTint();
    if (this.elite && this.hurtTimer <= 0 && this.frozen <= 0 && this.venom <= 0) this.setTint(0xff7ad9);

    switch (this.kind) {
      case 'crawler': {
        if (dist < 170 && dist > 6) {
          this.dir = Math.sign(dx) || 1;
        }
        this.body.setVelocityX(this.dir * this.cfg.speed * slow);
        this.setFlipX(this.dir < 0);
        // salta si el jugador esta arriba
        if (dist < 46 && dy < -20 && this.body.blocked.down) {
          this.body.setVelocityY(-230);
        }
        break;
      }
      case 'drone': {
        const desiredY = this.homeY + Math.sin(this.scene.time.now / 420 + this.x) * 10;
        const vy = Phaser.Math.Clamp((desiredY - this.y) * 2.2, -50, 50);
        this.body.setVelocityY(vy);
        if (dist < 230) {
          this.dir = Math.sign(dx) || 1;
          this.body.setVelocityX(this.dir * this.cfg.speed * slow);
        } else {
          this.body.setVelocityX(Math.sin(this.scene.time.now / 900) * 22 * slow);
        }
        this.setFlipX(this.dir < 0);
        break;
      }
      case 'brute': {
        if (dist < 250) {
          this.dir = Math.sign(dx) || 1;
          this.body.setVelocityX(this.dir * this.cfg.speed * slow);
          this.setFlipX(this.dir < 0);
          if (this.aiTimer <= 0 && Math.abs(dy) < 30 && dist < 90) {
            this.aiTimer = 2.4;
            this.body.setVelocityX(this.dir * 190);
            this.body.setVelocityY(-90);
            this.setTint(0xff8b2b);
            this.hurtTimer = 0.3;
          }
        } else {
          this.body.setVelocityX(this.dir * 14 * slow);
        }
        break;
      }
      case 'mage': {
        const desired = 110;
        const vy = Phaser.Math.Clamp((this.homeY - this.y) * 1.6, -40, 40);
        this.body.setVelocityY(vy);
        if (dist < desired) {
          this.body.setVelocityX(-Math.sign(dx) * this.cfg.speed * slow);
        } else if (dist > desired + 40) {
          this.body.setVelocityX(Math.sign(dx) * this.cfg.speed * 0.6 * slow);
        } else {
          this.body.setVelocityX(0);
        }
        this.setFlipX(dx < 0);
        if (this.aiTimer <= 0 && dist < 260 && this.frozen <= 0) {
          this.aiTimer = Phaser.Math.FloatBetween(1.7, 2.6);
          this.onShoot?.(this.x, this.y - 4, tx, ty, this.damage);
        }
        break;
      }
    }

    if (this.shadowImg) this.shadowImg.setPosition(this.x, this.y + 9);
    this.drawHpBar();
    if (this.y > 1000) this.destroy();
  }

  private drawHpBar() {
    const g = this.hpBar;
    g.clear();
    if (this.hp >= this.maxHp) return;
    const w = this.kind === 'brute' ? 26 : 18;
    const x = this.x - w / 2;
    const y = this.y - this.displayHeight / 2 - 6;
    g.fillStyle(0x080810, 0.9).fillRect(x - 1, y - 1, w + 2, 4);
    const pct = Phaser.Math.Clamp(this.hp / this.maxHp, 0, 1);
    const col = pct > 0.55 ? 0x2fd67b : pct > 0.25 ? 0xffd23f : 0xe0333f;
    g.fillStyle(col, 1).fillRect(x, y, Math.round(w * pct), 2);
  }

  takeDamage(amount: number, source = 'hit'): boolean {
    if (this.dead) return false;
    this.hp -= amount;
    this.hurtTimer = 0.08;
    this.setTint(0xffffff);
    this.scene.time.delayedCall(70, () => { if (!this.dead) this.clearTint(); });

    // numero de dano
    this.scene.events.emit('damage-number', this.x, this.y - 12, amount, source);

    if (this.hp <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  applyFreeze(sec: number) { this.frozen = Math.max(this.frozen, sec); }
  applyVenom(sec: number) { this.venom = Math.max(this.venom, sec); this.venomTick = 0.3; }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.scene.events.emit('enemy-killed', this.x, this.y, this.chips, this.score, this.kind, this.elite);
    Sfx.kill();
    this.hpBar.destroy();
    this.shadowImg?.destroy();
    // pedazos
    for (let i = 0; i < 6; i++) {
      const p = this.scene.add.image(this.x, this.y, 'p_' + (this.kind === 'mage' ? 'purple' : this.kind === 'drone' ? 'mag' : 'gray'))
        .setDepth(12);
      this.scene.tweens.add({
        targets: p,
        x: this.x + Phaser.Math.Between(-26, 26),
        y: this.y + Phaser.Math.Between(-26, 18),
        alpha: 0, duration: Phaser.Math.Between(220, 480),
        onComplete: () => p.destroy(),
      });
    }
    this.destroy();
  }

  destroy(fromScene?: boolean) {
    this.hpBar?.destroy();
    this.shadowImg?.destroy();
    super.destroy(fromScene);
  }
}
