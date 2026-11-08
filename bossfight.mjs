import { chromium } from 'playwright';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs=[]; page.on('pageerror', e => errs.push((e.message||'').slice(0,120)));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);
await page.keyboard.press('Enter');
await page.waitForTimeout(1000);
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.loadRoom(s.dungeon.nodes.find(n => n.type === 'boss'), null);
});
await page.waitForTimeout(3000);
const d0 = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return { bossY: Math.round(s.boss?.y), playerY: Math.round(s.player?.y), hp: s.boss?.hp };
});
console.log('ANTES:', JSON.stringify(d0));
await page.screenshot({ path: '/tmp/bf0.png' });
// golpear sin parar y saltar
for (let i = 0; i < 60; i++) {
  if (i % 6 === 0) await page.keyboard.press('Space');
  await page.keyboard.press('j');
  await page.waitForTimeout(90);
}
const d1 = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return { bossHp: s.boss?.hp, playerHp: s.prog.hp, phase: s.phase };
});
console.log('DESPUES:', JSON.stringify(d1));
await page.screenshot({ path: '/tmp/bf1.png' });
console.log('errs:', errs.slice(0,2));
await b.close();
