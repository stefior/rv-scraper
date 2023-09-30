import puppeteer from "puppeteer";

export default async function extractAllSelectorLinks(urls, selector) {
  if (!Array.isArray(urls)) {
    throw console.error("Invalid input: urls should be an array");
  }
  if (typeof selector !== 'string') {
    throw console.error("Invalid input: selector should be a string");
  }

  const browser = await puppeteer.launch({ headless: "new" });
  let allLinks = [];
  let count = 0
  for (let url of urls) {
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
    allLinks.push(...links);
    
    count++
    console.log(`urls completed: ${count} of ${urls.length}`)
    page.close();
  }

  await browser.close();
  return allLinks;
}
