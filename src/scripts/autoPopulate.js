import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import "dotenv/config";

import isUrlValid from "../helpers/isUrlValid.js";

/**
 * Validates the parameters required for the autoPopulate function.
 *
 * @param {string} inputFile - Path to the input file.
 * @param {string} loginUrl - URL for login.
 * @param {string} formPageUrl - URL for the form page.
 * @returns {boolean} Returns true if all parameters are valid, false otherwise.
 */
function validateParameters(inputFile, jsonString, loginUrl, formPageUrl) {
  if (!fs.existsSync(inputFile)) {
    console.error("Input file not found");
    return false;
  }
  try {
    JSON.parse(jsonString);
  } catch (err) {
    console.error("Input file is not valid JSON");
    return false;
  }

  if (!isUrlValid(loginUrl)) {
    console.error("Invalid URL format");
    return false;
  }

  if (typeof formPageUrl !== "string") {
    console.error("formPageUrl must be a string");
    return false;
  }

  return true;
}

/**
 * Navigates to a login page and performs a sign-in operation using credentials
 * from environment variables. This function assumes the login form contains
 * fields for email and password, and a submit button.
 *
 * @async
 * @function
 * @param {puppeteer.Page} page - The puppeteer page object.
 * @param {string} loginUrl - The URL of the login page.
 *
 * @example
 * const page = await browser.newPage();
 * await signIn(page, 'https://example.com/login');
 */
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

/**
 * Pastes a given text into a specified page element. This function operates
 * faster compared to typing the text in, as it sets the value property of the
 * element directly.
 *
 * @async
 * @function
 * @param {puppeteer.ElementHandle} el - The puppeteer element handle.
 * @param {string} val - The text value to paste into the element.
 *
 * @example
 * const inputElement = await page.$('input[name="username"]');
 * await pasteText(inputElement, 'exampleUser');
 */
async function pasteText(el, val) {
  // It's faster to set the value of the element than having it type it in
  await el.evaluate((element, value) => {
    if (!element) return;
    return (element.value = String(value));
  }, val);
}

/**
 * Navigates to a form page, and fills out the form with the data from a provided object.
 *
 * @async
 * @function
 * @param {Object} page - The Puppeteer page object.
 * @param {string} formPageUrl - The URL of the page containing the form to be filled out.
 * @param {Object} dataObject - An object containing the data to populate the form with.
 * @param {Object} standardizedValues - An object containing standardized values for certain form fields.
 * @throws Will throw an error if there are unexpected keys in the data object that do not correspond to any fields in the form, or if other issues arise while interacting with the page.
 * @returns {Promise<void>} Returns a promise that resolves when the form has been filled out.
 */
async function fillInForm(page, formPageUrl, dataObject, standardizedValues) {
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
        const filePath = path.resolve("./output/images", value + ".png");
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
  // commented out due to it being unnecessary
  // if (unexpectedKeys.length > 0) {
  //   throw new Error(
  //     `\nThere are field names in the database that aren't in known options.\nEither they were renamed or added.\nKeys: ${unexpectedKeys.toString()}`
  //   );
  // }
}

/**
 * This clicks on a button to trigger an AI to generate a description,
 * and waits for the AI to fill a text area with the generated description.
 *
 * @async
 * @function
 * @param {puppeteer.Page} page - The puppeteer page object.
 * @param {string} aiButtonSelector - The CSS selector for the button which triggers AI description generation.
 * @param {string} aiDescriptionSelector - The CSS selector for the text area where AI writes the description.
 *
 * @throws Will throw an error if the AI button is not found.
 * @throws Will throw an error if there's an issue with AI description generation or submission.
 *
 * @example
 * const page = await browser.newPage();
 * const aiButtonSelector = "#generate_desc";
 * const aiDescriptionSelector = "textarea[name=desc_html]";
 * await generateAiDescription(page, aiButtonSelector, aiDescriptionSelector);
 */
async function generateAiDescription(
  page,
  aiButtonSelector,
  aiDescriptionSelector
) {
  const aiButton = await page.$(aiButtonSelector);
  if (!aiButton) {
    throw new Error("AI button not found");
  }

  try {
    await aiButton.click();
    // Wait for AI to fill in the textbox before moving on
    await page.waitForNetworkIdle();

    await page.waitForFunction(
      (selector) => {
        return document.querySelector(selector).value.length > 0;
      },
      { timeout: 60000 }, // 60 seconds
      aiDescriptionSelector
    );
  } catch (err) {
    throw new Error(
      `Error with AI description generation or submission: ${err.message}`
    );
  }
}

/**
 * Submits a form on a given page, waits for a success confirmation, and logs the submission.
 *
 * @async
 * @function
 * @param {Object} page - Puppeteer page object.
 * @param {string} rvName - The name of the RV being submitted.
 * @param {string} publishButtonSelector - The selector for the form's publish button.
 * @param {string} confirmationDivSelector - The selector for the confirmation div displaying a successful submission message.
 * @throws Will throw an error if the publish button is not found or if the form fails to submit.
 * @returns {Promise<void>} Returns a promise that resolves when the function has completed.
 */
async function submitForm(
  page,
  rvName,
  publishButtonSelector,
  confirmationDivSelector
) {
  const publishButton = await page.$(publishButtonSelector);
  if (!publishButton) {
    throw new Error(`Publish button not found: ${err.message}`);
  }
  await publishButton.click();

  function sleep(seconds) {
    const ms = seconds * 1000;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Wait for success confirmation before either moving on or aborting after 60 seconds
  try {
    // Necessary for page.waitForFunction() to detect the submission 100% of the time
    await sleep(2);
    
    await page.waitForFunction(
      (selector) => {
        const textContent = document.querySelector(selector).textContent;
        return textContent.includes("added successfully");
      },
      { timeout: 60000 }, // 60 seconds
      confirmationDivSelector
    );
    console.log(`    Submitted form for "${rvName}"`);
  } catch (err) {
    throw new Error(
      `Form likely failed to submit for "${rvName}": ${err.message}`
    );
  }
}

/**
 * Automatically populates a form on a specified webpage with data from a provided JSON file,
 * optionally generates an AI description, and submits the form.
 *
 * @async
 * @function
 * @param {Object} params - The parameters for auto-population.
 * @param {string} params.inputFile - The path to the JSON file containing the data to populate the form with.
 * @param {string} params.loginUrl - The URL to the login page.
 * @param {string} params.formPageUrl - The URL to the page containing the form to be populated.
 * @param {Object} params.standardizedValues - An object containing standardized values for certain form fields.
 * @throws Will throw an error if validation fails, if there's an issue with browser/page initialization, or if form submission fails.
 * @returns {Promise<void>} Returns a promise that resolves when all forms have been successfully submitted.
 *
 * @example
 * await autoPopulate({
 *   inputFile: './data.json',
 *   loginUrl: 'https://example.com/login',
 *   formPageUrl: 'https://example.com/form',
 *   standardizedValues: { ... }
 * });
 */
export default async function autoPopulate({
  inputFile,
  loginUrl,
  formPageUrl,
  standardizedValues,
}) {
  const jsonString = fs.readFileSync(inputFile, "utf8");
  if (!validateParameters(inputFile, jsonString, loginUrl, formPageUrl)) return;

  const jsonData = JSON.parse(jsonString);
  console.log(`Populating database with the contents of "${inputFile}" ...`);

  // NEEDS TO BE HEADFUL for uploading images to work
  const browser = await puppeteer.launch({ headless: false });
  let page = await browser.newPage();

  await signIn(page, loginUrl);
  // New page in order to bypass possible auto-opened dialog box after submitting
  page = await browser.newPage();

  for (const dataObject of jsonData) {
    await fillInForm(page, formPageUrl, dataObject, standardizedValues);

    // Click a button to generate AI description with inputted data, if there isn't one already
    const aiButtonSelector = "#generate_desc";
    const aiDescriptionSelector = "textarea[name=desc_html]";
    if (!jsonData["Web Description"]) {
      await generateAiDescription(
        page,
        aiButtonSelector,
        aiDescriptionSelector
      );
    }

    // Form submission
    const publishButtonSelector =
      "button[type=submit].btn.btn-primary.pull-right";
    const confirmationDivSelector = "div.x_title";
    await submitForm(
      page,
      dataObject.Name,
      publishButtonSelector,
      confirmationDivSelector
    );
  }

  console.log("--Finished submitting all successfully--");
  await browser.close();
}

const standardizedValues = JSON.parse(
  fs.readFileSync("./standardized-values.json", "utf-8")
);
autoPopulate({
  // inputFile: "./output/testing.json",
  // formPageUrl: "http://localhost:5500/testing.html",
  standardizedValues,
});
