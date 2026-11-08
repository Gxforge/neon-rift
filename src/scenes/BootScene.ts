import Phaser from 'phaser';
import { CSS } from '../config';

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
    // ajustes del pixel art
    this.cameras.main.setRoundPixels(true);

    this.scene.start('Preload');
  }

  preload() {
    // barra de carga ultra simple mientras llega la fuente
    const g = this.add.graphics();
    g.fillStyle(0x080810, 1).fillRect(0, 0, 480, 270);
    g.fillStyle(0x19c8dc, 1).fillRect(170, 132, 140 * 0, 2);
  }

  // texto placeholder (no se usa fuente externa en boot)
}
