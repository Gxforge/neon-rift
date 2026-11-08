import { chromium } from 'playwright';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 960, height: 540 } });
const errs=[]; page.on('pageerror', e => errs.push((e.message||'').slice(0,150)));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);
await page.keyboard.press('Enter');
await page.waitForTimeout(1200);
// matar al jugador
await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  s.prog.hp = 1;
  s.onPlayerDamage(999);
});
await page.waitForTimeout(2200);
await page.screenshot({ path: '/tmp/go1.png' });
const st = await page.evaluate(() => ({ go: window.__game.scene.isActive('GameOver') }));
console.log('GAMEOVER:', JSON.stringify(st));
// reintentar
if (st.go) {
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2000);
  const st2 = await page.evaluate(() => {
    const g = window.__game;
    if (!g.scene.isActive('Game')) return { retry: false };
    const s = g.scene.getScene('Game');
    return { retry: true, floor: s.floor, hp: s.prog.hp, room: s.dungeon?.current?.type };
  });
  console.log('REINTENTO:', JSON.stringify(st2));
}
console.log('errs:', errs.slice(0,2));
await b.close();
