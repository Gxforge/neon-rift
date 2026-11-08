import { chromium } from 'playwright';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', e => console.log('ERR:', (e.message||'').slice(0,120)));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);
await page.keyboard.press('Enter');
await page.waitForTimeout(1000);
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  const bn = s.dungeon.nodes.find(n => n.type === 'boss');
  s.loadRoom(bn, null);
});
await page.waitForTimeout(3000);
const d = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return { bossY: s.boss?.y, playerY: s.player?.y, bossHp: s.boss?.hp,
           enemiesLen: s.enemies.length, bossInEnemies: s.enemies.includes(s.boss),
           phase: s.phase };
});
console.log('DISTANCIA:', JSON.stringify(d));
// prueba directa de hitEnemy
const r = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  const before = s.boss.hp;
  s.hitEnemy(s.boss, 20, true);
  return { before, after: s.boss.hp };
});
console.log('HIT DIRECTO:', JSON.stringify(r));
await b.close();
