import puppeteer from "puppeteer";
import Bottleneck from "bottleneck";

const MAX_CONCURRENT = 36; // Config
const limiter = new Bottleneck({ maxConcurrent: MAX_CONCURRENT });

/**
 * Extracts links from a given URL based on a specified selector.
 *
 * @param {string} url - The URL to extract links from.
 * @param {string} selector - The selector to use for extracting links.
 * @param {puppeteer.Browser} browser - The puppeteer browser instance.
 * @returns {Promise<string[]>} - A promise that resolves to an array of extracted links.
 */
async function extractLinks(url, selector, browser) {
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { timeout: 0 });

    await page.waitForSelector(selector, { timeout: 0 });
    const links = await page.$$eval(selector, (allAs) => {
      return Array.from(allAs, (a) => a.href);
    });

    process.stdout.write(".");
    await page.close();
    return links;
  } catch (err) {
    console.error(`\n\nError extracting urls for ${url}\n${err}`);
    return [];
  }
}

/**
 * Extracts links from a set of URLs based on specified selectors, using a rate limiter to control concurrency.
 *
 * @param {object} urlsObject - An object where each key is a selector string, and each value is an array of URLs to scrape.
 *
 * @throws Will throw an error if the input `urlsObject` is not an object or is an array.
 *
 * @returns {Promise<string[]>} A promise that resolves to an array of extracted links from all specified URLs and selectors.
 *
 * @example
 *
 * const urlsObject = {
 *   '.class1': ['https://example.com/page1', 'https://example.com/page2'],
 *   '#id1': ['https://example.com/page3']
 * };
 *
 * extractAllSelectorLinks(urlsObject)
 *   .then(links => console.log(links))
 *   .catch(error => console.error(error));
 *
 * // Output: Array of all links extracted from the specified URLs and selectors.
 *
 * @see {@link extractLinks} for details on the extraction process per URL.
 */
export default async function extractAllSelectorLinks(urlsObject) {
  if (typeof urlsObject !== "object" || Array.isArray(urlsObject)) {
    throw new Error("Invalid input: urls should be an object");
  }

  const browser = await puppeteer.launch({ headless: "new" });
  process.stdout.write("Extracting URLs...\n");

  const tasks = [];

  for (const selector in urlsObject) {
    const allLinksForGroup = [...urlsObject[selector]];

    for (const url of allLinksForGroup) {
      const task = limiter.schedule(() => {
        console.log(`Extracting links from ${url}`);
        return extractLinks(url, selector, browser);
      });
      tasks.push(task);
    }
  }

  const allMappedLinks = await Promise.all(tasks);

  console.log("\n");
  await browser.close();

  return allMappedLinks.flat();
}

// Can use Copy All URLs chrome extension to copy the urls of the main pages that have the
// many links you want, then use multi cursor in VS code to easily turn it into an array
// The output can then be copied into or piped into rvDataScraper.js
