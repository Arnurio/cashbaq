// Captures store screenshots from running Expo web app at localhost:3000.
// Pre-flight: ensure preview server is running on port 3000.
//
// Output: assets/screenshots/*.png at 1290×2796 (iPhone 6.7" Pro Max).

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const OUT = path.join(__dirname, '..', 'assets', 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

const W = 1290, H = 2796, DPR = 3;
const VIEWPORT = { width: Math.round(W / DPR), height: Math.round(H / DPR), deviceScaleFactor: DPR, isMobile: true, hasTouch: true };

async function clickByText(page, text) {
  await page.evaluate((t) => {
    // Try role="tab" first (for RN tabbar)
    let el = Array.from(document.querySelectorAll('[role="tab"]'))
      .find(e => e.textContent && e.textContent.includes(t));
    // Fallback: any element
    if (!el) el = Array.from(document.querySelectorAll('div,span,a,button'))
      .find(e => e.textContent && e.textContent.trim() === t);

    if (el) {
      // Synthesize realistic event sequence
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const opts = { bubbles: true, cancelable: true, clientX: x, clientY: y };
      el.dispatchEvent(new MouseEvent('mousedown', opts));
      el.dispatchEvent(new MouseEvent('mouseup', opts));
      el.dispatchEvent(new MouseEvent('click', opts));
    }
  }, text);
  await new Promise(r => setTimeout(r, 2000));
}

async function setupCards(page) {
  await page.evaluate(() => {
    localStorage.setItem('cashbaq_onboarded', 'true');
    const cards = [
      { id: 'd1', bankId: 'halyk', name: 'Halyk Bonus', useNfc: false, selectedCategories: [] },
      { id: 'd2', bankId: 'forte', name: 'ForteBlack',  useNfc: false, selectedCategories: ['grocery','restaurants','fuel'] },
      { id: 'd3', bankId: 'jusan', name: 'Alatau Card', useNfc: false, selectedCategories: [] },
      { id: 'd4', bankId: 'kaspi', name: 'Kaspi Gold',  useNfc: false, selectedCategories: [] },
    ];
    localStorage.setItem('cashbaq_cards', JSON.stringify(cards));
  });
}

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // 1) Onboarding (no localStorage)
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(OUT, '05-onboarding.png') });
  console.log('✓ 05-onboarding.png');

  // Setup cards for the rest
  await setupCards(page);
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 2000));

  // 2) Home
  await page.screenshot({ path: path.join(OUT, '01-home.png') });
  console.log('✓ 01-home.png');

  // 3) Find — click "Чем платить?" CTA
  await clickByText(page, 'Чем платить?');
  await new Promise(r => setTimeout(r, 1500));
  // Click a category to show result
  await page.evaluate(() => {
    const cats = Array.from(document.querySelectorAll('div'))
      .filter(e => e.textContent && /Продукты$/.test(e.textContent.trim()));
    if (cats[0]) cats[0].click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(OUT, '03-find.png') });
  console.log('✓ 03-find.png');

  // Back to home
  await page.goto(BASE, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));

  // 4) Cards tab — click "Карты" in tabbar
  await clickByText(page, 'Карты');
  await page.screenshot({ path: path.join(OUT, '02-cards.png') });
  console.log('✓ 02-cards.png');

  // 5) Tips tab — click "Советы"
  await clickByText(page, 'Советы');
  await page.screenshot({ path: path.join(OUT, '04-tips.png') });
  console.log('✓ 04-tips.png');

  await browser.close();
  console.log('\nDone:', OUT);
})().catch(e => { console.error(e); process.exit(1); });
