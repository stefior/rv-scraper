import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

import {
  downloadAndConvertToPng,
  splitAwningMeasurements,
  parseTireCode,
  addMissingGvwrUvwCcc,
  getRvTypeFromUrl,
  setupAndSaveSiteSelectors,
} from "../helpers/";

////////////////////////////////////
const knownSiteMappings = {
  granddesignrv: [],
  keystonerv: [],
  outdoorsrvmfg: [],
};
////////////////////////////////////

// NOTE TO SELF: The purpose of this function isn't 100% automation, but for partial automation where the user is prompted from the console for all cases where it isn't sure. The user shouldn't need to edit the JSON, but they will definitely sometimes need to provide input, at least for the first time per site.
async function rvDataScraper({
  urls,
  knownSiteMappings,
  keyMappings,
  outputFolder = "./output",
}) {
  const browser = await puppeteer.launch({ headless: "new" });

  for (const url of urls) {
    const page = await browser.newPage();
    await page.goto(url);

    await page.waitForSelector("table");
    const extractedData = await page.evaluate(
      (url, keyMappings) => {
        (async () => {
          const [
            Make,
            typeSelector,
            modelSelector,
            trimSelector,
            imageSelector,
          ] = await setupAndSaveSiteSelectors(knownSiteMappings);
          const urlTail = url
            .split("/")
            .filter((section) => section != "")
            .slice(-1)[0];

          const rows = document.querySelectorAll("tbody tr");
          const keyList = Object.keys(keyMappings);

          const data = {};
          // To store keys in the final object for what things may need to be manually verified or edited (e.g. with find and replace on part of the string)
          data.verifyManually = [];

          rows.forEach((row) => {
            const keyCell = row.querySelector("td:nth-child(1)");
            const valueCell = row.querySelector("td:nth-child(2)");

            if (keyCell && valueCell) {
              const key = keyCell.textContent.trim();
              const value = valueCell.textContent.trim();

              // CURRENTLY EDITING:
              if (keyList.includes(key)) {
                data[key] = value;
              }
            }
          });

          data["URL"] = url;
          // TODO: don't hardcode so there isn't an issue if this is used next year or on previous years
          data["Year"] = "2024";
          data["Make"] = Make;

          if (typeSelector) {
            const typeSelector = document.querySelector(typeSelector);
            const text = typeElement.textContent.trim();
            data["Type"] = text ? text : undefined;
          } else {
            data["Type"] = getRvTypeFromUrl(url);
          }

          if (modelSelector) {
            const modelElement = document.querySelector(modelSelector);
            const text = modelElement.textContent.trim();
            data["Model"] = text ? text : undefined;
          } else {
            data["Model"] = undefined;
          }

          if (trimSelector) {
            const trimElement = document.querySelector(trimSelector);
            const text = trimElement.textContent.trim();
            data["Trim"] = text ? text : undefined;
          } else {
            // Some sites don't have the trim on the page, but it's usually at the end of the url
            data["Trim"] = urlTail;
            data.verifyManually.push("Trim");
          }

          data["Name"] = `${data.Year} ${data.Make} ${data.Model} ${data.Trim}`;

          if (imageSelector) {
            const imageElement = document.querySelector(imageSelector);
            data["imageURL"] = imageElement.src;
            data["Floor plan"] = `${urlTail}`;
          } else {
            data["imageURL"] = undefined;
          }

          const renamedData = Object.keys(data).reduce((acc, key) => {
            const newKey = keyMappings[key] || key;
            acc[newKey] = data[key];
            return acc;
          }, {});

          for (key in renamedData) {
            if (renamedData.key === undefined) {
              data.verifyManually.push(`${key}`);
            }
          }

          return renamedData;
        })();
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

  await browser.close();
}

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

// Specific to this group of sites, will be generated automatically soon
const keyMappings = {
  "Exterior Height": "Height closed ftin",
  "Exterior Length (approx. hitch to back of bumper)": "Length ftin",
  "Interior Height": "Interior height in",
  "Full Feature Dry Weight - Lbs.": "Dry weight lbs",
  "Maximum Trailer Weight - Lbs.": "Gvwr lbskgs",
  "Net Carrying Capacity": "CCC",
  "Fresh Water Capacity (approx. gal)": "Total fresh water tank capacity gall",
  "Grey Water Tank (approx. gallons)": "Total gray water tank capacity gall",
  "Black Water Tank (approx. gallons)": "Total black water tank capacity gall",
  "LPG Capacity (approx. pounds)": "Total propane tank capacity gallbs",
  "Water Heater Capacity (approx. gal)": "Water heater tank capacity gl",
  "Climate Designed Furnace": "Heater",
  "Heavy Duty 5 Lug Axles (lbs)": "Number of axles",
  "Good Year Tire Size": "Tire code",
};

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

// for formatting step, DISREGARD FOR NOW
// TODO: verify this is accurate
// TODO: apply a function to make sure each of these is converted properly
// (leave note on final set that if the field names change this part should be changed and the dictionary needs to be reset)
const standardizedFieldNames = {
  Year: "number",
  Make: "string",
  Model: "string",
  Trim: "string",
  Type: "string",
  "Generic type primary": "string",
  Name: "string",
  "Main image url": "string",
  "Floor plan": "string",
  "Regional availability": "string",
  "Basic warranty months": "months",
  "Structure warranty monthsmiles": "monthsmiles",
  "Powertrain warranty monthsmiles": "monthsmiles",
  "Chassis warranty monthsmiles": "monthsmiles",
  "Engine type": "string",
  "Engine brand name": "string",
  Cylinders: "number",
  "Displacement l": "liters",
  Turbocharged: "boolean",
  Supercharged: "boolean",
  "Horsepower bhpkw": "bhpkw",
  "Torque ft lbsnm": "ft-lbs",
  "Fuel type": "string",
  "Us miles per gallon hwycity": "mpg",
  "Transmission type": "string",
  "Number of speeds": "number",
  "Transmission brand": "string",
  Overdrive: "boolean",
  "Driveline type": "string",
  "Number of axles": "number",
  Wheels: "number",
  "Wheels composition": "string",
  "Front wheel width in": "inches",
  "Rear wheel width in": "inches",
  Tires: "string", ///////// how to handle tireData?
  "Rear tire diameter in": "inches",
  "Front tire diameter in": "inches",
  Brakes: "string",
  "Front brake type": "string",
  "Rear brake type": "string",
  "Anti lock brakes": "boolean",
  "Length ftft": "feet",
  "Length ftin": "inches",
  "Length closed inclosed ftclosed mmclosed m": "inchesfeet",
  "Width inmm": "inches",
  "Height in": "inches",
  "Height closed ftft": "feet",
  "Height closed ftin": "inches",
  "Interior height in": "inches",
  "Wheelbase inmm": "inches",
  "Gvwr lbskgs": "lbs",
  "Dry weight lbs": "lbs",
  "Fuel capacity gal": "gallons",
  "Number of fresh water holding tanks": "number",
  "Total fresh water tank capacity gall": "gallons",
  "Number of gray water holding tanks": "number",
  "Total gray water tank capacity gall": "gallons",
  "Number of black water holding tanks": "number",
  "Total black water tank capacity gall": "gallons",
  "Number of propane tanks": "number",
  "Total propane tank capacity gallbs": "gallons",
  "Water heater tank": "string",
  "Water heater tank capacity gl": "gallons",
  Layout: "string",
  "Chassis model": "string",
  "Chassis brand": "string",
  "Body material": "string",
  "Freeze proof insulation": "boolean",
  "Number of doors": "number",
  "Number of slideouts": "number",
  "Power retractable slideout": "boolean",
  "Sky light": "boolean",
  "Roof vents": "number",
  Gps: "boolean",
  "Gps brand": "string",
  "Cruise control": "boolean",
  "Rear video backup camera": "boolean",
  Heater: "boolean",
  "Heater type": "string",
  "Air conditioning": "boolean",
  "Air conditioning type": "string",
  "Water heater pump power mode": "string",
  "Water heater tank bypass": "boolean",
  "Washer dryer": "boolean",
  Dishwasher: "boolean",
  "Garbage disposal": "boolean",
  "Draw bar": "string",
  "Leveling jacks": "number",
  "Leveling jack type": "string",
  "Power retractable entry steps": "boolean",
  "Voltage meter": "boolean",
  "Fresh water holding tank gauge": "boolean",
  "Gray water holding tank gauge": "boolean",
  "Black water holding tank gauge": "boolean",
  "Water pump power display": "boolean",
  "Propane tank gauge": "boolean",
  "Trailer level gauge": "boolean",
  "Kitchen location": "string",
  "Kitchen living area flooring type": "string",
  "Kitchen table configuration": "string",
  "Overhead fan": "boolean",
  "Microwave oven": "boolean",
  "Refrigerator size": "string",
  "Refrigerator power mode": "string",
  "Number of oven burners": "number",
  "Oven depth in": "inches",
  "Oven size btu": "btu",
  "Living area location": "string",
  "Number of sofas": "number",
  "Sofa material": "string",
  "Reclining sofa": "boolean",
  "Number of seats": "number",
  "Seat material": "string",
  "Seat armrests": "boolean",
  "Reclining seats": "boolean",
  "Heated seat": "boolean",
  "Swivel seats": "boolean",
  "Recliners rockers": "number",
  "Max sleeping count": "number",
  Bunkhouse: "boolean",
  "Expandable bunk": "boolean",
  "Number of bunk beds": "number",
  "Number of double beds": "number",
  "Number of full size beds": "number",
  "Number of queen size beds": "number",
  "Number of king size beds": "number",
  "Number of convertible sofa beds": "number",
  "Master bedroom location": "string",
  "Master bedroom flooring type": "string",
  "Full size master bedroom closet": "boolean",
  "Number of bathrooms": "number",
  "Bathroom location": "string",
  Toilet: "boolean",
  "Toilet type": "string",
  Shower: "boolean",
  "Bathroom sink": "boolean",
  "Bathroom mirror": "boolean",
  "Bathroom medicine cabinet": "boolean",
  "Bathroom vent fan system": "boolean",
  "Bathroom flooring type": "string",
  Battery: "boolean",
  Generator: "boolean",
  "Battery power converter": "boolean",
  "Solar battery charger": "boolean",
  "Cargo area battery charger": "boolean",
  "Ground fault plugs": "boolean",
  "Heat prewiring": "boolean",
  "Air conditioning prewiring": "boolean",
  "Cable prewiring": "boolean",
  "Tv antenna prewiring": "boolean",
  "Satellite prewiring": "boolean",
  "Phone prewiring": "boolean",
  "Washer dryer prewiring": "boolean",
  "Security alarm": "boolean",
  "Smoke detector": "boolean",
  "Propane alarm": "boolean",
  "Carbon monoxide detector": "boolean",
  "Number of emergency exits": "number",
  Satellite: "boolean",
  "Number of televisions": "number",
  "Cd player": "boolean",
  "Dvd player": "boolean",
  "Number of discs": "number",
  Speakers: "number",
  "Surround sound": "boolean",
  "Number of radios": "number",
  "Cb radio": "boolean",
  "Exterior entertainment system": "boolean",
  "Retractable roof antenna": "boolean",
  "Number of awnings": "number",
  "Power retractable awning": "boolean",
  "Awning length ftm": "feet",
  "Slideout awning": "boolean",
  "Exterior plugs": "number",
  "Exterior ladder": "boolean",
  "Exterior shower": "boolean",
  "Exterior grille": "boolean",
  "Exterior kitchen": "boolean",
  "Exterior window shade cover": "boolean",
  "Exterior flood lights": "boolean",
  "Exterior patio deck": "boolean",
  "Exterior patio deck location": "string",
  "Interior wood finish": "string",
  Wallpaper: "string",
  "Curtains shades": "boolean",
  "Storage capacity cuftgall": "cubic feet",
  "Cargo area height inmm": "inches",
  "Cargo area width inmm": "inches",
  "Cargo area side door": "boolean",
  "Cargo area rear door": "boolean",
  "Cargo area sink": "boolean",
  "Cargo area floor drain plug": "boolean",
  "Exterior cargo deck": "boolean",
  "Exterior cargo deck length inmm": "inches",
  "Exterior cargo deck width inmm": "inches",
  "Web Features": "string",
  "Web Description": "string",
};

rvDataScraper({
  urls,
  keyMappings,
  make: "Outdoors RV",
  typeSelector: undefined,
  modelSelector: undefined,
  trimSelector: undefined,
  imageSelector: undefined,
});
