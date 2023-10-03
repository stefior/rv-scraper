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
} from "../helpers/index.js";

/**
 * Validates the input parameters for the rvDataScraper function.
 *
 * @param {Object} params - The input parameters object.
 * @param {number} params.rvYear - The RV year, expected to be a four-digit number.
 * @param {Array} params.urls - The URLs array, expected to be non-empty.
 * @param {Object} params.knownDomainMappings - The known domain mappings object, expected to be non-empty.
 * @param {string} params.outputFolder - The output folder path, expected to be a non-empty string.
 * @returns {boolean} Returns true if all parameters are valid, otherwise false.
 */
function validateParameters({
  rvYear,
  urls,
  knownDomainMappings,
  outputFolder,
}) {
  if (isNaN(rvYear) || String(rvYear).length !== 4) {
    console.error("rvYear parameter must be a valid year number");
    return false;
  }

  if (!Array.isArray(urls) || urls.length < 1) {
    console.error("urls parameter must be an array with items");
    return false;
  }

  if (
    typeof knownDomainMappings !== "object" ||
    Object.keys(knownDomainMappings).length === 0
  ) {
    console.error("knownDomainMappings parameter must be a non-empty object");
    return false;
  }

  if (typeof outputFolder !== "string" || outputFolder.length === 0) {
    console.error("outputFolder parameter must be a non-empty string");
    return false;
  }

  return true;
}

/**
 * Extracts the second level domain from a given URL.
 *
 * @param {string} url - The URL from which to extract the second level domain.
 * @returns {string} - Returns the second level domain or the full hostname if SLD can't be determined.
 */
function getSecondLevelDomain(url) {
  const hostname = new URL(url).hostname;
  const parts = hostname.split(".").reverse();
  if (parts.length >= 2) {
    return parts[1];
  }
  return hostname; // Returns the full hostname if SLD can't be determined
}

/**
 * Prompts the user to provide a standard key name for an unrecognized key,
 * using a recursive approach to re-prompt the user until a valid standard key name is provided.
 *
 * @param {string} unrecognizedKey - The unrecognized key for which a standard key name is needed.
 * @param {Object} synonymDictionary - An object where each key is a term used in the data source, and the corresponding value is the standardized term used in the database.
 * @returns {Promise<string>} - A promise that resolves to the standard key name provided by the user.
 */
function promptForKeyMapping(unrecognizedKey, synonymDictionary) {
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

/**
 * Extracts data from a webpage based on specified site mappings using Puppeteer's page object.
 * The function navigates through the table rows in the webpage and extracts text content from specified elements,
 * as well as extracts additional information based on the provided site mappings.
 *
 * @async
 * @param {Object} page - The Puppeteer page object representing the webpage.
 * @param {Array} siteMappings - An array containing mappings to specific elements on the webpage.
 * The array should contain the following elements in order:
 *   - Make: A string representing the Make of the RV.
 *   - typeSelector: A string containing the CSS selector for the Type element.
 *   - modelSelector: A string containing the CSS selector for the Model element.
 *   - trimSelector: A string containing the CSS selector for the Trim element.
 *   - imageSelector: A string containing the CSS selector for the image element.
 *   - descriptionSelector: A string containing the CSS selector for the Description element.
 *   - webFeaturesSelector: A string containing the CSS selector for the Web Features element.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the extracted data.
 * The object contains keys based on the text content of the first cell in each row of the table,
 * as well as additional keys: Web Features, Web Description, Make, Type, Model, Trim, and imageUrl
 * based on the site mappings provided.
 */
async function extractData(page, siteMappings) {
  return page.evaluate((siteMappings) => {
    const {
      Make,
      typeSelector,
      modelSelector,
      trimSelector,
      imageSelector,
      descriptionSelector,
      webFeaturesSelector,
    } = siteMappings;
    const rows = document.querySelectorAll("tbody tr");

    const data = {};

    rows.forEach((row) => {
      const keyCell = row.querySelector("td:nth-child(1)");
      const valueCell = row.querySelector("td:nth-child(2)");

      if (keyCell && valueCell) {
        const key = keyCell.textContent.trim();
        const value = valueCell.textContent.trim();

        data[key] = value; // Grab it all now, then just use what's useful later
      }
    });

    function queryAndTrim(selector) {
      const element = document.querySelector(selector);
      return element ? element.textContent.trim() : null;
    }

    data["Web Features"] = queryAndTrim(webFeaturesSelector);
    data["Web Description"] = queryAndTrim(descriptionSelector);
    data.Make = Make;
    data.Type = queryAndTrim(typeSelector);
    data.Model = queryAndTrim(modelSelector);
    data.Trim = queryAndTrim(trimSelector);
    data.imageUrl = imageSelector
      ? document.querySelector(imageSelector).src
      : null;

    return data;
  }, siteMappings);
}

/**
 * Renames the keys of the extracted data object based on a mapping of known keys.
 * If a key is not recognized, prompts the user to provide a standardized key name,
 * and updates the known key mappings for future reference.
 *
 * @param {Object} extractedData - The data object with keys as they were extracted from the site.
 * @param {Object} synonymDictionary - An object where each key is a term used in the data source, and the corresponding value is the standardized term used in the database.
 * @param {string} secondLevelDomain - The second level domain name for the site in which to set up or retrieve site selectors.
 * @returns {Object} renamedData - A new object with keys renamed to match the standardized database keys.
 * Any unrecognized keys will trigger a prompt for user input to provide a standardized key name,
 * which is then saved to the known key mappings for the current domain.
 *
 * @example
 * // Suppose knownKeyMappings = { "Brand": "Make" }, and extractedData = { "Brand": "Ford" }
 * const renamedData = renameData(extractedData);
 * console.log(renamedData); // Output: { "Make": "Ford" }
 */
function renameData(extractedData, synonymDictionary, secondLevelDomain) {
  const knownKeyMappings =
    knownDomainMappings[secondLevelDomain].knownKeyMappings;
  const renamedData = {};

  for (const currentKey of Object.keys(extractedData)) {
    if (currentKey in knownKeyMappings) {
      // Change the key name in the extracted data to the one for the database
      const newKeyName = knownKeyMappings[currentKey];
      renamedData[newKeyName] = extractedData[currentKey];
    } else {
      // Ask user what *standardized key* the key from the site is referring to
      const newKeyName = promptForKeyMapping(currentKey, synonymDictionary);
      // Map the key name from the site to the one for the database
      knownKeyMappings[currentKey] = newKeyName;
      // Change the key name in the extracted data to the one for the database
      renamedData[newKeyName] = extractedData[currentKey];
    }
  }
  return renamedData;
}

/**
 * Transforms the extracted data by adding additional fields, modifying existing fields, and
 * performing various data transformations. This function is primarily used to shape the data
 * into a structure that is consistent with the desired database schema.
 *
 * @param {Object} extractedData - The original data object extracted from the web page.
 * @param {number|string} rvYear - The RV year to be assigned to the data object.
 * @param {string} lastUrlSegment - The last segment of the URL, used for some field assignments.
 * @param {string} url - The URL from where the data was extracted.
 * @returns {void} - The function modifies the `extractedData` object in-place.
 *
 * @example
 * const extractedData = { Make: "Ford", Model: "Explorer" };
 * const rvYear = 2023;
 * const lastUrlSegment = "floor-plan";
 * const url = "https://example.com/rv/floor-plan";
 * transformData(extractedData, rvYear, lastUrlSegment, url);
 * // extractedData is now modified with additional fields like Year, url, "Floor plan", etc.
 */
function transformData(extractedData, rvYear, lastUrlSegment, url) {
  extractedData.verifyManually = []; // For indicating fields to double-check
  extractedData.url = url;
  extractedData.Year = rvYear;
  extractedData["Floor plan"] = lastUrlSegment;
  if (!extractedData.Type) extractedData.Type = getRvTypeFromUrl(url);
  if (!extractedData.Trim) {
    extractedData.Trim = lastUrlSegment;
    extractedData.verifyManually.push("Trim");
  }
  extractedData.Name = `${extractedData.Year} ${extractedData.Make} ${extractedData.Model} ${extractedData.Trim}`;

  if ("Awning length ftm" in extractedData) {
    extractedData["Awning length ftm"] = splitAwningMeasurements(
      extractedData["Awning length ftm"]
    );
  }

  addMissingGvwrUvwCcc(extractedData);

  if ("Tire Code" in extractedData) {
    const tireData = parseTireCode(extractedData["Tire Code"]);
    extractedData["Rear tire diameter in"] = tireData.tireDiameterIn;
    // Wheel width and wheel diameter are different, but diameter is likely what was meant
    extractedData["Rear wheel width in"] = tireData.wheelDiameterIn;
  }

  Object.keys(extractedData).forEach((key) => {
    if (extractedData[key] === null || extractedData[key] === undefined) {
      extractedData.verifyManually.push(`${key}`);
    }
  });
}

/**
 * Handles the downloading and conversion of an image to PNG format. This function attempts to
 * download and convert the image to png.
 *
 * @async
 * @param {string} outputFolder - The path to the folder where images should be saved.
 * @param {Object} extractedData - The data object containing the imageUrl and Floor plan details.
 * @throws Will throw an error if it fails to download or convert the image.
 *
 * @example
 * const outputFolder = "./output/images";
 * const extractedData = { imageUrl: "https://example.com/image.jpg", "Floor plan": "150BD", etc. };
 * await handleImageDownload(outputFolder, extractedData);
 * // The image is now downloaded, converted to PNG, and saved in the specified folder.
 */
async function handleImageDownload(outputFolder, extractedData) {
  await downloadAndConvertToPng(
    extractedData.imageUrl,
    extractedData["Floor plan"],
    outputFolder
  ).catch((err) => {
    throw new Error(`Error downloading image: ${err}`);
  });
}

/**
 * Appends the extracted data to a JSON file. This function ensures that the output folder exists,
 * determines the output file path based on the Make of the RV, and appends the extracted data to
 * the file in a JSON array format. Each data object is appended as a new element in the array.
 *
 * @param {string} outputFolder - The path to the folder where the data should be saved.
 * @param {Object} extractedData - The data object to be appended to the file.
 * @param {number} urlIndex - The index of the current URL being processed, used to determine if
 *                             this is the first or last entry in the JSON array.
 * @param {number} totalUrls - The total number of URLs being processed, used to determine if this
 *                             is the last entry in the JSON array.
 * @throws Will throw an error if it fails to append data to the file.
 *
 * @example
 * const outputFolder = "./output";
 * const extractedData = { Make: "Ford", Model: "Explorer" };
 * const urlIndex = 0;
 * const totalUrls = 10;
 * appendData(outputFolder, extractedData, urlIndex, totalUrls);
 * // The extractedData object is now appended to the specified file in the output folder.
 */
function appendDataToFile(outputFolder, extractedData, urlIndex, totalUrls) {
  // Ensure output folder exists
  if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

  // Determine the output file path
  const outputFile = path.join(
    outputFolder,
    extractedData.Make.toLowerCase().replace(/\s+/g, "-") + ".json"
  );

  // Append opening bracket for the first URL
  if (urlIndex === 0) {
    fs.appendFileSync(outputFile, "[");
  }

  try {
    // Append the data object
    fs.appendFileSync(outputFile, JSON.stringify(extractedData, null, 4));

    // Append closing bracket for the last URL or a comma for others
    if (urlIndex === totalUrls - 1) {
      fs.appendFileSync(outputFile, "]");
    } else {
      fs.appendFileSync(outputFile, ",");
    }
  } catch (err) {
    throw new Error(
      `Failed to append data to file for "${extractedData.Name}"`
    );
  }
}

/**
 * Saves the domain mappings to a JSON file. This function attempts to write the `knownDomainMappings`
 * object to a file named `known-domain-mappings.json`. If the write operation fails, an error is thrown.
 *
 * @param {Object} knownDomainMappings - The object containing domain mappings to be saved.
 * @throws Will throw an error if it fails to write the domain mappings to the file.
 *
 * @example
 * const knownDomainMappings = { "example.com": { Make: "make-selector", Model: "model-selector" } };
 * saveDomainMappings(knownDomainMappings);
 * // The known domain mappings are now saved to a file named `known-domain-mappings.json`.
 */
function saveDomainMappings(knownDomainMappings) {
  try {
    fs.writeFileSync(
      "known-domain-mappings.json",
      JSON.stringify(knownDomainMappings, null, 2)
    );
  } catch (err) {
    throw new Error(
      `Failed to write new known domain mappings to file: ${err.message}`
    );
  }
}

/**
 * This function automates the data scraping process for RV data across multiple URLs,
 * while also allowing for user input in cases where data mappings are uncertain.
 * The function manages the entire workflow from launching a browser, navigating to URLs,
 * extracting and transforming data, to saving the data and user-defined mappings to files.
 *
 * @async
 * @function
 * @export
 * @param {Object} params - The input parameters for the data scraper.
 * @param {number} params.rvYear - The model year of the RVs to be scraped.
 * @param {Array<string>} params.urls - An array of URLs to scrape data from.
 * @param {Object} params.knownDomainMappings - An object containing known domain mappings which help in data extraction.
 * @param {Object} params.synonymDictionary - An object where each key is a term used in the data source, and the corresponding value is the standardized term used in the database.
 * @param {string} [params.outputFolder="./output"] - The directory where the scraped data will be saved.
 *
 * @returns {Promise<void>} A Promise that resolves when the function has completed its execution.
 *
 * @throws Will throw an error if writing to the file system fails.
 *
 * @example
 * await rvDataScraper({
 *   rvYear: 2023,
 *   urls: ['https://example.com/rv1', 'https://example.com/rv2'],
 *   knownDomainMappings: {...},
 *   outputFolder: './data'
 * });
 */
export default async function rvDataScraper({
  rvYear,
  urls,
  knownDomainMappings,
  synonymDictionary,
  outputFolder = "./output",
}) {
  if (!validateParameters({ rvYear, urls, knownDomainMappings, outputFolder }))
    return;
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  let urlIndex = 0;
  const failedNavigations = [];
  const imagesOutputFolder = path.join(outputFolder, "images");
  for (const url of urls) {
    try {
      await page.goto(url);
    } catch (err) {
      console.error(`Failed to navigate to ${url}: ${err}`);
      failedNavigations.push(url);
      continue; // Continue with the next URL if navigation fails
    }
    await page.waitForSelector("table");
    const secondLevelDomain = getSecondLevelDomain(url);
    const siteMappings = await setupAndSaveSiteSelectors(
      knownDomainMappings,
      secondLevelDomain
    );

    const extractedData = await extractData(page, siteMappings);

    // Rename each of the keys in the extracted data to correspond with the database keys
    const renamedData = renameData(
      extractedData,
      synonymDictionary,
      secondLevelDomain
    );

    const transformedData = transformData(
      renamedData,
      rvYear,
      getLastUrlSegment(url),
      url
    );

    await handleImageDownload(imagesOutputFolder, transformedData);

    appendDataToFile(outputFolder, transformedData, urlIndex, urls.length);

    console.log(`Scraped and saved data for ${urlIndex + 1} of ${urls.length}`);
    urlIndex++;
  }
  if (failedNavigations.length > 0) {
    console.log("All failed navigations:", failedNavigations);
  }

  saveDomainMappings(knownDomainMappings);
  await browser.close();
}

const urls = [
  "https://www.keystonerv.com/product/bullet/comfort-travel-trailers/floorplans/211BHSWE",
  "https://www.keystonerv.com/product/bullet/comfort-travel-trailers/floorplans/221RBS",
  "https://www.keystonerv.com/product/bullet/comfort-travel-trailers/floorplans/243BHSWE",
  "https://www.keystonerv.com/product/bullet/comfort-travel-trailers/floorplans/250BHS",
  "https://www.keystonerv.com/product/bullet/comfort-travel-trailers/floorplans/250BHSWE",
  "https://www.keystonerv.com/product/bullet/comfort-travel-trailers/floorplans/253RBSWE",
  "https://www.keystonerv.com/product/bullet/comfort-travel-trailers/floorplans/253RDS",
  "https://www.keystonerv.com/product/bullet/comfort-travel-trailers/floorplans/253RDSWE",
  "https://www.keystonerv.com/product/bullet/comfort-travel-trailers/floorplans/258RKS",
  "https://www.keystonerv.com/product/bullet/comfort-travel-trailers/floorplans/258RKSWE",
  "https://www.keystonerv.com/product/bullet/comfort-travel-trailers/floorplans/260RBS",
  "https://www.keystonerv.com/product/bullet/comfort-travel-trailers/floorplans/260RBSWE",
  "https://www.keystonerv.com/product/bullet-crossfire/comfort-travel-trailers/floorplans/1800RB",
  "https://www.keystonerv.com/product/bullet-crossfire/comfort-travel-trailers/floorplans/1850RB",
  "https://www.keystonerv.com/product/bullet-crossfire/comfort-travel-trailers/floorplans/1890RB",
  "https://www.keystonerv.com/product/bullet-crossfire/comfort-travel-trailers/floorplans/1890RBWE",
  "https://www.keystonerv.com/product/bullet-crossfire/comfort-travel-trailers/floorplans/2200BH",
  "https://www.keystonerv.com/product/bullet-crossfire/comfort-travel-trailers/floorplans/2200BHWE",
  "https://www.keystonerv.com/product/bullet-crossfire/comfort-travel-trailers/floorplans/2210BH",
  "https://www.keystonerv.com/product/bullet-crossfire/comfort-travel-trailers/floorplans/2210BHWE",
  "https://www.keystonerv.com/product/bullet-crossfire/comfort-travel-trailers/floorplans/2220ML",
  "https://www.keystonerv.com/product/bullet-crossfire/comfort-travel-trailers/floorplans/2220MLWE",
  "https://www.keystonerv.com/product/bullet-crossfire/comfort-travel-trailers/floorplans/2290BH",
  "https://www.keystonerv.com/product/bullet-crossfire/comfort-travel-trailers/floorplans/2290BHWE",
  "https://www.keystonerv.com/product/hideout/comfort-travel-trailers/floorplans/174RK",
  "https://www.keystonerv.com/product/hideout/comfort-travel-trailers/floorplans/200RLWE",
  "https://www.keystonerv.com/product/hideout/comfort-travel-trailers/floorplans/20RDN",
  "https://www.keystonerv.com/product/hideout/comfort-travel-trailers/floorplans/20RDNWE",
  "https://www.keystonerv.com/product/hideout/comfort-travel-trailers/floorplans/21BHNWE",
  "https://www.keystonerv.com/product/hideout/comfort-travel-trailers/floorplans/22MLS",
  "https://www.keystonerv.com/product/hideout/comfort-travel-trailers/floorplans/22MLSWE",
  "https://www.keystonerv.com/product/hideout/comfort-travel-trailers/floorplans/240BHWE",
  "https://www.keystonerv.com/product/hideout/comfort-travel-trailers/floorplans/24BHSWE",
  "https://www.keystonerv.com/product/hideout/comfort-travel-trailers/floorplans/24RBS",
  "https://www.keystonerv.com/product/hideout/comfort-travel-trailers/floorplans/24RBSWE",
  "https://www.keystonerv.com/product/hideout/comfort-travel-trailers/floorplans/24RKSWE",
  "https://www.keystonerv.com/product/montana/luxury-fifth-wheels/floorplans/3123RL",
  "https://www.keystonerv.com/product/montana/luxury-fifth-wheels/floorplans/3231CK",
  "https://www.keystonerv.com/product/montana/luxury-fifth-wheels/floorplans/3531RE",
  "https://www.keystonerv.com/product/montana/luxury-fifth-wheels/floorplans/3761FL",
  "https://www.keystonerv.com/product/montana/luxury-fifth-wheels/floorplans/3781RL",
  "https://www.keystonerv.com/product/montana/luxury-fifth-wheels/floorplans/3793RD",
  "https://www.keystonerv.com/product/montana/luxury-fifth-wheels/floorplans/3795FK",
  "https://www.keystonerv.com/product/montana/luxury-fifth-wheels/floorplans/3857BR",
  "https://www.keystonerv.com/product/montana/luxury-fifth-wheels/floorplans/3901RK",
  "https://www.keystonerv.com/product/montana/luxury-fifth-wheels/floorplans/3915TB",
  "https://www.keystonerv.com/product/montana/luxury-fifth-wheels/floorplans/3941FO",
  "https://www.keystonerv.com/product/montana-high-country/luxury-fifth-wheels/floorplans/295RL",
  "https://www.keystonerv.com/product/montana-high-country/luxury-fifth-wheels/floorplans/311RD",
  "https://www.keystonerv.com/product/montana-high-country/luxury-fifth-wheels/floorplans/331RL",
  "https://www.keystonerv.com/product/montana-high-country/luxury-fifth-wheels/floorplans/335BH",
  "https://www.keystonerv.com/product/montana-high-country/luxury-fifth-wheels/floorplans/351BH",
  "https://www.keystonerv.com/product/montana-high-country/luxury-fifth-wheels/floorplans/373RD",
  "https://www.keystonerv.com/product/montana-high-country/luxury-fifth-wheels/floorplans/377FL",
  "https://www.keystonerv.com/product/montana-high-country/luxury-fifth-wheels/floorplans/381TB",
  "https://www.keystonerv.com/product/montana-high-country/luxury-fifth-wheels/floorplans/385BR",
  "https://www.keystonerv.com/product/montana-high-country/luxury-fifth-wheels/floorplans/389BH",
];
const knownDomainMappings = JSON.parse(
  fs.readFileSync("./known-domain-mappings.json", "utf-8")
);
const synonymDictionary = JSON.parse(
  fs.readFileSync("./synonym-dictionary.json", "utf-8")
);

rvDataScraper({
  rvYear: 2024,
  urls,
  knownDomainMappings,
  synonymDictionary,
});
