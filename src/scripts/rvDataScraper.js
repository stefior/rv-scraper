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
  setupSiteSelectors,
  getLastUrlSegment,
  backupFile,
  saveDomainMappings,
  prependAppendBrackets,
} from "../helpers/index.js";

/**
 * Validates the input parameters for the rvDataScraper function.
 *
 * @param {Object} params - The input parameters object.
 * @param {number} params.rvYear - The RV year, expected to be a four-digit number.
 * @param {Array} params.urls - The URLs array, expected to be non-empty.
 * @param {Object} params.domainsMappings - The known domain mappings object, expected to be non-empty.
 * @param {string} params.outputFolder - The output folder path, expected to be a non-empty string.
 * @returns {boolean} Returns true if all parameters are valid, otherwise false.
 */
function validateParameters({ rvYear, urls, domainsMappings, outputFolder }) {
  if (isNaN(rvYear) || String(rvYear).length !== 4) {
    console.error("rvYear parameter must be a valid year number");
    return false;
  }

  if (!Array.isArray(urls) || urls.length < 1) {
    console.error("urls parameter must be an array with items");
    return false;
  }

  if (
    typeof domainsMappings !== "object" ||
    Object.keys(domainsMappings).length === 0
  ) {
    console.error("domainsMappings parameter must be a non-empty object");
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
 * Extracts data from a webpage based on specified site mappings using Puppeteer's page object.
 * The function navigates through the table rows in the webpage and extracts text content from specified elements,
 * as well as extracts additional information based on the provided site mappings.
 *
 * @async
 * @param {Object} page - The Puppeteer page object representing the webpage.
 * @param {Object} siteMappings - An object containing mappings to specific elements on the webpage, or else null.
 * @returns {Promise<Object>} - A promise that resolves to an object containing the extracted data.
 * The object contains keys based on the text content of the first cell in each row of the table,
 * as well as additional keys based on the site mappings provided.
 */
async function extractData(page, siteMappings) {
  return page.evaluate((sM) => {
    data = {};

    if (sM.rowSelector) {
      const rows = document.querySelectorAll(sM.rowSelector);

      rows.forEach((row) => {
        const cells = row.children;

        // Ensure there are at least two cells in the row before proceeding
        if (cells.length >= 2) {
          const key = cells[0].textContent.trim();
          const value = cells[1].textContent.trim();

          data[key] = value; // Grab it all now, then just use what's useful later
        }
      });
    }
    if (sM.dlSelector) {
      const descriptionList = document.querySelector("dl");
      const descriptionTerms = descriptionList.querySelectorAll("dt");
      const descriptionDetails = descriptionList.querySelectorAll("dd");

      for (let i = 0; i < descriptionTerms.length; i++) {
        const key = descriptionTerms[i].textContent.trim();
        const value =
          i < descriptionDetails.length
            ? descriptionDetails[i].textContent.trim()
            : null;

        data[key] = value;
      }
    }

    function queryAndTrim(selector) {
      // Not using querySelectorAll on purpose, since there should only be one of these
      const element = document.querySelector(selector);
      return element ? element.textContent.replace(/\s+/g, " ").trim() : null;
    }

    data["Web Features"] = queryAndTrim(sM.webFeaturesSelector);
    data["Web Description"] = queryAndTrim(sM.descriptionSelector);
    data.Make = sM.Make;
    data.Type = queryAndTrim(sM.typeSelector);
    data.Model = queryAndTrim(sM.modelSelector);
    data.Trim = queryAndTrim(sM.trimSelector);

    const imageUrl = document.querySelector(sM.imageSelector)?.src;
    if (
      imageUrl &&
      typeof imageUrl === "string" &&
      !imageUrl.startsWith("data:")
    ) {
      data.imageUrl = imageUrl;
    } else {
      data.imageUrl = null;
    }

    return data;
  }, siteMappings);
}

/**
 * Prompts the user to confirm whether a given key-value mapping is correct.
 * The function keeps prompting the user until a valid response (y/n) is received.
 *
 * @param {string} unsureKey - The key whose mapping is uncertain.
 * @param {string} unsureKeysValue - The value associated with the unsure key.
 * @param {Object} synonymDictionary - An object containing known key mappings.
 * @returns {Promise<boolean>} A promise that resolves to true if the user confirms the mapping, or false if the user denies it.
 *
 * @example
 * const isCorrect = await isMappingCorrectPrompt('exampleKey', 'exampleValue', {exampleKey: 'correctKey'});
 * if(isCorrect) {
 *   // Proceed with the confirmed mapping
 * } else {
 *   // Handle incorrect mapping
 * }
 */
function isMappingCorrectPrompt(unsureKey, unsureKeysValue, synonymDictionary) {
  // ...function body...
}

function isMappingCorrectPrompt(unsureKey, unsureKeysValue, synonymDictionary) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    function ask() {
      rl.question(
        `Is the mapping '${unsureKey}' -> '${synonymDictionary[unsureKey]}' correct? y/n\nValue: ${unsureKeysValue}\n>`,
        (userInput) => {
          const answer = userInput.trim().toLowerCase();

          if (answer === "y") {
            console.log(
              `    Mapping confirmed ('${unsureKey}' -> '${synonymDictionary[unsureKey]}')\n`
            );
            rl.close();
            resolve(true);
          } else if (answer === "n") {
            console.log();
            rl.close();
            resolve(false);
          } else {
            console.log("Invalid response. Please enter either y or n.");
            ask();
          }
        }
      );
    }

    ask();
  });
}

/**
 * Prompts the user to provide a standard key name for an unrecognized key,
 * using a recursive approach to re-prompt the user until a valid standard key name is provided.
 *
 * @param {string} unrecognizedKey - The unrecognized key for which a standard key name is needed.
 * @param {any} unrecognizedKeysValue - The value of the unrecognized key.
 * @param {Object} synonymDictionary - An object where each key is a term used in the data source, and the corresponding value is the standardized term used in the database.
 * @returns {Promise<string|null>} - A promise that resolves to the standard key name provided by the user or null if there is no mapping.
 */
function promptForNewKeyMapping(
  unrecognizedKey,
  unrecognizedKeysValue,
  synonymDictionary
) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    if (unrecognizedKey === "") {
      resolve(null);
    }

    function ask() {
      rl.question(
        `Unrecognized key: '${unrecognizedKey}'\nValue: '${unrecognizedKeysValue}'\nPlease enter the standard key name or null: `,
        (userInput) => {
          const standardKeyName = userInput.trim();

          if (standardKeyName === "null") {
            console.log(
              `    Mapping confirmed ('${unrecognizedKey}' -> null)\n`
            );
            rl.close();
            resolve(null);
          } else if (Object.keys(synonymDictionary).includes(standardKeyName)) {
            console.log(
              `    Mapping confirmed ('${unrecognizedKey}' -> '${standardKeyName}'\n)`
            );
            rl.close();
            resolve(standardKeyName);
          } else {
            console.log("Invalid key. Try again.");
            ask();
          }
        }
      );
    }

    ask();
  });
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
 * // Suppose keyMappings = { "Brand": "Make" }, and extractedData = { "Brand": "Ford" }
 * const renamedData = renameData(extractedData);
 * console.log(renamedData); // Output: { "Make": "Ford" }
 */
async function renameKeys(extractedData, siteMappings, synonymDictionary) {
  const savedKeyMappings = siteMappings.keyMappings;
  const renamedData = {};

  for (const currentKey of Object.keys(extractedData)) {
    if (currentKey in savedKeyMappings) {
      // Change the key name in the extracted data to the one for the database
      const newKeyName = savedKeyMappings[currentKey];
      renamedData[newKeyName] = extractedData[currentKey];
      continue;
    } else if (currentKey in synonymDictionary) {
      if (synonymDictionary[currentKey] === null) continue;

      // It's already definitely correct in this case
      if (
        currentKey.toLowerCase() === synonymDictionary[currentKey].toLowerCase()
      ) {
        renamedData[currentKey] = extractedData[currentKey];
        continue;
      }

      // It might be correct in this case, but it needs to be confirmed
      // since some sites have clashing names for the fields
      const isMappingCorrect = await isMappingCorrectPrompt(
        currentKey,
        extractedData[currentKey],
        synonymDictionary
      );
      if (isMappingCorrect) {
        const newKeyName = synonymDictionary[currentKey];
        savedKeyMappings[currentKey] = newKeyName;
        renamedData[newKeyName] = extractedData[currentKey];
        continue;
      }
    }

    // Ask user what *standardized key* the key from the site is referring to
    const newKeyName = await promptForNewKeyMapping(
      currentKey,
      extractedData[currentKey],
      synonymDictionary
    );
    // Map the key name from the site to the one for the database
    savedKeyMappings[currentKey] = newKeyName;
    // Change the key name in the extracted data to the one for the database
    renamedData[newKeyName] = extractedData[currentKey];
  }
  delete renamedData.null;

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
function transformData(renamedData, rvYear, lastUrlSegment, url) {
  //
  // TODO: add for all data[currentKey] = formatValue(data[currentKey]); //// NEEDS TESTING ////
  //
  const transformedData = JSON.parse(JSON.stringify(renamedData));
  const tD = transformedData;

  tD.url = url;
  tD.Year = rvYear;
  tD["Floor plan"] = lastUrlSegment;
  if (!tD.Type) tD.Type = getRvTypeFromUrl(url);
  if (!tD.Trim) {
    tD.Trim = lastUrlSegment;
  }
  tD.Name = `${tD.Year} ${tD.Make} ${tD.Model} ${tD.Trim}`;

  if ("Awning length ftm" in tD) {
    tD["Awning length ftm"] = splitAwningMeasurements(tD["Awning length ftm"]);
  }

  addMissingGvwrUvwCcc(tD);

  if ("Tire Code" in tD) {
    const tireData = parseTireCode(tD["Tire Code"]);
    tD["Rear tire diameter in"] = tireData.tireDiameterIn;
    // Wheel width and wheel diameter are different, but diameter is likely what was meant
    tD["Rear wheel width in"] = tireData.wheelDiameterIn;
  }

  return tD;
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
async function handleImageDownload(outputFolder, transformedData) {
  await downloadAndConvertToPng(
    transformedData.imageUrl,
    transformedData["Floor plan"],
    outputFolder
  ).catch((err) => {
    console.error(`ERROR DOWNLOADING IMAGE: ${err}`);
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
function appendDataToFile(outputFolder, extractedData) {
  if (!fs.existsSync(outputFolder)) fs.mkdirSync(outputFolder);

  const outputFile = path.join(
    outputFolder,
    extractedData.Make.toLowerCase().replace(/\s+/g, "-") + ".json"
  );

  try {
    fs.appendFileSync(outputFile, JSON.stringify(extractedData, null, 4), ",");
  } catch (err) {
    throw new Error(
      `Failed to append data to file for "${extractedData.Name}"`
    );
  }
}

/**
 * Saves the domain mappings to a JSON file. This function attempts to write the `domainsMappings`
 * object to a file named `domain-mappings.json`. If the write operation fails, an error is thrown.
 *
 * @param {Object} domainsMappings - The object containing domain mappings to be saved.
 * @throws Will throw an error if it fails to write the domain mappings to the file.
 *
 * @example
 * const domainsMappings = { "example.com": { Make: "make-selector", Model: "model-selector" } };
 * saveDomainMappings(domainsMappings);
 * // The known domain mappings are now saved to a file named `domain-mappings.json`.
 */
function saveDomainMappings(domainsMappings) {
  try {
    fs.writeFileSync(
      "domains-mappings.json",
      JSON.stringify(domainsMappings, null, 2)
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
 * @param {Object} params.domainsMappings - An object containing known domain mappings which help in data extraction.
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
 *   domainsMappings: {...},
 *   outputFolder: './data'
 * });
 */
export default async function rvDataScraper({
  rvYear,
  urls,
  domainsMappings,
  synonymDictionary,
  outputFolder = "./output",
}) {
  if (!validateParameters({ rvYear, urls, domainsMappings, outputFolder }))
    return;
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  // Set viewport is so that mobile styles aren't applied due to puppeteer using a 783 px window by default
  await page.setViewport({ width: 1920, height: 1080 });

  let urlIndex = 0;
  const failedNavigations = [];
  const imagesOutputFolder = path.join(outputFolder, "images");

  backupFile("synonym-dictionary.json");
  for (const url of urls) {
    try {
      // Waiting for load event is so the scraper doesn't scrape temporary placeholder images
      await page.goto(url, { waitUntil: "load" });
    } catch (err) {
      failedNavigations.push(url);
      continue; // Continue with the next URL if navigation fails, listing all failures at the end
    }
    const secondLevelDomain = getSecondLevelDomain(url);
    const siteMappings = await setupSiteSelectors(
      domainsMappings,
      secondLevelDomain
    );
    saveDomainMappings(domainsMappings);
    console.log("Domain selectors saved or retrieved.");

    const extractedData = await extractData(page, siteMappings);

    // Rename each of the keys in the extracted data to correspond with the database keys
    const renamedData = await renameKeys(
      extractedData,
      siteMappings,
      synonymDictionary
    );
    saveDomainMappings(domainsMappings);

    const transformedData = transformData(
      renamedData,
      rvYear,
      getLastUrlSegment(url),
      url
    );

    await handleImageDownload(imagesOutputFolder, transformedData);

    appendDataToFile(outputFolder, transformedData);

    console.log(`Scraped and saved data for ${urlIndex + 1} of ${urls.length}`);
    urlIndex++;
  }
  const files = fs.readdirSync(outputFolder);
  for (const file of files) {
    // Turn outputted json files into arrays
    const filePath = path.join(outputFolder, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      continue;
    }
    prependAppendBrackets(filePath);

    // Filter out duplicate objects
    const content = fs.readFileSync(filePath, "utf-8");
    let jsonArr;
    try {
      jsonArr = JSON.parse(content);
    } catch (error) {
      console.error(`Failed to parse JSON from ${filePath}:`, error.message);
      continue;
    }
    if (!Array.isArray(jsonArr)) {
      console.error(`Content in ${filePath} is not an array.`);
      continue;
    }
    const uniqueJsonArr = [];
    const seenObjects = new Set();
    for (const item of jsonArr) {
      const strItem = JSON.stringify(item);
      if (!seenObjects.has(strItem)) {
        seenObjects.add(strItem);
        uniqueJsonArr.push(item);
      }
    }

    // Write the filtered array back to the file
    fs.writeFileSync(filePath, JSON.stringify(uniqueJsonArr, null, 2));
  }

  if (failedNavigations.length > 0) {
    console.log(
      "\nScraper failed to navigate to these URLs:\n",
      failedNavigations
    );
  }

  await browser.close();
}

const urls = ["https://www.thormotorcoach.com/vegas/floor-plans/24.1"];
const domainsMappings = JSON.parse(
  fs.readFileSync("./domains-mappings.json", "utf-8")
);
const synonymDictionary = JSON.parse(
  fs.readFileSync("./synonym-dictionary.json", "utf-8")
);

rvDataScraper({
  rvYear: 2024,
  urls,
  domainsMappings,
  synonymDictionary,
});
