import { chromium } from 'playwright';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs = [];
page.on('pageerror', e => errs.push((e.stack||e.message).slice(0,350)));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.keyboard.press('Enter');
await page.waitForTimeout(1200);
// forzar sala de jefe
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  const bossNode = s.dungeon.nodes.find(n => n.type === 'boss');
  s.dungeon.current.visited = true;
  s.loadRoom(bossNode, null);
});
await page.waitForTimeout(3200);
await page.screenshot({ path: '/tmp/b1_boss.png' });
const st = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return { phase: s.phase, boss: !!s.boss, hp: s.boss?.hp, maxHp: s.boss?.maxHp };
});
console.log('BOSS:', JSON.stringify(st));
// el boss esta arriba: saltar y atacar
for (let i = 0; i < 40; i++) {
  await page.keyboard.press('Space');
  await page.waitForTimeout(120);
  await page.keyboard.press('j');
  await page.waitForTimeout(120);
}
await page.screenshot({ path: '/tmp/b2_fight.png' });
const st2 = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return { bossHp: s.boss?.hp, phase: s.phase, playerHp: s.prog.hp, enemies: s.enemies.length };
});
console.log('PELEA:', JSON.stringify(st2));
// matar al jefe
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  if (s.boss) s.boss.takeDamage(99999);
});
await page.waitForTimeout(1600);
await page.screenshot({ path: '/tmp/b3_dead.png' });
const st3 = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return { phase: s.phase, portal: !!s.portal, cleared: s.dungeon.current.cleared };
});
console.log('TRAS MATAR:', JSON.stringify(st3));
console.log('ERRORES:', errs.slice(0,3));
await b.close();
