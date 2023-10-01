import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import readline from "readline";

import {
  downloadAndConvertToPng,
  splitAwningMeasurements,
  parseTireCode,
  addMissingGvwrUvwCcc,
  getRvTypeFromUrl,
  setupAndSaveSiteSelectors,
} from "../helpers/";

function promptUser(unrecognizedKey) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    function ask() {
      rl.question(
        `Unrecognized key: '${unrecognizedKey}'\nPlease enter the standard key name: `,
        (userInput) => {
          const standardKeyName = userInput.trim();
          if (Object.keys(synonymDictionary).includes(standardKeyName)) {
            console.log(
              `Mapping confirmed ('${unrecognizedKey}' -> '${standardKeyName}')`
            );
            rl.close();
            resolve(standardKeyName);
          } else {
            console.log("Standard key name invalid. Try again:\n");
            ask();
          }
        }
      );
    }

    ask();
  });
}

function getUrlTail(url) {
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname
    .split("/")
    .filter((segment) => segment !== "");
  const urlTail = pathSegments.slice(-1)[0];
  return urlTail;
}

// NOTE TO SELF: The purpose of this function isn't 100% automation, but for partial automation where the user is prompted from the console for all cases where it isn't sure. The user ideally shouldn't need to edit the JSON, but they will definitely sometimes need to provide input, at least for the first time per domain.
/**
 * Asynchronously scrapes RV data from a list of URLs.
 * @async
 * @param {Object} options - Configuration object for the scraper.
 * @param {string[]} options.urls - Array of URLs to scrape.
 * @param {number} options.rvYear - The model year of the RVs to be scraped.
 * @param {Object} options.knownDomainMappings - An object containing known mappings of domain-specific keys to standardized keys.
 * @param {Object} options.synonymDictionary - An object containing synonyms for various RV-related terms.
 * @param {string} [options.outputFolder="./output"] - The folder where scraped data should be saved.
 * @throws Will throw an error if any issues occur while launching the browser, navigating to the URLs, or interacting with the pages.
 * @returns {Promise<void>} Completes when all URLs have been scraped and the data has been saved.
 */
async function rvDataScraper({
  urls,
  rvYear,
  knownDomainMappings,
  synonymDictionary,
  outputFolder = "./output",
}) {
  const browser = await puppeteer.launch({ headless: "new" });

  for (const url of urls) {
    const page = await browser.newPage();
    await page.goto(url);

    await page.waitForSelector("table");
    const extractedData = await page.evaluate(
      (url, knownDomainMappings) => {
        (async () => {
          const hostName = window.location.hostname
            .toLowerCase()
            .split(".")
            .reverse()[1];
          const [
            Make,
            typeSelector,
            modelSelector,
            trimSelector,
            imageSelector,
            descriptionSelector,
          ] = await setupAndSaveSiteSelectors(knownDomainMappings);
          const urlTail = getUrlTail(url); // not including url parameters or fragments
          const knownKeyMappings =
            knownDomainMappings[hostName].knownKeyMappings;

          const rows = document.querySelectorAll("tbody tr");

          const data = {};
          // To store keys in the final object for what things may need to be manually verified or edited (e.g. with find and replace on part of the string)
          data.verifyManually = [];

          rows.forEach((row) => {
            const keyCell = row.querySelector("td:nth-child(1)");
            const valueCell = row.querySelector("td:nth-child(2)");

            if (keyCell && valueCell) {
              const key = keyCell.textContent.trim();
              const value = valueCell.textContent.trim();

              // Grab it all now, then just use what's useful later
              data[key] = value;
            }
          });

          function queryAndTrim(selector) {
            const element = document.querySelector(selector);
            return element ? element.textContent.trim() : null;
          }

          data.URL = url;
          data.Year = rvYear;
          data.Make = Make;
          data["Web Description"] = descriptionSelector
            ? queryAndTrim(descriptionSelector)
            : null;
          data.Type = typeSelector
            ? queryAndTrim(typeSelector)
            : getRvTypeFromUrl(url);
          data.Model = modelSelector ? queryAndTrim(modelSelector) : null;
          data.Trim = trimSelector ? queryAndTrim(trimSelector) : urlTail;
          data.Name = `${data.Year} ${data.Make} ${data.Model} ${data.Trim}`;
          data.imageURL = imageSelector
            ? document.querySelector(imageSelector).src
            : null;
          data["Floor plan"] = urlTail;

          // Rename each of the keys in the extracted data to correspond with the database keys
          for (currentKey in Object.keys(data)) {
            data[currentKey] = formatValue(data[currentKey]);
            if (currentKey in knownKeyMappings) {
              // Change the key name in the extracted data to the one for the database
              const newKeyName = knownKeyMappings[currentKey];
              data[newKeyName] = data.currentKey;
              delete data.currentKey;
            } else {
              // Ask user what *standardized key* the key from the site is referring to
              const newKeyName = promptUser(currentKey, synonymDictionary);
              // Map the key name from the site to the one for the database
              knownKeyMappings[currentKey] = newKeyName;
              // Change the key name in the extracted data to the one for the database
              data[newKeyName] = data.currentKey;
              delete data.currentKey;
            }
          }

          for (key in data) {
            if (data.key === null) {
              data.verifyManually.push(`${key}`);
            }
          }

          if (data) return data;
          throw new Error("Issue with returning the extracted data");
        })();
      },
      url,
      knownDomainMappings,
      synonymDictionary
    );

    await downloadAndConvertToPng(
      extractedData.imageURL,
      extractedData["Floor plan"],
      "/images"
    ).catch((err) => {
      throw err;
    });

    if ("Awning length ftm" in extractedData) {
      extractedData["Awning length ftm"] = splitAwningMeasurements(
        extractedData["Awning length ftm"]
      );
    }

    addMissingGvwrUvwCcc(extractedData);

    if ("Tires" in extractedData) {
      const tireData = parseTireCode(extractedData["Tires"]);
      extractedData["Rear tire diameter in"] = tireData.tireDiameterIn;
      // Wheel width and wheel diameter are different, but diameter is likely what was meant
      extractedData["Rear wheel width in"] = tireData.wheelDiameterIn;
    }

    // Add the next data object to the file
    if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);
    const outputFile = path.join(
      outputFolder,
      extractedData.Make.toLowerCase().replace(/\s+/g, "-") + ".json"
    );
    let index = urls.indexOf(url);
    if (index === 0) {
      fs.appendFileSync(outputFile, "[");
    }
    fs.appendFileSync(outputFile, JSON.stringify(extractedData, null, 4));
    if (index === urls.length - 1) {
      fs.appendFileSync(outputFile, "]");
    } else {
      fs.appendFileSync(outputFile, ",");
    }

    console.log(
      `Scraped and saved data for ${urls.indexOf(url) + 1} of ${urls.length}`
    );

    await page.close();
  }

  fs.writeFileSync(
    "known-domain-mappings.json",
    JSON.stringify(knownDomainMappings, null, 2)
  );
  await browser.close();
}

// it should only match the words in the value array, not try to match the main key
const synonymDictionary = {
  "Dry weight lbs": ["dry weight", "UVW", "unloaded vehicle weight"],
  "Gvwr lbskgs": [
    "Maximum Trailer Weight",
    "gvwr",
    "max trailer weight",
    "gross vehicle weight rating",
    "gross weight",
  ],
};

const urls = [
  "https://www.outdoorsrvmfg.com/back-country-series-20bd/",
  "https://www.outdoorsrvmfg.com/back-country-series-21rws/",
  "https://www.outdoorsrvmfg.com/back-country-series-23bcs/",
  "https://www.outdoorsrvmfg.com/back-country-series-24krs/",
  "https://www.outdoorsrvmfg.com/back-country-series-28dbs/",
  "https://www.outdoorsrvmfg.com/black-stone-250rds/",
  "https://www.outdoorsrvmfg.com/black-stone-250rks/",
  "https://www.outdoorsrvmfg.com/black-stone-260kvs/",
  "https://www.outdoorsrvmfg.com/black-stone-280kvs/",
  "https://www.outdoorsrvmfg.com/black-stone-280rksb/",
  "https://www.outdoorsrvmfg.com/creek-side-19mks/",
  "https://www.outdoorsrvmfg.com/creek-side/creek-side-21rbs/",
  "https://www.outdoorsrvmfg.com/creek-side/creek-side-21kvs/",
  "https://www.outdoorsrvmfg.com/timber-ridge-22fqs/",
  "https://www.outdoorsrvmfg.com/timber-ridge-23dbs/",
  "https://www.outdoorsrvmfg.com/timber-ridge-24bks/",
  "https://www.outdoorsrvmfg.com/timber-ridge-24rls/",
  "https://www.outdoorsrvmfg.com/timber-ridge-24rks/",
  "https://www.outdoorsrvmfg.com/timber-ridge-25rds/",
  "https://www.outdoorsrvmfg.com/timber-ridge-26kvs/",
  "https://www.outdoorsrvmfg.com/timber-ridge-28bks/",
];

const knownDomainMappings = JSON.parse(
  fs.readFileSync("./known-domain-mappings.json", "utf-8")
);
rvDataScraper({
  urls,
  knownDomainMappings,
  synonymDictionary,
});
