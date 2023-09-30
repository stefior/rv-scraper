import puppeteer from "puppeteer";

// TODO: add rate limiter
export default async function extractAllSelectorLinks(urlsObject) {
  if (typeof urlsObject !== "object" || Array.isArray(urlsObject)) {
    throw new Error("Invalid input: urls should be an object");
  }

  const browser = await puppeteer.launch({ headless: "new" });
  process.stdout.write("Extracting URLs...");

  const allMappedLinks = [];
  for (const selector in urlsObject) {
    const allLinksForGroup = [...urlsObject[selector]];

    const allMappedLinksForGroup = await Promise.all(
      allLinksForGroup.map((url) => {
        return (async () => {
          try {
            const page = await browser.newPage();
            await page.goto(url);

            await page.waitForSelector(selector);
            const links = await page.$$eval(selector, (allAs) => {
              const arr = [];
              for (const a of allAs) {
                arr.push(a.href);
              }
              return arr;
            });

            process.stdout.write(".");
            await page.close();
            return links;
          } catch (err) {
            console.error(`Error extracting urls for ${url}\n${err}`);
            return [];
          }
        })();
      })
    );
    allMappedLinks.push(...allMappedLinksForGroup.flat());
  }

  console.log("\n");
  await browser.close();
  return allMappedLinks.flat();
}

// Can use Copy All URLs (free) chrome extension for getting the main pages that
// you want the links from, then use multi cursor in VS code to easily turn it into an array
// e.g. Ctrl + Alt + Up/Down, then home/end to add the quotes and commas
const urls = {
  "div.specCell.button-specCell-desktop > a": [
    "https://www.granddesignrv.com/travel-trailers/reflection",
    "https://www.granddesignrv.com/travel-trailers/imagine",
    "https://www.granddesignrv.com/travel-trailers/imagine-xls",
    "https://www.granddesignrv.com/travel-trailers/imagine-aim",
    "https://www.granddesignrv.com/travel-trailers/transcend-xplor",
    "https://www.granddesignrv.com/fifth-wheels/solitude",
    "https://www.granddesignrv.com/fifth-wheels/reflection",
    "https://www.granddesignrv.com/fifth-wheels/reflection-150-series",
  ],
  "div.ls-layers > div > div > a": [
    "https://www.outdoorsrvmfg.com/back-country-class/",
    "https://www.outdoorsrvmfg.com/blackstone-2/",
    "https://www.outdoorsrvmfg.com/creek-side/",
    "https://www.outdoorsrvmfg.com/timber-ridge/",
  ],
};
// Remember, this is the selector that applies to all of the links, not just one,
// so after copying the selector in dev tools the extra first part needs to be deleted

const result = await extractAllSelectorLinks(urls);
console.log(result);
