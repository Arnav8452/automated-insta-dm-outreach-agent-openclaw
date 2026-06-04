import puppeteer from 'puppeteer';
async function test() {
    console.log("Launching...");
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    console.log("Navigating to xarnav...");
    await page.goto("https://www.instagram.com/_xarnav/", { waitUntil: 'networkidle2' });
    console.log("Navigation finished!");
    await browser.close();
}
test();
