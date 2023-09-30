import puppeteer from "puppeteer";

export default async function extractAllSelectorLinks(urls, selector) {
  if (!Array.isArray(urls)) {
    throw new Error("Invalid input: urls should be an array");
  }
  if (typeof selector !== "string") {
    throw new Error("Invalid input: selector should be a string");
  }

  const browser = await puppeteer.launch({ headless: "new" });
  const allLinks = [...urls];

  process.stdout.write("Extracting URLs...");
  const allMappedLinks = await Promise.all(
    allLinks.map((url) => {
      return (async () => {
        try {
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

  console.log("\n");
  browser.close();
  return allMappedLinks.flat();
}

// TODO: get this to work with multiple sites, which would be easy, since it could just take an
// object or an array, then if it's an object it just uses the key for each object as the
// selector with the property being the array of urls for that selector

// Can use Copy All URLs (free) chrome extension for getting the main pages that
// you want the links from, then use multicursor in VS code to easily turn it into an array
// e.g. Ctrl + Alt + Up/Down, then home/end to add the quotes and commas
const urls = [
  "https://www.granddesignrv.com/travel-trailers/reflection",
  "https://www.granddesignrv.com/travel-trailers/imagine",
  "https://www.granddesignrv.com/travel-trailers/imagine-xls",
  "https://www.granddesignrv.com/travel-trailers/imagine-aim",
  "https://www.granddesignrv.com/travel-trailers/transcend-xplor",
  "https://www.granddesignrv.com/fifth-wheels/solitude",
  "https://www.granddesignrv.com/fifth-wheels/reflection",
  "https://www.granddesignrv.com/fifth-wheels/reflection-150-series",
];
// Remember, this is the selector that applies to all of the links, not just one,
// so after copying the selector in dev tools the extra first part needs to be deleted
const selector = "div.specCell.button-specCell-desktop > a";

const result = await extractAllSelectorLinks(urls, selector);
console.log(result);
