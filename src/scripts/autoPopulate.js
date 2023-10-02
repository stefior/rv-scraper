import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import "dotenv/config";

import isUrlValid from "../helpers/isUrlValid.js";

async function signIn(page, loginUrl) {
  await page.goto(loginUrl);

  const emailInput = await page.$("input[type=email]");
  await emailInput.focus();
  await emailInput.type(process.env.EMAIL);

  const passwordInput = await page.$("input[type=password]");
  await passwordInput.focus();
  await passwordInput.type(process.env.PASSWORD);

  const logInButton = await page.$("input[type=submit]");
  await logInButton.click();
}

async function pasteText(el, val) {
  // It's faster to set the value of the element than having it type it in
  await el.evaluate((element, value) => {
    if (!element) return;
    return (element.value = String(value));
  }, val);
}

export default async function autoPopulate({
  inputFile,
  loginUrl,
  formPageUrl,
  standardizedValues,
}) {
  if (!fs.existsSync(inputFile)) {
    console.error("Input file not found");
    return;
  }
  if (!isUrlValid(loginUrl)) {
    console.error("Invalid URL format");
    return;
  }
  if (typeof formPageUrl !== "string") {
    console.error("formPageUrl must be a string");
    return;
  }

  const jsonData = JSON.parse(fs.readFileSync(inputFile, "utf8"));
  console.log(`Populating database with the contents of "${inputFile} ..."`);

  // Needs to be headful for uploading images to work with this code
  const browser = await puppeteer.launch({ headless: false });
  let page = await browser.newPage();

  await signIn(page, loginUrl);
  page = await browser.newPage();

  for (const dataObject of jsonData) {
    await page.goto(formPageUrl);
    console.log(`Filling out form for "${dataObject.Name}"`);

    const trElements = await page.$$("tr");

    const unexpectedKeys = [];
    for (const trElement of trElements) {
      const tdElements = await trElement.$$("td");

      let key;
      for (const tdElement of tdElements) {
        const textContent = await page.evaluate(
          (el) => el.textContent.trim(),
          tdElement
        );

        if (textContent && textContent in dataObject) {
          key = textContent;
        } else if (
          textContent &&
          !textContent.includes("Generate AI Description") &&
          !(textContent in standardizedValues) &&
          !unexpectedKeys.includes(textContent)
        ) {
          unexpectedKeys.push(textContent);
        }
      }

      const value = dataObject[key];
      if (key === "Floor plan") {
        await page.waitForSelector("input[name=floor_plan][type=file]");
        const fileInputElement = await trElement.$(
          "input[name=floor_plan][type=file]"
        );
        if (fileInputElement) {
          const filePath = path.resolve("images", value + ".png");
          if (fs.existsSync(filePath)) {
            await fileInputElement.focus();
            await fileInputElement.uploadFile(filePath);
          } else {
            console.error("File does not exist: ", filePath);
          }
        }
      } else if (key === "Web Features" || key === "Web Description") {
        const inputElement = await trElement.$("textarea");
        await pasteText(inputElement, value);
      } else if (key) {
        const inputElement = await trElement.$("input[type=text]");
        await pasteText(inputElement, value);
      }
    }
    if (unexpectedKeys.length > 0) {
      throw new Error(
        `\nThere are field names in the database that aren't in known options.\nEither they were renamed or added.\nKeys: ${unexpectedKeys.toString()}`
      );
    }

    // Click a button to generate AI description with inputted data, if there isn't one already
    if (!jsonData["Web Description"]) {
      const generateAiDescriptionButton = await page.$("#generate_desc");
      const aiDescriptionSelector = `textarea[name = "desc_html"]`;

      try {
        await generateAiDescriptionButton.click();
        // Wait for AI to fill in the textbox before moving on
        await page.waitForFunction(
          (selector) => document.querySelector(selector).value.length > 0,
          aiDescriptionSelector
        );
      } catch (err) {
        throw new Error(`Error with AI description generation or submission`);
      }
    }

    // Submit form
    try {
      const publishButton = await page.$(
        "button[type=submit].btn.btn-primary.pull-right"
      );
      await publishButton.click();
    } catch (err) {
      throw new Error("Error finding publish button");
    }
    console.log(`Submitted form for "${dataObject.Name}"`);
    console.log("Pending confirmation ...   ");
    // Wait for success confirmation before either moving on or aborting after 30 seconds
    try {
      await page.waitForFunction(() =>
        document
          .querySelector(`div.x_title`)
          .textContent.includes("Data has been added successfully.")
      );
      console.log("-----Confirmed-----");
    } catch (err) {
      throw new Error("Form failed to submit");
    }
  }
  console.log("Finished all successfully");
  await browser.close();
}

const standardizedValues = {
  Year: "number",
  Make: "string",
  Model: "string",
  Trim: "string",
  Type: "string",
  "Generic type primary": "string",
  Name: "string",
  "Floor plan": "string",
  "Main image url": "string",
  "Regional availability": "string",
  "Basic warranty months": "number",
  "Structure warranty monthsmiles": "string",
  "Powertrain warranty monthsmiles": "string",
  "Chassis warranty monthsmiles": "string",
  "Basic warranty months": "number",
  "Engine type": "string",
  "Engine brand name": "string",
  Cylinders: "number",
  "Displacement l": "number",
  Turbocharged: "boolean",
  Supercharged: "boolean",
  "Horsepower bhpkw": "string",
  "Torque ft lbsnm": "poundfeet",
  "Fuel type": "string",
  "Us miles per gallon hwycity": "number",
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
  Tires: "number",
  "Rear tire diameter in": "inches",
  "Front tire diameter in": "inches",
  Brakes: "string",
  "Front brake type": "string",
  "Rear brake type": "string",
  "Anti lock brakes": "boolean",
  "Length ftft": "feet",
  "Length ftin": "feetinches",
  "Length closed inclosed ftclosed mmclosed m": "feetinches",
  "Width inmm": "inches",
  "Height in": "inches",
  "Height closed ftft": "feet",
  "Height closed ftin": "feetinches",
  "Interior height in": "inches",
  "Wheelbase inmm": "inches",
  "Gvwr lbskgs": "pounds",
  "Dry weight lbs": "pounds",
  "Fuel capacity gal": "gallons",
  "Number of fresh water holding tanks": "number",
  "Total fresh water tank capacity gall": "gallons",
  "Number of gray water holding tanks": "number",
  "Total gray water tank capacity gall": "gallons",
  "Number of black water holding tanks": "number",
  "Total black water tank capacity gall": "gallons",
  "Number of propane tanks": "number",
  "Total propane tank capacity gallbs": "gallons",
  "Water heater tank": "boolean",
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
  "Washer dryer": "string",
  Dishwasher: "boolean",
  "Garbage disposal": "boolean",
  "Draw bar": "boolean",
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
  "Refrigerator size": "cubic feet",
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
  "Reclining seats": "number",
  "Heated seat": "number",
  "Swivel seats": "number",
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
  "Awning length ftm": "feetinches",
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
autoPopulate({
  // inputFile: "./output/testing.json",
  // formPageUrl: "http://localhost:5500/populate-testing.html",
  // inputFile: "./output/outdoors-rv.json",

  // formPageUrl:

  standardizedValues,
});
