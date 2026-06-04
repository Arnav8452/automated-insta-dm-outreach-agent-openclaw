import puppeteer from 'puppeteer';
async function test() {
    console.log("Launching...");
    const browser = await puppeteer.launch({ headless: false });
    console.log("Launched!");
    await browser.close();
    console.log("Closed!");
}
test();
