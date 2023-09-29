import puppeteer from "puppeteer";
import fs from "fs";
import downloadAndConvertImage from "./downloadAndConvertImage.js";
import splitAwningMeasurements from "./splitAwningMeasurements.js";
import { error } from "console";

/*
Workflow for if a site has the data in a single table on each page (many RVs/page):
1. use the Table Capture chrome extension
2. copy/paste each table one after another into a single sheets doc
3. clean it up in there with very simple sheets formulas and find & replace
4. convert to JSON with csvjson.com/csv2json (may need to check transpose)
5. use the modules and shortcuts in here to make any other changes necessary
6. use databaseAutoEnter to put the JSON data into the database either way
*/

// For sites that have a single key/value pair on each row (1 RV/page)
// or sites that have the data in multiple such tables
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });

  // For new site: it's easiest to open all pages in a new window, then
  // use Copy All URLs chrome extension, then paste here
  const urls = [
    "https://www.granddesignrv.com/travel-trailers/transcend-xplor/200mk",
    "https://www.granddesignrv.com/travel-trailers/transcend-xplor/221rb",
    "https://www.granddesignrv.com/travel-trailers/transcend-xplor/235bh",
    "https://www.granddesignrv.com/travel-trailers/transcend-xplor/240ml",
    "https://www.granddesignrv.com/travel-trailers/transcend-xplor/245rl",
    "https://www.granddesignrv.com/travel-trailers/transcend-xplor/247bh",
    "https://www.granddesignrv.com/travel-trailers/transcend-xplor/251BH",
    "https://www.granddesignrv.com/travel-trailers/transcend-xplor/260rb",
    "https://www.granddesignrv.com/travel-trailers/transcend-xplor/261bh",
    "https://www.granddesignrv.com/travel-trailers/transcend-xplor/265bh",
    "https://www.granddesignrv.com/travel-trailers/transcend-xplor/297qb",
    "https://www.granddesignrv.com/travel-trailers/transcend-xplor/315bh",
    "https://www.granddesignrv.com/travel-trailers/transcend-xplor/315bh",
    "https://www.granddesignrv.com/fifth-wheels/solitude/310gk",
    "https://www.granddesignrv.com/fifth-wheels/solitude/376rd",
    "https://www.granddesignrv.com/fifth-wheels/solitude/378ms",
    "https://www.granddesignrv.com/fifth-wheels/solitude/380fl",
    "https://www.granddesignrv.com/fifth-wheels/solitude/382wb",
    "https://www.granddesignrv.com/fifth-wheels/solitude/390rk",
    "https://www.granddesignrv.com/fifth-wheels/solitude/391dl",
    "https://www.granddesignrv.com/travel-trailers/reflection/296RDTS",
    "https://www.granddesignrv.com/travel-trailers/reflection/297rsts",
    "https://www.granddesignrv.com/travel-trailers/reflection/310mkts",
    "https://www.granddesignrv.com/travel-trailers/reflection/312bhts",
    "https://www.granddesignrv.com/travel-trailers/reflection/315rlts",
    "https://www.granddesignrv.com/fifth-wheels/reflection/303rls",
    "https://www.granddesignrv.com/fifth-wheels/reflection/311bhs",
    "https://www.granddesignrv.com/fifth-wheels/reflection/320mks",
    "https://www.granddesignrv.com/fifth-wheels/reflection/324MBS",
    "https://www.granddesignrv.com/fifth-wheels/reflection/337rls",
    "https://www.granddesignrv.com/fifth-wheels/reflection/367bhs",
    "https://www.granddesignrv.com/fifth-wheels/reflection/370FLS",
    "https://www.granddesignrv.com/fifth-wheels/reflection/362TBS",
    "https://www.granddesignrv.com/travel-trailers/imagine/2400bh",
    "https://www.granddesignrv.com/travel-trailers/imagine/2500rl",
    "https://www.granddesignrv.com/travel-trailers/imagine/2600rb",
    "https://www.granddesignrv.com/travel-trailers/imagine/2670mk",
    "https://www.granddesignrv.com/travel-trailers/imagine/2800bh",
    "https://www.granddesignrv.com/travel-trailers/imagine/2910bh",
    "https://www.granddesignrv.com/travel-trailers/imagine/2970RL",
    "https://www.granddesignrv.com/travel-trailers/imagine/3100rd",
    "https://www.granddesignrv.com/travel-trailers/imagine/3210BH",
    "https://www.granddesignrv.com/travel-trailers/imagine-xls/23LDE",
    "https://www.granddesignrv.com/travel-trailers/imagine-xls/25BH",
    "https://www.granddesignrv.com/travel-trailers/imagine-xls/17mke",
    "https://www.granddesignrv.com/travel-trailers/imagine-xls/21bhe",
    "https://www.granddesignrv.com/travel-trailers/imagine-xls/22mle",
    "https://www.granddesignrv.com/travel-trailers/imagine-xls/22rbe",
    "https://www.granddesignrv.com/travel-trailers/imagine-xls/23bhe",
    "https://www.granddesignrv.com/toy-haulers/momentum-g-class-travel-trailers/21g",
    "https://www.granddesignrv.com/toy-haulers/momentum-g-class-travel-trailers/23g",
    "https://www.granddesignrv.com/toy-haulers/momentum-g-class-travel-trailers/25g",
    "https://www.granddesignrv.com/toy-haulers/momentum-g-class-travel-trailers/28g",
    "https://www.granddesignrv.com/toy-haulers/momentum-g-class-travel-trailers/29g",
    "https://www.granddesignrv.com/toy-haulers/momentum-g-class-travel-trailers/30g",
    "https://www.granddesignrv.com/toy-haulers/momentum-g-class-travel-trailers/31g",
    "https://www.granddesignrv.com/toy-haulers/momentum-g-class-travel-trailers/32g",
    "https://www.granddesignrv.com/toy-haulers/momentum-mav/22MAV",
    "https://www.granddesignrv.com/toy-haulers/momentum-mav/27MAV",
    "https://www.granddesignrv.com/toy-haulers/momentum-m-class/336M",
    "https://www.granddesignrv.com/toy-haulers/momentum-m-class/349m",
    "https://www.granddesignrv.com/toy-haulers/momentum-m-class/351ms",
    "https://www.granddesignrv.com/toy-haulers/momentum-m-class/381ms",
    "https://www.granddesignrv.com/toy-haulers/momentum-m-class/395ms",
    "https://www.granddesignrv.com/toy-haulers/momentum-m-class/398m",
  ];

  // For new site: change these by copying into ChatGPT and telling it to
  // swap the old keys with the new keyList for current site
  const keyMapping = {
    "Exterior Height": "Height closed ftin",
    "Exterior Length": "Length ftin",
    "Exterior Width": "Width inmm",
    "Interior Height": "Interior height in",
    UVW: "Dry weight lbs",
    GVWR: "Gvwr lbskgs",
    "Fresh Water Capacity": "Total fresh water tank capacity gall",
    "Grey Water Capacity": "Total gray water tank capacity gall",
    "Waste Water Capacity": "Total black water tank capacity gall",
    "Propane Tanks": "Number of propane tanks",
    LPG: "Total propane tank capacity gallbs",
    "Sleeping Capacity": "Max sleeping count",
    "Water Heater": "Water heater tank capacity gl",
    Refrigerator: "Refrigerator size",
    Furnace: "Heater",
    AC: "Air conditioning",
    Axles: "Number of axles",
    "Standard Bed": "Number of queen size beds",
    Shower: "Shower",
    Slides: "Number of slideouts",
    Awnings: "Number of awnings",
    "Awning Length": "Awning length ftm",
  };

  for (const url of urls) {
    const page = await browser.newPage();

    await page.goto(url);

    const selector = "table";
    await page.waitForSelector(selector);
    const extractedData = await page.evaluate(
      (url, keyMapping) => {
        const rows = document.querySelectorAll("tbody tr");
        // For new site: keys for current site can be copied into here
        const keyList = [
          "Exterior Height",
          "Exterior Length",
          "Exterior Width",
          "Interior Height",
          "UVW",
          "GVWR",
          "Fresh Water Capacity",
          "Grey Water Capacity",
          "Waste Water Capacity",
          "Propane Tanks",
          "LPG",
          "Sleeping Capacity",
          "Water Heater",
          "Refrigerator",
          "Furnace",
          "AC",
          "Axles",
          "Standard Bed",
          "Shower",
          "Slides",
          "Awnings",
          "Awning Length",
        ];

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

        data["Make"] = "Grand Design";
        data["Year"] = "2024";

        // For new site: replace selector for model
        // (right click in dev tools on the image and choose 'copy selector')
        const modelElementSelector =
          "#subnav > ul > li.subnav-left__items__item.subnav-left__items__brand > div > span";
        const modelElement = document.querySelector(modelElementSelector);
        data["Model"] = modelElement ? modelElement.textContent.trim() : null;

        // For new site: replace trim selector the same way
        const trimElementSelector =
          "#subnav > ul > li.subnav-left__items__item.divide-x.dropdown > button > span";
        const trimElement = document.querySelector(trimElementSelector);
        data["Trim"] = trimElement ? trimElement.textContent.trim() : null;

        // For new site: replace image selector the same way
        const imageElementSelector = "#floorplan-overhead > p > img";
        const imageElement = document.querySelector(imageElementSelector);
        if (imageElement) {
          data["imageURL"] = imageElement.src;
          data["Floor plan"] = `${data.Model.replace(/\s/g, "_")}__${
            data["Trim"]
          }.png`;
        } else {
          data["imageURL"] = null;
        }

        const renamedData = Object.keys(data).reduce((acc, key) => {
          const newKey = keyMapping[key] || key;
          acc[newKey] = data[key];
          return acc;
        }, {});

        return renamedData;
      },
      url,
      keyMapping
    );

    await downloadAndConvertImage(
      extractedData.imageURL,
      extractedData["Floor plan"],
      "./images"
    ).catch((err) => {
      throw err;
    });

    if ("Awning length ftm" in extractedData) {
      extractedData["Awning length ftm"] = splitAwningMeasurements(
        extractedData["Awning length ftm"]
      );
    }

    // Add the next data object to the file
    const outputFile =
      extractedData.Make.toLowerCase().replace(/\s+/g, "-") + ".json";
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
})();
