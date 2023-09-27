import puppeteer from "puppeteer";
import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });

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

  for (const url of urls) {
    const page = await browser.newPage();

    await page.goto(url);

    const selector = "#detailed-standards-table1 > table";
    await page.waitForSelector(selector);
    const extractedData = await page.evaluate(() => {
      const rows = document.querySelectorAll("tbody tr");
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
        "Wheel Size",
        "Tire Size",
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

      // Saving the URL for reference
      data["URL"] = url;

      // Extracting the Model of the RV
      const modelElement = document.querySelector(
        "#subnav > ul > li.subnav-left__items__item.subnav-left__items__brand > div > span"
      );
      data["model"] = modelElement ? modelElement.textContent.trim() : null;

      // Extracting the Trim of the RV
      const trimElement = document.querySelector(
        "#subnav > ul > li.subnav-left__items__item.divide-x.dropdown > button > span"
      );
      data["trim"] = trimElement ? trimElement.textContent.trim() : null;

      // Hardcoded brand name
      data["brand"] = "Grand Design";

      // Extracting the image
      const imageElement = document.querySelector(
        "#floorplan-overhead > p > img"
      );
      if (imageElement) {
        data["imageURL"] = imageElement.src;
        data["imageFileName"] = `${data.model.replace(/\s/g, "_")}__${
          data.trim
        }`;
      } else {
        data["imageURL"] = null;
      }

      return data;
    });

    async function downloadAndConvertImage(url, filename) {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = path.extname(url).toLowerCase();

      // Ensure 'images' directory exists
      if (!fs.existsSync("images")) {
        fs.mkdirSync("images");
      }

      const savePath = path.join("images", `${filename}${ext}`);
      fs.writeFileSync(savePath, buffer);

      // Convert to PNG if not PNG
      if (ext !== ".png") {
        const pngPath = path.join("images", `${filename}.png`);
        exec(`magick ${savePath} ${pngPath}`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error converting image to PNG: ${error}`);
            return;
          }
          // Delete the original non-PNG image
          fs.unlinkSync(savePath);
        });
      }
    }

    await downloadAndConvertImage(
      extractedData.imageURL,
      extractedData.imageFileName
    );

    fs.appendFileSync("output.json", JSON.stringify(extractedData, null, 4));

    console.log(
      `Scraped and saved data for ${urls.indexOf(url) + 1} of ${
        urls.length + 1
      }`
    );

    await page.close();
  }

  await browser.close();
})();
