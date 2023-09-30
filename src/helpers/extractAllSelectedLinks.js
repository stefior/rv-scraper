import puppeteer from "puppeteer";

// TODO: add functionality for input array of many urls or array of one
export default async function extractAllSelectorLinks(url, selector) {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto(url);

  await page.waitForSelector(selector);
  const links = await page.$$eval(selector, (allAs) => {
    const arr = [];
    for (a of allAs) {
      arr.push(a.href);
    }
    return arr;
  });

  await browser.close();
  return links;
}
