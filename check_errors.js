import puppeteer from 'puppeteer';

async function run() {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
    const content = await page.content();
    if (content.includes('Something went wrong')) {
      console.log('ERROR BOUNDARY TRIGGERED');
    } else {
      console.log('PAGE LOADED SUCCESSFULLY');
    }
  } catch (e) {
    console.error('Navigation failed:', e.message);
  }
  
  await browser.close();
}

run().catch(console.error);
