import Phaser from 'phaser';
import './style.css';
import { GAME_W, GAME_H, isTouchDevice } from './config';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { ModChoiceScene } from './scenes/ModChoiceScene';
import { IntermissionScene } from './scenes/IntermissionScene';
import { GameOverScene } from './scenes/GameOverScene';

const touch = isTouchDevice();

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: 'app',
  backgroundColor: '#080810',
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 900 },
      debug: false,
      fps: 60,
    },
  },
  input: {
    activePointers: 3,
    gamepad: true,
  },
  scene: [BootScene, PreloadScene, MenuScene, GameScene, ModChoiceScene, IntermissionScene, GameOverScene],
};

const game = new Phaser.Game(config);
// @ts-expect-error debug
window.__game = game;
void game;

// --- fuerza el foco / audio en el primer toque (política de autoplay Android)
const unlock = () => {
  const anyGame = game as unknown as { sound?: { context?: AudioContext } };
  void anyGame;
  window.removeEventListener('pointerdown', unlock);
  window.removeEventListener('touchstart', unlock);
};
window.addEventListener('pointerdown', unlock, { once: true });
window.addEventListener('touchstart', unlock, { once: true });

// --- bloquea gestos del navegador que rompen el juego en Android
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

if (!touch) {
  document.documentElement.classList.add('desktop');
} else {
  document.documentElement.classList.add('mobile');
}

// pausa el juego si se va a segundo plano (bateria en Android)
document.addEventListener('visibilitychange', () => {
  if (document.hidden) game.loop.sleep();
  else game.loop.wake();
});

export default game;
