/* ============================================================
   Recogibles: chips, celdas de vida, modulos y llaves
   ============================================================ */
import Phaser from 'phaser';

export type PickupKind = 'chip' | 'heal' | 'mod' | 'coin' | 'key';

const TEX: Record<PickupKind, string> = {
  chip: 'pickup_chip',
  heal: 'pickup_heal',
  mod: 'pickup_mod',
  coin: 'pickup_coin',
  key: 'pickup_key',
};

export class Pickup extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body;
  kind: PickupKind;
  value = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, kind: PickupKind, value = 0) {
    super(scene, x, y, TEX[kind]);
    this.kind = kind;
    this.value = value;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(7);
    this.setScale(kind === 'mod' ? 1.2 : 1.1);
    this.body.setAllowGravity(true);
    this.body.setCircle(6, this.width / 2 - 6, this.height / 2 - 6);
    this.body.setBounce(0.35);
    this.body.setDragX(220);

    if (kind === 'chip') this.play('a_chip');
    if (kind === 'heal') this.play('a_heal');
    if (kind === 'mod') this.play('a_mod');
    if (kind === 'coin') this.play('a_coin');

    // brillo neon
    const glow = scene.add.image(x, y, 'p_glow')
      .setTint(kind === 'chip' ? 0x2fd67b : kind === 'heal' ? 0xe0333f : kind === 'mod' ? 0x7b3ff2 : 0xffd23f)
      .setScale(kind === 'mod' ? 1.5 : 0.9).setAlpha(0.5)
      .setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
    scene.tweens.add({ targets: glow, alpha: 0.2, scale: glow.scale * 1.25, duration: 700, yoyo: true, repeat: -1 });
    this.once('destroy', () => glow.destroy());

    scene.tweens.add({
      targets: this, y: y - 3, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  collect() {
    this.scene.tweens.killTweensOf(this);
    this.destroy();
  }
}
