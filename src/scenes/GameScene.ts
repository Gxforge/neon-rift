/* ============================================================
   Escena de juego: salas, combate, progresion y ciclo roguelike
   ============================================================ */
import Phaser from 'phaser';
import { GAME_W, GAME_H, TILE, ROOM_W, ROOM_H, Store, isTouchDevice } from '../config';
import { Player } from '../entities/Player';
import { Enemy, type EnemyKind } from '../entities/Enemy';
import { Boss } from '../entities/Boss';
import { Pickup } from '../entities/Pickup';
import { Projectile, BoltPool } from '../entities/Projectiles';
import { Hud } from '../ui/hud';
import { InputManager, type LayoutMode } from '../systems/input';
import { Progress } from '../systems/progress';
import type { Stats } from '../systems/progress';
import { Dungeon, type RoomNode } from '../systems/dungeon';
import { buildRoom, FLOOR_Y, type RoomBuild } from '../systems/room';
import { Sfx } from '../systems/sfx';
import { rollMods, type ModId } from '../systems/mods';

type Phase = 'enter' | 'combat' | 'cleared' | 'transition' | 'dead' | 'paused';

interface GameData { floor: number; prog: Progress | null; }

export class GameScene extends Phaser.Scene {
  floor = 1;
  prog!: Progress;
  dungeon!: Dungeon;
  room!: RoomBuild;

  player!: Player;
  enemies: Enemy[] = [];
  pickups: Pickup[] = [];
  enemyBolts!: BoltPool;
  playerBolts!: BoltPool;
  boss: Boss | null = null;

  ctrl!: InputManager;
  hud!: Hud;
  phase: Phase = 'enter';

  score = 0;
  kills = 0;
  shields = 0;
  dashTimer = 0;

  private bgSky!: Phaser.GameObjects.TileSprite;
  private bgFar!: Phaser.GameObjects.TileSprite;
  private bgMid!: Phaser.GameObjects.TileSprite;
  private bgNear!: Phaser.GameObjects.TileSprite;
  private bgFog!: Phaser.GameObjects.TileSprite;
  private gates: Phaser.GameObjects.Sprite[] = [];
  private portal?: Phaser.GameObjects.Sprite;
  private portalGlow?: Phaser.GameObjects.Image;
  private decor: (Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle)[] = [];
  private roomObjects: Phaser.GameObjects.GameObject[] = [];
  private doorBlockers: Phaser.GameObjects.Rectangle[] = [];
  private gateRects: Phaser.Geom.Rectangle[] = [];

  private laserTimer = 0;
  private turret?: Phaser.GameObjects.Container;
  private turretTimer = 0;
  private paused = false;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private lastStepSound = 0;
  private comboCount = 0;
  private comboWindow = 0;
  private modsOffered = false;
  private transitioning = false;
  private solidGroup?: Phaser.Physics.Arcade.StaticGroup;
  private playerBoltGroup?: Phaser.GameObjects.Group;
  private enemyBoltGroup?: Phaser.GameObjects.Group;

  private registerEnemyBolt(b: Projectile) {
    if (this.enemyBoltGroup && !this.enemyBoltGroup.contains(b)) this.enemyBoltGroup.add(b);
  }

  constructor() { super('Game'); }

  init(data: GameData) {
    // reinicia el estado de fisicas/mundo al reintentar
    this.children.removeAll(true);
    this.floor = data.floor ?? 1;
    this.prog = data.prog ?? new Progress();
    this.enemies = [];
    this.pickups = [];
    this.gates = [];
    this.decor = [];
    this.gateRects = [];
    this.roomObjects = [];
    this.boss = null;
    this.score = 0;
    this.kills = 0;
    this.shields = this.prog.stats().shieldCharges;
    this.phase = 'enter';
    this.paused = false;
    this.pauseOverlay = undefined;
    this.modsOffered = false;
    this.laserTimer = 0;
    this.turretTimer = 0;
    this.comboCount = 0;
  }

  create() {
    // limpia referencias de una partida anterior (la escena se reutiliza)
    this.player = undefined as unknown as Player;
    this.solidGroup = undefined;
    this.playerBoltGroup = undefined;
    this.enemyBoltGroup = undefined;
    this.turret = undefined;

    this.physics.world.setBounds(0, 0, GAME_W, ROOM_H * TILE);
    this.cameras.main.setBounds(0, 0, GAME_W, GAME_H);
    this.cameras.main.setBackgroundColor(0x0a0618);

    this.buildBackground();

    this.dungeon = new Dungeon(`piso-${this.floor}-${Date.now()}`);
    this.dungeon.generate(this.floor);
    const start = this.dungeon.nodes.find(n => n.type === 'start')!;
    this.dungeon.current = start;

    // pools
    this.playerBolts = new BoltPool(this, 'fx_bolt', 'a_bolt');
    this.enemyBolts = new BoltPool(this, 'fx_orb', 'a_orb');

    this.hud = new Hud(this);

    // input
    const mode: LayoutMode = isTouchDevice() ? 'touch' : 'desktop';
    this.ctrl = new InputManager(this, mode);

    // eventos
    this.events.on('player-damage', (dmg: number) => this.onPlayerDamage(dmg));
    this.events.on('damage-number', (x: number, y: number, n: number, src: string) => this.spawnDamageNumber(x, y, n, src));
    this.events.on('enemy-killed', (x: number, y: number, chips: number, sc: number, kind: EnemyKind, elite: boolean) =>
      this.onEnemyKilled(x, y, chips, sc, kind, elite));
    this.events.on('boss-killed', () => this.onBossKilled());

    // si el usuario toca la pantalla, activar controles tactiles al vuelo
    this.input.on('pointerdown', () => {
      if (this.ctrl.mode !== 'touch') {
        this.ctrl.mode = 'touch';
        this.ctrl.enableTouch();
      }
    });

    // boton de pausa
    this.buildPauseButton();

    this.loadRoom(start, null);

    if (this.ctrl.mode === 'touch') this.hud.root.setY(0);

    Sfx.resume();
    Sfx.startMusic(98 + this.floor * 4);

    // pausa con ESC / P
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause(true));
    this.input.keyboard?.on('keydown-P', () => this.togglePause(true));

    this.cameras.main.fadeIn(260, 0, 0, 0);

    // actualizacion de particulas de fondo
    this.time.addEvent({
      delay: 140, loop: true, callback: () => {
        if (this.phase === 'dead' || this.paused) return;
        this.bgFog.tilePositionX += 0.16;
      },
    });
  }

  // ---------------------------------------------------- fondo
  private buildBackground() {
    this.bgSky = this.add.tileSprite(0, 0, GAME_W, GAME_H, 'bg_sky').setOrigin(0).setScrollFactor(0).setDepth(-50);
    this.bgFar = this.add.tileSprite(0, 130, GAME_W, 142, 'bg_far').setOrigin(0).setScrollFactor(0).setDepth(-40);
    this.bgMid = this.add.tileSprite(0, 96, GAME_W, 176, 'bg_mid').setOrigin(0).setScrollFactor(0).setDepth(-30);
    this.bgNear = this.add.tileSprite(0, 178, GAME_W, 92, 'bg_near').setOrigin(0).setScrollFactor(0).setDepth(-20);
    this.bgFog = this.add.tileSprite(0, 170, GAME_W, 100, 'bg_fog').setOrigin(0).setScrollFactor(0).setDepth(-10).setBlendMode(Phaser.BlendModes.ADD);
    this.bgFog.setAlpha(0.5);
    // oscurece el parallax para que la sala tenga contraste
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x06060c, 0.45).setOrigin(0).setScrollFactor(0).setDepth(-5);

    // overlays CRT
    this.add.image(0, 0, 'fx_scanlines').setOrigin(0).setScrollFactor(0).setDepth(70).setAlpha(0.5);
    this.add.image(0, 0, 'fx_vignette').setOrigin(0).setScrollFactor(0).setDepth(71).setAlpha(0.75);
  }

  private buildPauseButton() {
    const btn = this.add.image(GAME_W - 10, GAME_H - 10, 'hud_slot').setScrollFactor(0)
      .setDepth(65).setScale(0.9).setAlpha(0.6).setInteractive({ useHandCursor: true });
    this.add.bitmapText(GAME_W - 10, GAME_H - 12, 'neon', 'II', 6)
      .setOrigin(0.5).setScrollFactor(0).setDepth(66).setTint(0x8ff7ff);
    btn.on('pointerdown', () => { this.togglePause(); });
  }

  // ---------------------------------------------------- salas
  private loadRoom(node: RoomNode, fromDir: 'n' | 's' | 'e' | 'w' | null) {
    this.clearRoomObjects();
    this.phase = 'enter';
    this.transitioning = false;

    const rng = new Phaser.Math.RandomDataGenerator([`${this.dungeon.floor}-${node.gx}-${node.gy}`]);
    const neighbors = this.dungeon.neighbors(node).slice(0, 2);
    this.room = buildRoom(this, node, neighbors, rng);
    this.dungeon.current = node;
    node.visited = true;

    // ---- solidos estaticos ----
    if (!this.player) {
      this.player = new Player(this, this.room.playerSpawn.x, this.room.playerSpawn.y);
      this.player.setStats(this.prog.stats());
      this.bindPlayerEvents();
    } else {
      const pos = this.entryPosition(fromDir);
      this.player.setPosition(pos.x, pos.y);
      this.player.body.setVelocity(0, 0);
      this.player.setStats(this.prog.stats());
      this.player.stop();
      this.player.clearTint();
      this.player.setAlpha(1);
    }
    const worldSolids = this.physics.add.staticGroup();
    for (const r of this.room.solids) {
      const rect = this.add.rectangle(r.x + r.width / 2, r.y + r.height / 2, r.width, r.height, 0, 0);
      this.physics.add.existing(rect, true);
      (rect.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      worldSolids.add(rect);
    }
    // limites duros del mundo = tamano de la sala
    this.physics.world.setBounds(0, 0, GAME_W, ROOM_H * TILE);
    this.player.setCollideWorldBounds(true);
    this.physics.add.collider(this.player, worldSolids);
    this.solidGroup = worldSolids;
    this.roomObjects.push(this.room.visual);

    // ---- camara fija (una pantalla por sala) ----
    this.cameras.main.stopFollow();
    this.cameras.main.setBounds(0, 0, GAME_W, GAME_H);
    this.cameras.main.setScroll(0, 0);

    // ---- props solidos ----
    const propGroup = this.physics.add.staticGroup();
    for (const p of this.room.props) {
      const idx2 = p.index;
      if (idx2 === 23 || idx2 === 24) {
        this.spawnBarrel(p.x, p.y, idx2 === 23);
      } else {
        const img = this.add.image(p.x, p.y, 'tileset', idx2).setDepth(4);
        this.roomObjects.push(img);
        const blocker = this.add.rectangle(p.x, p.y + 2, 14, 12, 0, 0);
        this.physics.add.existing(blocker, true);
        propGroup.add(blocker);
        this.roomObjects.push(blocker);
      }
    }
    this.physics.add.collider(this.player, propGroup);

    // ---- decoracion ----
    this.spawnDecor(rng);

    // ---- puertas ----
    this.gates = [];
    for (const d of this.room.doors) {
      if (!d.open) {
        const gate = this.add.sprite(d.x, d.y, 'gate').setDepth(6).setScale(1, 1.6);
        gate.play('a_gate');
        this.gates.push(gate);
        const blocker = this.add.rectangle(d.x, d.y, 18, 54, 0, 0);
        this.physics.add.existing(blocker, true);
        const grp = this.physics.add.staticGroup();
        grp.add(blocker);
        this.physics.add.collider(this.player, grp);
        this.roomObjects.push(blocker);
      } else {
        this.markDoorOpen(d.x, d.y);
      }
    }

    // ---- contenido ----
    this.enemies = [];
    this.boss = null;
    if (node.type === 'combat' || node.type === 'elite' || node.type === 'secret') {
      if (!node.cleared) this.spawnWave(node); else this.phase = 'cleared';
    } else if (node.type === 'boss') {
      if (!node.cleared) this.spawnBossRoom(); else this.phase = 'cleared';
    } else if (node.type === 'treasure') {
      if (!node.cleared) this.spawnTreasure(); else this.phase = 'cleared';
    } else {
      node.cleared = true;
      this.phase = 'cleared';
    }

    if (node.type === 'boss' && node.cleared) this.showPortal();

    this.hud.setStats(this.prog.stats().dashCd);
    this.cameras.main.fadeIn(180, 10, 6, 24);
  }

  private markDoorOpen(x: number, y: number) {
    const glow = this.add.image(x, y, 'p_glow').setTint(0x19c8dc)
      .setScale(1.6, 2.4).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
    this.roomObjects.push(glow);
    const label = this.add.bitmapText(x, y - 34, 'neon', '>>', 6)
      .setOrigin(0.5).setTint(0x8ff7ff).setDepth(6);
    this.tweens.add({ targets: label, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
    this.roomObjects.push(label);
  }

  private entryPosition(fromDir: 'n' | 's' | 'e' | 'w' | null) {
    const y = FLOOR_Y - 22;
    if (!fromDir) return { x: GAME_W / 2, y };
    const door = this.room.doors.find(d =>
      (fromDir === 'e' && d.side === 'w') || (fromDir === 'w' && d.side === 'e'));
    if (door) return { x: door.x + (door.side === 'w' ? 26 : -26), y };
    return { x: GAME_W / 2, y };
  }


  private clearRoomObjects() {
    for (const o of this.roomObjects) {
      if (o && typeof (o as Phaser.GameObjects.GameObject).destroy === 'function') {
        (o as Phaser.GameObjects.GameObject).destroy();
      }
    }
    this.roomObjects = [];
    this.gates.forEach(g => g.destroy());
    this.gates = [];
    this.decor.forEach(d => d.destroy());
    this.decor = [];
    this.enemies.forEach(e => { if (e.active) e.destroy(); });
    this.enemies = [];
    this.boss?.destroy();
    this.boss = null;
    if (this.room?.textureKey && this.textures.exists(this.room.textureKey)) {
      this.textures.remove(this.room.textureKey);
    }
    this.pickups.forEach(p => { if (p.active) p.destroy(); });
    this.pickups = [];
    this.enemyBolts?.all.forEach(b => b.kill());
    this.playerBolts?.all.forEach(b => b.kill());
    this.portal?.destroy(); this.portal = undefined;
    this.portalGlow?.destroy(); this.portalGlow = undefined;
    this.turret?.destroy(); this.turret = undefined;
  }

  // ---------------------------------------------------- contenido
  private spawnDecor(rng: Phaser.Math.RandomDataGenerator) {
    // lamparas colgadas del techo con su cable
    for (let i = 0; i < 4; i++) {
      const x = 70 + i * 110;
      const cord = this.add.rectangle(x, 26, 1, 18, 0x3a4268, 0.9).setDepth(1);
      const lamp = this.add.sprite(x, 44, 'prop_lamp').setScale(1, 1).setDepth(1).setAlpha(0.9);
      lamp.play('a_lamp');
      this.decor.push(cord, lamp);
    }

    // props apoyados sobre plataformas o el suelo
    type Sup = { x0: number; x1: number; y: number };
    const sups: Sup[] = [{ x0: 3 * TILE, x1: (ROOM_W - 3) * TILE, y: FLOOR_Y }];
    for (const r of this.room.solids) {
      if (r.y > 4 * TILE && r.y < FLOOR_Y - TILE && r.width >= 3 * TILE) {
        sups.push({ x0: r.x + 8, x1: r.right - 8, y: r.y });
      }
    }
    const n = 2 + rng.between(0, 2);
    for (let i = 0; i < n; i++) {
      const sup = sups[rng.between(0, sups.length - 1)];
      const x = Phaser.Math.Between(sup.x0, sup.x1);
      const kind = rng.between(0, 2);
      const spr = this.add.sprite(x, sup.y, kind === 0 ? 'prop_holo' : kind === 1 ? 'prop_plant' : 'prop_fan')
        .setOrigin(0.5, 1).setDepth(kind === 1 ? 4 : 3).setAlpha(0.92);
      if (kind === 0) spr.play('a_holo');
      if (kind === 2) spr.play('a_fan');
      this.decor.push(spr);
    }
  }

  private spawnWave(node: RoomNode) {
    const f = this.floor;
    const kindPool: EnemyKind[] = node.type === 'elite'
      ? ['brute', 'mage', 'crawler']
      : ['drone', 'crawler', 'crawler', 'drone', 'brute', 'mage'];
    const count = node.type === 'elite' ? 2 : Phaser.Math.Clamp(2 + Math.floor(f * 0.9), 2, 7);
    const pts = Phaser.Utils.Array.Shuffle([...this.room.spawnPoints]);

    for (let i = 0; i < count; i++) {
      const p = pts[i % pts.length];
      const kind = kindPool[Phaser.Math.Between(0, kindPool.length - 1)];
      this.time.delayedCall(180 + i * 210, () => {
        if (this.phase === 'dead') return;
        this.spawnEnemy(kind, p.x + Phaser.Math.Between(-10, 10), p.y, 1 + f * 0.16, node.type === 'elite' && i === 0);
      });
      const warn = this.add.sprite(p.x, p.y, 'fx_spawn').setDepth(3);
      warn.play('a_spawn');
      warn.once('animationcomplete', () => warn.destroy());
    }
    Sfx.spawn();
  }

  spawnEnemy(kind: EnemyKind, x: number, y: number, hpScale = 1, elite = false) {
    const e = new Enemy(this, x, y, kind, hpScale, elite);
    e.setTarget(this.player);
    e.onShoot = (sx, sy, tx, ty, dmg) => {
      const b = this.enemyBolts.get();
      const ang = Math.atan2(ty - sy, tx - sx);
      b.fire(sx, sy, Math.cos(ang) * 120, Math.sin(ang) * 120, dmg, false);
      this.registerEnemyBolt(b);
    };
    this.enemies.push(e);

    // colisiones
    if (this.solidGroup) this.physics.add.collider(e, this.solidGroup);
    this.playerBoltGroup = this.playerBoltGroup ?? this.add.group();
    this.physics.add.overlap(e, this.playerBoltGroup, (obj1, obj2) => {
      const b = (obj1 instanceof Projectile ? obj1 : obj2) as Projectile;
      if (!b || !b.active || !b.friendly) return;
      if (!b.registerHit(e)) return;
      this.hitEnemy(e, b.damage, false);
      this.impactFX(b.x, b.y);
    });
    this.physics.add.collider(e, this.player, () => this.touchEnemy(e));
    return e;
  }

  private spawnBossRoom() {
    const cx = GAME_W / 2;
    const cy = FLOOR_Y - 72;   // alcanzable con salto + espada
    Sfx.bossWarn();
    const warn = this.add.bitmapText(GAME_W / 2, GAME_H / 2 - 10, 'neon', 'ALERTA // OVERSEER', 8)
      .setScrollFactor(0).setOrigin(0.5).setDepth(64).setTint(0xff7ad9);
    this.tweens.add({ targets: warn, alpha: 0.2, duration: 160, yoyo: true, repeat: 7 });
    this.time.delayedCall(2400, () => {
      warn.destroy();
      this.boss = new Boss(this, cx, cy, this.floor);
      (this as unknown as { playerRef?: Player }).playerRef = this.player;
      this.boss.onShoot = (sx, sy, tx, ty, dmg, speed = 140) => {
        const b = this.enemyBolts.get();
        const ang = Math.atan2(ty - sy, tx - sx);
        b.fire(sx, sy, Math.cos(ang) * speed, Math.sin(ang) * speed, dmg, false);
        this.registerEnemyBolt(b);
      };
      this.boss.onBurst = (sx, sy, count, dmg) => {
        for (let i = 0; i < count; i++) {
          const a = (Math.PI * 2 * i) / count;
          const b = this.enemyBolts.get();
          b.fire(sx, sy, Math.cos(a) * 100, Math.sin(a) * 100, dmg, false);
          this.registerEnemyBolt(b);
        }
      };
      this.boss.onSlam = (sx, sy) => {
        const wave = this.add.sprite(sx, sy, 'fx_shockwave').setDepth(12).setScale(2.4);
        wave.play('a_shock');
        wave.once('animationcomplete', () => wave.destroy());
        this.cameras.main.shake(200, 0.008);
        const d = Phaser.Math.Distance.Between(sx, sy, this.player.x, this.player.y);
        if (d < 90 && !this.player.invulnerable) this.player.takeDamage(18);
      };
      this.physics.add.overlap(this.boss!, this.player, () => {
        if (!this.player.invulnerable) {
          this.player.takeDamage(16);
          Sfx.hit();
        }
      });
      this.enemies.push(this.boss! as unknown as Enemy);
      this.lockDoors();
    });
  }

  private spawnTreasure() {
    const cx = GAME_W / 2;
    const cy = FLOOR_Y - 30;
    const kind = Math.random() < 0.55 ? 'mod' : 'heal';
    this.spawnPickup(cx - 30, cy, kind, 0);
    this.spawnPickup(cx + 30, cy, kind === 'mod' ? 'heal' : 'mod', 0);
    for (let i = 0; i < 5; i++) {
      this.spawnPickup(cx + Phaser.Math.Between(-60, 60), cy - 20, 'chip', Phaser.Math.Between(3, 8) + this.floor * 2);
    }
    this.time.delayedCall(120, () => { this.phase = 'cleared'; this.unlockDoors(this.dungeon.current!); });
  }

  // ---------------------------------------------------- acciones
  private bindPlayerEvents() {
    this.player.onAttack = (x, y, dir, stats) => this.doMelee(x, y, dir, stats);
    this.player.onDash = (x, y, dir) => {
      const g = this.add.sprite(x, y, 'fx_dash').setDepth(9).setFlipX(dir < 0).setScale(1.4);
      g.play('a_dash');
      g.once('animationcomplete', () => g.destroy());
      if ((this.prog.mods.bomb ?? 0) > 0) {
        // pequena onda al iniciar dash con minas
        const wave = this.add.sprite(x, y, 'fx_shockwave').setDepth(9).setScale(0.8);
        wave.play('a_shock');
        wave.once('animationcomplete', () => wave.destroy());
      }
    };
    this.player.onStep = () => { this.dashTimer = Math.max(0, this.dashTimer); };

    this.enemyBoltGroup = this.add.group();
    this.physics.add.overlap(this.player, this.enemyBoltGroup, (obj1, obj2) => {
      const b = (obj1 instanceof Projectile ? obj1 : obj2) as Projectile;
      if (!b || !b.active || b.friendly) return;
      if (this.player.invulnerable) return;
      b.registerHit(this.player);
      this.player.takeDamage(b.damage);
      this.impactFX(b.x, b.y);
    });
  }

  private doMelee(x: number, y: number, dir: number, stats: Stats) {
    // proyeccion de plasma
    const px = x + dir * 16;
    const py = y - 2;
    const bolts = 1 + stats.multiShot;
    for (let i = 0; i < bolts; i++) {
      const b = this.playerBolts.get();
      const spread = (i - (bolts - 1) / 2) * 0.16;
      const ang = (dir > 0 ? 0 : Math.PI) + spread;
      b.fire(px, py, Math.cos(ang) * 330, Math.sin(ang) * 330,
        Math.round(14 * stats.dmgMult), true, stats.pierce);
      if (this.playerBoltGroup && !this.playerBoltGroup.contains(b)) this.playerBoltGroup.add(b);
    }

    // golpe cuerpo a cuerpo: cono frontal generoso (mejor sensacion en movil)
    const range = 46 * stats.rangeMult + stats.longSword * 14;
    for (const e of [...this.enemies]) {
      if (!e || !e.active || (e as unknown as { dead?: boolean }).dead) continue;
      const dx = e.x - x;
      const dy = e.y - y;
      const dist = Math.hypot(dx, dy);
      const reach = range + Math.max(10, (e.displayWidth || 16) * 0.5);
      const inFront = Math.sign(dx) === dir || Math.abs(dx) < 14;
      if (dist <= reach && inFront && Math.abs(dy) < reach * 0.95) {
        this.hitEnemy(e, Math.round(18 * stats.dmgMult), true);
      }
    }
    this.comboWindow = 0.9;
  }

  private hitEnemy(e: Enemy, baseDmg: number, melee: boolean) {
    if (!e || !e.active || (e as unknown as { dead?: boolean }).dead) return;
    const stats = this.prog.stats();
    const isCrit = Math.random() < stats.critChance;
    let dmg = Math.round(baseDmg * (isCrit ? stats.critMult : 1));
    dmg += Phaser.Math.Between(0, 2);

    // sinergia de veneno y congelacion
    if (stats.venom > 0) e.applyVenom(1.6 + stats.venom * 0.8);
    if (stats.freeze > 0 && melee) e.applyFreeze(0.6 + stats.freeze * 0.5);

    const died = e.takeDamage(dmg, isCrit ? 'crit' : melee ? 'melee' : 'bolt');

    // drenaje
    if (stats.lifesteal > 0) {
      this.prog.hp = Math.min(this.prog.maxHp, this.prog.hp + Math.max(1, Math.round(dmg * stats.lifesteal)));
    }
    this.hitFX(e.x, e.y);
    this.comboCount++;
    this.score += isCrit ? 3 : 1;
    if (died) this.onEnemyDeath();
    void Sfx.hit();
  }

  private hitFX(x: number, y: number) {
    const h = this.add.sprite(x, y, 'fx_hit').setDepth(13).setScale(0.9);
    h.play('a_hit');
    h.once('animationcomplete', () => h.destroy());
  }

  private impactFX(x: number, y: number) {
    const h = this.add.image(x, y, 'p_white').setDepth(13);
    this.tweens.add({ targets: h, alpha: 0, scale: 2, duration: 120, onComplete: () => h.destroy() });
  }

  private touchEnemy(e: Enemy) {
    if (this.player.invulnerable || this.phase === 'dead') return;
    this.player.takeDamage(e.damage);
    const st = this.prog.stats();
    if (st.thorns > 0) this.hitEnemy(e, st.thorns, false);
  }

  private onPlayerDamage(dmg: number) {
    if (this.shields > 0) {
      this.shields--;
      const sh = this.add.sprite(this.player.x, this.player.y, 'fx_shield').setDepth(14);
      sh.play('a_shield');
      this.time.delayedCall(300, () => sh.destroy());
      Sfx.pickup();
      return;
    }
    this.prog.hp -= dmg;
    this.hud.flashHp();
    this.cameras.main.shake(120, 0.006);
    if (this.prog.hp <= 0) this.onPlayerDeath();
  }

  private onPlayerDeath() {
    if (this.phase === 'dead') return;
    // fenix
    if (this.prog.hasRevive) {
      this.prog.mods.revive = 0;
      this.prog.hp = Math.round(this.prog.maxHp * 0.5);
      this.player.reviveAt(this.player.x, this.player.y);
      const wave = this.add.sprite(this.player.x, this.player.y, 'fx_shockwave').setDepth(15).setScale(3);
      wave.play('a_shock');
      wave.once('animationcomplete', () => wave.destroy());
      Sfx.victory();
      return;
    }
    this.phase = 'dead';
    this.player.playDeath();
    Sfx.stopMusic();
    Sfx.gameover();
    this.cameras.main.shake(300, 0.01);

    this.time.delayedCall(1100, () => {
      Store.data.runs++;
      Store.data.totalKills += this.kills;
      Store.data.bestScore = Math.max(Store.data.bestScore, this.score);
      Store.save();
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(420, () => {
        this.scene.start('GameOver', {
          floor: this.floor, score: this.score, kills: this.kills, chips: this.prog.chips,
          mods: Object.keys(this.prog.mods).length,
        });
      });
    });
  }

  private onEnemyKilled(x: number, y: number, chips: number, sc: number, kind: EnemyKind, elite: boolean) {
    this.kills++;
    this.score += sc;
    this.comboCount++;
    const ex = this.add.sprite(x, y, 'fx_explosion').setDepth(12).setScale(kind === 'brute' ? 1.2 : 0.8);
    ex.play('a_explosion');
    ex.once('animationcomplete', () => ex.destroy());

    // soltar chips
    const n = elite ? 5 : Phaser.Math.Between(1, 3);
    for (let i = 0; i < n; i++) {
      const p = this.spawnPickup(x + Phaser.Math.Between(-8, 8), y + Phaser.Math.Between(-8, 4),
        'chip', Math.max(1, Math.round(chips / n)));
      p?.body.setVelocity(Phaser.Math.Between(-60, 60), Phaser.Math.Between(-110, -40));
    }
    // probabilidad de vida
    if (Math.random() < 0.14) {
      const p = this.spawnPickup(x, y - 6, 'heal', 0);
      p?.body.setVelocity(Phaser.Math.Between(-30, 30), -90);
    }

    if (this.node_isClearedByKills()) this.onRoomCleared();
  }

  /** Numeritos de dano flotantes */
  spawnDamageNumber(x: number, y: number, amount: number, source: string) {
    const crit = source === 'crit';
    const color = crit ? 0xffd23f : source === 'venom' ? 0x96ffc3 : source === 'melee' ? 0xff7ad9 : 0x8ff7ff;
    const t = this.add.bitmapText(x + Phaser.Math.Between(-4, 4), y, 'neon', `${amount}`, crit ? 7 : 6)
      .setOrigin(0.5).setTint(color).setDepth(30);
    if (crit) t.setText(`${amount}!`);
    this.tweens.add({
      targets: t, y: y - 18, alpha: 0, duration: crit ? 620 : 460,
      ease: 'Quad.easeOut', onComplete: () => t.destroy(),
    });
  }

  onEnemyDeath() {
    // reservado para efectos globales de muerte (camara, combo)
    if (this.comboCount > 0 && this.comboCount % 8 === 0) {
      const t = this.add.bitmapText(GAME_W / 2, 90, 'neon', `COMBO X${this.comboCount}`, 8)
        .setOrigin(0.5).setScrollFactor(0).setDepth(64).setTint(0xffd23f);
      this.tweens.add({ targets: t, alpha: 0, y: 76, duration: 700, onComplete: () => t.destroy() });
    }
  }

  private node_isClearedByKills(): boolean {
    return this.enemies.every(e => !e.active || (e as unknown as { dead?: boolean }).dead) && this.boss === null;
  }

  private onBossKilled() {
    const boss = this.boss;
    this.boss = null;
    void boss;
    this.score += 250 + this.floor * 50;
    this.cameras.main.flash(300, 25, 200, 220);
    // portal
    const cx = GAME_W / 2;
    const cy = FLOOR_Y - 40;
    this.portal = this.add.sprite(cx, cy, 'fx_portal').setDepth(5).setScale(2.4);
    this.portal.play('a_portal');
    this.portalGlow = this.add.image(cx, cy, 'p_glow').setTint(0x7b3ff2)
      .setScale(4).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(4);
    // recompensa
    for (let i = 0; i < 8; i++) {
      this.spawnPickup(cx + Phaser.Math.Between(-50, 50), cy - 20, 'chip', 6 + this.floor * 2);
    }
    this.spawnPickup(cx - 40, cy - 10, 'mod', 0);
    Sfx.victory();
    this.onRoomCleared();
  }

  private onRoomCleared() {
    const node = this.dungeon.current;
    if (!node || node.cleared) return;
    this.phase = 'cleared';
    this.unlockDoors(node);
    Sfx.portal();

    // cartel de sala limpia
    const t = this.add.bitmapText(GAME_W / 2, 60, 'neon', node.type === 'boss' ? 'OVERSEER DERROTADO' : 'SALA DESPEJADA', 8)
      .setScrollFactor(0).setOrigin(0.5).setDepth(64).setTint(0x8ff7ff).setAlpha(0);
    this.tweens.add({ targets: t, alpha: 1, y: 54, duration: 220, yoyo: true, hold: 900, onComplete: () => t.destroy() });
  }

  private showPortal() {
    const cx = GAME_W / 2;
    const cy = FLOOR_Y - 40;
    this.portal = this.add.sprite(cx, cy, 'fx_portal').setDepth(5).setScale(2.4);
    this.portal.play('a_portal');
    this.portalGlow = this.add.image(cx, cy, 'p_glow').setTint(0x7b3ff2)
      .setScale(4).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(4);
  }

  private lockDoors() {
    // los bloqueos ya existen al construir la sala
  }

  private unlockDoors(node: RoomNode) {
    node.cleared = true;
    for (const d of this.room.doors) {
      d.open = true;
      const glow = this.add.image(d.x, d.y, 'p_glow').setTint(0x19c8dc)
        .setScale(1.6, 2.4).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
      this.roomObjects.push(glow);
      const label = this.add.bitmapText(d.x, d.y - 34, 'neon', '>>', 6)
        .setOrigin(0.5).setTint(0x8ff7ff).setDepth(6);
      this.tweens.add({ targets: label, alpha: 0.3, duration: 700, yoyo: true, repeat: -1 });
      this.roomObjects.push(label);
    }
    this.gates.forEach(g => {
      this.tweens.add({ targets: g, alpha: 0, duration: 300, onComplete: () => g.destroy() });
    });
    this.gates = [];
  }

  // ---------------------------------------------------- pickups
  spawnPickup(x: number, y: number, kind: 'chip' | 'heal' | 'mod' | 'coin' | 'key', value: number): Pickup | null {
    if (!this.physics.world.bounds.contains(x, y)) return null;
    const p = new Pickup(this, x, y, kind, value);
    this.pickups.push(p);
    if (this.solidGroup) this.physics.add.collider(p, this.solidGroup);
    this.physics.add.overlap(p, this.player, () => this.collect(p));
    return p;
  }

  private collect(p: Pickup) {
    if (!p.active) return;
    const st = this.prog.stats();
    switch (p.kind) {
      case 'chip':
        this.prog.chips += p.value;
        Sfx.coin();
        break;
      case 'heal':
        this.prog.hp = Math.min(this.prog.maxHp, this.prog.hp + 25);
        Sfx.heal();
        break;
      case 'mod':
        Sfx.mod();
        this.openModChoice();
        break;
      case 'coin':
        this.prog.chips += 25;
        Sfx.coin();
        break;
      case 'key':
        break;
    }
    // magnet + fx
    const eff = this.add.image(p.x, p.y, 'p_glow')
      .setTint(p.kind === 'chip' ? 0x2fd67b : 0xffffff).setScale(1.6).setAlpha(0.8)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(15);
    this.tweens.add({ targets: eff, alpha: 0, scale: 2.6, duration: 220, onComplete: () => eff.destroy() });
    this.pickups = this.pickups.filter(o => o !== p);
    p.collect();
    void st;
  }

  private openModChoice() {
    if (this.modsOffered) return;
    this.modsOffered = true;
    const luck = this.prog.stats().luck;
    const choices = rollMods(this.prog.mods, 3, luck);
    this.scene.launch('ModChoice', {
      mods: choices, floor: this.floor,
      onPick: (id: ModId) => {
        this.prog.add(id);
        const st = this.prog.stats();
        this.prog.maxHp = st.maxHp;
        this.player.setStats(st);
        if (id === 'heal') this.prog.hp = Math.min(this.prog.maxHp, this.prog.hp + 40);
        if (id === 'chip') this.prog.chips += 25;
        if (id === 'shield') this.shields++;
        this.modsOffered = false;
        if (id === 'turret') this.spawnTurret();
        Sfx.mod();
      },
    });
  }

  private spawnTurret() {
    this.turret?.destroy();
    const c = this.add.container(GAME_W / 2, FLOOR_Y - 34).setDepth(9);
    const body = this.add.image(0, 0, 'icons_mods', 23).setScale(1.1);
    const glow = this.add.image(0, 0, 'p_glow').setTint(0x19c8dc).setScale(1.4).setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD);
    c.add([glow, body]);
    this.turret = c;
  }

  // ---------------------------------------------------- loop
  update(time: number, delta: number) {
    this.ctrl.update();
    const inp = this.ctrl.state;

    if (this.player?.active && this.phase !== 'dead' && !this.paused
        && !this.scene.isActive('ModChoice')) {
      this.player.update(time, delta, inp);
    }

    // dash cooldown HUD
    this.dashTimer = Math.min(this.prog.stats().dashCd, this.dashTimer + delta / 1000);

    // enemigos
    if (this.phase !== 'dead' && !this.paused) {
      for (const e of [...this.enemies]) if (e.active) e.update(time, delta);
    }
    this.boss?.update(time, delta);

    // proyectiles
    for (const b of [...this.playerBolts.all, ...this.enemyBolts.all]) {
      if (!b.active) continue;
      b.update(time, delta);
      // fuera de mundo
      if (b.x < -20 || b.x > GAME_W + 20 || b.y < -20 || b.y > GAME_H + 20) b.kill();
    }

    // magnet
    const st = this.prog.stats();
    if (this.phase !== 'dead') {
      for (const p of this.pickups) {
        if (!p.active || p.kind === 'mod') continue;
        const d = Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y);
        if (d < st.magnetR) {
          const ang = Phaser.Math.Angle.Between(p.x, p.y, this.player.x, this.player.y);
          p.body.setVelocity(Math.cos(ang) * 160, Math.sin(ang) * 160);
        }
      }
    }

    // sinergias automaticas
    this.updateSynergies(delta, st);

    // puertas: transicion si el jugador las cruza
    this.checkDoors();

    // portal
    if (this.portal && Phaser.Math.Distance.Between(this.portal.x, this.portal.y, this.player.x, this.player.y) < 26) {
      this.portal.destroy(); this.portal = undefined;
      this.portalGlow?.destroy(); this.portalGlow = undefined;
      this.nextFloor();
    }

    // hud
    this.hud.update(this.player, this.prog, this.floor, this.dungeon,
      this.dashTimer / st.dashCd, this.shields);

    // combo decay
    if (this.comboWindow > 0) this.comboWindow -= delta / 1000;

    this.ctrl.clear();
  }

  private updateSynergies(delta: number, st: Stats) {
    if (this.phase === 'dead' || this.paused) return;

    // laser automatico
    if (st.laser > 0) {
      this.laserTimer -= delta / 1000;
      if (this.laserTimer <= 0) {
        this.laserTimer = 3 / (1 + (st.laser - 1) * 0.5);
        const target = this.closestEnemy(260);
        if (target) {
          const ang = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
          const beam = this.add.sprite(this.player.x, this.player.y, 'fx_beam')
            .setDepth(15).setRotation(ang).setScale(1, 1.4);
          beam.play('a_beam');
          beam.once('animationcomplete', () => beam.destroy());
          this.hitEnemy(target, Math.round(26 * st.dmgMult), false);
        }
      }
    }

    // torreta
    if (this.turret) {
      this.turretTimer -= delta / 1000;
      if (this.turretTimer <= 0) {
        this.turretTimer = 0.85;
        const target = this.closestTo(this.turret.x, this.turret.y, 260);
        if (target) {
          const b = this.playerBolts.get();
          const ang = Phaser.Math.Angle.Between(this.turret.x, this.turret.y, target.x, target.y);
          b.fire(this.turret.x, this.turret.y, Math.cos(ang) * 300, Math.sin(ang) * 300,
            Math.round(10 * st.dmgMult), true, 0);
        }
      }
    }
  }

  private closestEnemy(maxD: number): Enemy | null {
    let best: Enemy | null = null;
    let bd = maxD;
    for (const e of this.enemies) {
      if (!e.active || (e as unknown as { dead?: boolean }).dead) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  private closestTo(x: number, y: number, maxD: number): Enemy | null {
    let best: Enemy | null = null;
    let bd = maxD;
    for (const e of this.enemies) {
      if (!e.active || (e as unknown as { dead?: boolean }).dead) continue;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  // ---------------------------------------------------- puertas
  private checkDoors() {
    if (this.phase !== 'cleared' || this.transitioning) return;
    for (const d of this.room.doors) {
      if (!d.open) continue;
      if (!Phaser.Geom.Rectangle.Contains(d.rect, this.player.x, this.player.y)) continue;
      const entry: 'e' | 'w' = d.side === 'w' ? 'e' : 'w';
      this.transitioning = true;
      this.phase = 'transition';
      this.cameras.main.fadeOut(150, 10, 6, 24);
      this.time.delayedCall(170, () => {
        this.loadRoom(d.node, entry);
      });
      return;
    }
  }

  // ---------------------------------------------------- piso
  private nextFloor() {
    if (this.phase === 'dead') return;
    this.phase = 'transition';
    Sfx.portal();
    this.cameras.main.flash(400, 123, 63, 242);
    this.floor++;
    Store.data.bestFloor = Math.max(Store.data.bestFloor, this.floor);
    Store.data.bestScore = Math.max(Store.data.bestScore, this.score);
    Store.save();

    this.time.delayedCall(420, () => {
      this.scene.start('Intermission', {
        floor: this.floor,
        score: this.score,
        kills: this.kills,
        prog: this.prog,
      });
    });
  }

  // ---------------------------------------------------- pausa
  togglePause(force = false) {
    if (this.phase === 'dead') return;
    if (this.paused && !force) { this.closePause(); return; }
    if (this.paused) return;
    this.paused = true;
    this.physics.world.pause();

    const c = this.add.container(0, 0).setScrollFactor(0).setDepth(80);
    const bg = this.add.graphics();
    bg.fillStyle(0x080810, 0.85).fillRect(0, 0, GAME_W, GAME_H);
    c.add(bg);
    c.add(this.add.bitmapText(GAME_W / 2, 80, 'neon', 'PAUSA', 12).setOrigin(0.5).setTint(0x8ff7ff));
    const opts = ['CONTINUAR', Store.data.muted ? 'SONIDO OFF' : 'SONIDO ON', 'SALIR AL MENU'];
    opts.forEach((o, i) => {
      const t = this.add.bitmapText(GAME_W / 2, 130 + i * 22, 'neon', o, 8)
        .setOrigin(0.5).setTint(0x8a93b8).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => t.setTint(0x8ff7ff));
      t.on('pointerout', () => t.setTint(0x8a93b8));
      t.on('pointerdown', () => {
        Sfx.ui();
        if (i === 0) this.closePause();
        if (i === 1) { Sfx.setMuted(!Store.data.muted); t.setText(Store.data.muted ? 'SONIDO OFF' : 'SONIDO ON'); }
        if (i === 2) { Sfx.stopMusic(); this.scene.start('Menu'); }
      });
      c.add(t);
    });
    this.pauseOverlay = c;
  }

  private closePause() {
    this.paused = false;
    this.physics.world.resume();
    this.pauseOverlay?.destroy();
    this.pauseOverlay = undefined;
  }

  // ---------------------------------------------------- props destructibles
  private spawnBarrel(x: number, y: number, red: boolean) {
    const frame = red ? 23 : 24;
    const s = this.add.image(x, y, 'tileset', frame).setDepth(6);
    this.roomObjects.push(s);
    const zone = this.add.zone(x, y, 14, 14);
    this.physics.add.existing(zone, true);
    this.roomObjects.push(zone);
    this.physics.add.collider(this.player, zone);

    // reaccion a golpes
    const checkHit = () => {
      if (!s.active) return;
      const near = this.player.stateName === 'dash' &&
        Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < 30;
      const bolt = [...this.playerBolts.all].find(b => b.active &&
        Phaser.Math.Distance.Between(b.x, b.y, x, y) < 14);
      if (near || bolt) {
        bolt?.kill();
        s.destroy();
        zone.destroy();
        this.spawnPickup(x, y, red ? 'heal' : 'chip', red ? 0 : 5);
        if (red) {
          const ex = this.add.sprite(x, y, 'fx_explosion').setDepth(12).setScale(1.1);
          ex.play('a_explosion');
          ex.once('animationcomplete', () => ex.destroy());
          Sfx.explosion();
          for (const e of [...this.enemies]) {
            if (e.active && Phaser.Math.Distance.Between(x, y, e.x, e.y) < 44) this.hitEnemy(e, 30, false);
          }
        } else {
          Sfx.hit();
        }
      }
    };
    this.time.addEvent({ delay: 90, loop: true, callback: checkHit });
  }

  // ---------------------------------------------------- debug helpers
  get _room() { return this.room; }
}

