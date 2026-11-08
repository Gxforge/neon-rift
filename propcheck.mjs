import { chromium } from 'playwright';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 960, height: 540 } });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1400);
await page.keyboard.press('Enter');
await page.waitForTimeout(1200);
const r = await page.evaluate(() => {
  const s = window.__game.scene.getScene('Game');
  return { props: s.room.props, textures: s.textures.list.tileset ? s.textures.list.tileset.getFrameNames().length : -1 };
});
console.log(JSON.stringify(r, null, 1).slice(0,700));
await page.screenshot({ path: '/tmp/props.png' });
await b.close();
