import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

import downloadAndConvertToPng from "../helpers/downloadAndConvertToPng.js";
import splitAwningMeasurements from "../helpers/splitAwningMeasurements.js";
import parseTireCode from "../helpers/parseTireCode.js";
import addMissingGvwrUvwCcc from "../helpers/addMissingGvwrUvwCcc.js"

/*
Workflow for if a site has the data in a single table on each page (many RVs/page):
1. use the Table Capture chrome extension
2. copy/paste each table one after another into a single sheets doc
3. clean it up in there with very simple sheets formulas and find & replace
4. convert to JSON with csvjson.com/csv2json (may need to check transpose)
5. use the modules and shortcuts in here to make any other changes necessary
6. use databaseAutoEnter to put the JSON data into the database either way
*/

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

const keyMappings = {
  "Exterior Height": "Height closed ftin",
  "Exterior Length (approx. hitch to back of bumper)": "Length ftin",
  // : "Width inmm",
  "Interior Height": "Interior height in",
  "Full Feature Dry Weight - Lbs.": "Dry weight lbs",
  "Maximum Trailer Weight - Lbs.": "Gvwr lbskgs",
  "Net Carrying Capacity": "CCC",
  "Fresh Water Capacity (approx. gal)": "Total fresh water tank capacity gall",
  "Grey Water Tank (approx. gallons)": "Total gray water tank capacity gall",
  "Black Water Tank (approx. gallons)": "Total black water tank capacity gall",
  // : "Number of propane tanks",
  "LPG Capacity (approx. pounds)": "Total propane tank capacity gallbs",
  // : "Max sleeping count",
  "Water Heater Capacity (approx. gal)": "Water heater tank capacity gl",
  // : "Refrigerator size",
  "Climate Designed Furnace": "Heater",
  // : "Air conditioning",
  "Heavy Duty 5 Lug Axles (lbs)": "Number of axles",
  // : "Number of queen size beds",
  // : "Shower",
  "Good Year Tire Size": "Tire code",
  // : "Number of slideouts",
  // : "Number of awnings",
  // : "Awning length ftm",
};

// For sites that have a single key/value pair on each row (1 RV/page)
// or sites that have the data in multiple such tables
async function rvDataScraper(urls, keyMappings, outputFolder) {
  const browser = await puppeteer.launch({ headless: "new" });

  for (const url of urls) {
    const page = await browser.newPage();

    await page.goto(url);

    await page.waitForSelector("table");
    const extractedData = await page.evaluate(
      (url, keyMappings) => {
        const rows = document.querySelectorAll("tbody tr");
        const keyList = Object.keys(keyMappings);

        const data = {};

        rows.forEach((row) => {
          const keyCell = row.querySelector("td:nth-child(1)");
          const valueCell = row.querySelector("td:nth-child(2)");

          if (keyCell && valueCell) {
            const key = keyCell.textContent.trim();
            const value = valueCell.textContent.trim();

            if (keyList.includes(key)) {
              data[key] = value;
            }
          }
        });

        data["URL"] = url; // Helpful for reference, just in case
        data["Year"] = "2024";
        data["Make"] = "Outdoors RV"; // For new site: hardcode this value

        // For new site: replace selector for model
        // (right click in dev tools on the image and choose 'copy selector')
        const modelElementSelector = "notaselector"; ///////////////////////////////
        const modelElement = document.querySelector(modelElementSelector);
        data["Model"] = modelElement ? modelElement.textContent.trim() : null;

        // For new site: replace trim selector the same way
        const trimElementSelector =
          "body > div.wrapper > div > div > div > div > div > section > div:nth-child(5) > div > div > div > div > div:nth-child(2) > div > h1";
        const trimElement = document.querySelector(trimElementSelector);
        data["Trim"] = trimElement ? trimElement.textContent.trim() : null;

        data["Name"] = `${data.Year} ${data.Make} ${data.Model} ${data.Trim}`;

        // For new site: replace image selector the same way
        // TODO: have it automatically find the image by searching the html for image files that have the
        // trim in the title, since that
        const imageElementSelector =
          "body > div.wrapper > div > div > div > div > div > section > div:nth-child(4) > div > div:nth-child(2) > div > div > div.wpb_single_image.wpb_content_element.vc_align_center > div > a > div > img";
        const imageElement = document.querySelector(imageElementSelector);
        const urlTail = url
          .split("/")
          .filter((section) => section != "")
          .slice(-1)[0];
        if (imageElement) {
          data["imageURL"] = imageElement.src;
          data["Floor plan"] = `${urlTail}`;
        } else {
          data["imageURL"] = null;
        }

        const renamedData = Object.keys(data).reduce((acc, key) => {
          const newKey = keyMappings[key] || key;
          acc[newKey] = data[key];
          return acc;
        }, {});

        return renamedData;
      },
      url,
      keyMappings
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

    if ("Tire code" in extractedData) {
      const tireData = parseTireCode(extractedData["Tire code"]);
      extractedData["Rear tire diameter in"] = tireData.tireDiameterIn;
      // wheel width and wheel diameter are different, but diameter is likely what was meant
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

  await browser.close();
}
