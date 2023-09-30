import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

import waitForUserInput from "../helpers/waitForUserInput.js";

/**
 * Automatically populates fields on a webpage with data from a JSON file using a non-headless browser.
 *
 * @param {string} inputFile - The path of the JSON file containing the data to be populated.
 * @param {string} formPageUrl - The URL of the webpage where the data is to be populated.
 *
 * @throws Will throw an error if the inputFile does not exist, if there's an issue reading the JSON data,
 *         or if there are issues interacting with the webpage or uploading files.
 *
 * @async
 * @example
 *

 * // Populates fields on the webpage at the specified URL with data from input.json.
 * // It will automatically open a new tab for each object in the JSON array.
 *
 */
export default async function autoPopulate(inputFile, formPageUrl) {
  const jsonData = JSON.parse(fs.readFileSync(inputFile, "utf8"));

  // Not headless so I can verify visually that each was posted without issue
  const browser = await puppeteer.launch({ headless: false });
  let page = await browser.newPage();

  let index = 0;
  for (const dataObject of jsonData) {
    await page.goto(formPageUrl);

    //   for (const [key, value] of Object.entries(dataObject)) {
    //     if (value === null || value === undefined || value === "") break;

    //     const trElements = await page.$$("tr");

    //     let found = false;
    //     for (const trElement of trElements) {
    //       const tdElements = await trElement.$$("td");

    //       for (const tdElement of tdElements) {
    //         const textContent = await page.evaluate(
    //           (el) => el.textContent,
    //           tdElement
    //         );

    //         if (textContent.includes(key)) {
    //           found = true;

    //           if (key === "Floor plan") {
    //             await page.waitForSelector("input[name=floor_plan][type=file]");
    //             const fileInputElement = await trElement.$(
    //               "input[name=floor_plan][type=file]"
    //             );
    //             if (fileInputElement) {
    //               const filePath = path.resolve("images", value + ".png");

    //               if (fs.existsSync(filePath)) {
    //                 await fileInputElement.focus();
    //                 await fileInputElement.uploadFile(filePath);

    //                 // Manually trigger a change event
    //                 await page.evaluate((inputElement) => {
    //                   const changeEvent = new Event("change", {
    //                     bubbles: true,
    //                   });
    //                   inputElement.dispatchEvent(changeEvent);
    //                 }, fileInputElement);
    //               } else {
    //                 console.error("File does not exist", filePath);
    //               }
    //             }
    //           } else {
    //             const inputElementHandle = await trElement.$(
    //               'input[type="text"]'
    //             );
    //             if (inputElementHandle) {
    //               await inputElementHandle.type(String(value));
    //             }
    //           }
    //           break;
    //         }
    //       }

    //       if (found) break;
    //     }

    //     if (!found) {
    //       console.error(`Key "${key}" not found on the page.`);
    //     }
    //   }

    // Click a button to generate AI description with inputted data,
    // if there isn't one already
    if (!jsonData["Web Description"]) {
      await page.waitForSelector("#generate_desc");
      const generateAiDescriptionButton = await page.$("#generate_desc");
      if (generateAiDescriptionButton) {
        await generateAiDescriptionButton.evaluate((button) => button.click());
      } else {
        throw new Error("Error triggering AI description button");
      }
      // Wait for AI to fill in the textbox before moving on
      await page.waitForFunction(
        () =>
          document.querySelector(`textarea[name = "desc_html"]`).value.length >
          0
      );
    }

    // Wait to be given the OK from stdin before moving on to the next one
    // (for debugging purposes, can be moved or commented out)
    const shouldContinue = await waitForUserInput();
    if (!shouldContinue) {
      console.log(`Operation aborted at url index ${index}`);
      return;
    }

    // Open a new tab for the next object, if needed
    if (index !== jsonData.length - 1) {
      page = await browser.newPage();
    }

    index++;
  }
}


const formPageUrl = "http://127.0.0.1:5500/testing.html";

autoPopulate("./output/testing.json", formPageUrl);
