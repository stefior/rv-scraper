import readline from "readline";

import saveDomainMappings from "./saveDomainMappings.js";

/**
 * Prompts the user to input a selector for a specified selector variable via the console.
 * If the user inputs 'null', the function resolves to null.
 * If the user inputs an empty string, they will be re-prompted until a non-empty value or 'null' is entered.
 *
 * @param {string} variableName - The name of the variable the user is being prompted to provide a value for.
 * @returns {Promise<string|null>} A promise that resolves to the user's input or null.
 * @throws Will throw an error if there's an issue during prompting.
 *
 * @example
 * const userValue = await promptUser('someVariable');
 */
function promptForValue(variableName) {
  return new Promise((resolve, reject) => {
    try {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      function ask() {
        rl.question(
          `Please enter a value for ${variableName}, or else null:\n    `,
          (selector) => {
            selector = selector.trim();

            if (selector.includes("null")) {
              rl.close();
              resolve(null);
            } else if (selector === "") {
              console.log("\nInput cannot be empty. Please try again.");
              ask();
            } else {
              rl.close();
              resolve(selector);
            }
          }
        );
      }

      ask();
    } catch (err) {
      reject(`Prompting issue: ${err}`);
    }
  });
}

/**
 * @typedef {Object} siteMappings
 * @property {string} Make - The make of the RV.
 * @property {string} yearSelector - CSS Selector for the year field.
 * @property {string} typeSelector - CSS Selector for the type field.
 * @property {string} modelSelector - CSS Selector for the model field.
 * @property {string} modelEval - JS string to evaluate to set the model text.
 * @property {string} trimSelector - CSS Selector for the trim field.
 * @property {string} imageSelector - CSS Selector for the image field.
 * @property {string} descriptionSelector - CSS Selector for the description field.
 * @property {string} rowSelector - CSS Selector for rows or row-like elements in a table of data.
 * @property {string} dlSelector - CSS Selector for a dl element to extract the data from.
 * @property {string} webFeaturesSelector - CSS Selector for the web features field.
 * @property {string} webFeaturesEval - JS string to set the web features text.
 * @property {Object} knownKeyMappings - An object mapping site-specific keys to standardized keys.
 */

/**
 * Sets up and adds site selectors for a specified domain.
 * If the domain is known, the function retrieves the existing site selectors from the domainsMappings object.
 * If the domain is new, the function prompts the user to provide the necessary selectors and adds them to the domainsMappings object.
 *
 * @param {Object} domainsMappings - An object containing mappings of host names to site selectors.
 * @param {string} secondLevelDomain - The second level domain name for the site in which to set up or retrieve site selectors.
 * @returns {Promise<siteMappings>} A promise that resolves to an object containing the site selectors for the specified domain.
 * @throws Will throw an error if there is a problem during the user prompting process.
 *
 * @example
 * const siteSelectors = await setupSiteSelectors(knownMappings, 'example.com');
 */
export default async function setupSiteSelectors(
  domainsMappings,
  secondLevelDomain
) {
  let siteMappings;

  if (secondLevelDomain in domainsMappings) {
    siteMappings = domainsMappings[secondLevelDomain];
  } else {
    console.log(
      `\nEnter variable values for new domain: "${secondLevelDomain}"\n`
    );

    // Initialize a new object for this host
    siteMappings = {
      Make: await promptForValue("Make"),
      makeSelector: await promptForValue("makeSelector"),
      yearSelector: await promptForValue("yearSelector"),
      typeSelector: await promptForValue("typeSelector"),
      modelSelector: await promptForValue("modelSelector"),
      modelEval: await promptForValue("modelEval"),
      trimSelector: await promptForValue("trimSelector"),
      imageSelector: await promptForValue("imageSelector"),
      descriptionSelector: await promptForValue("descriptionSelector"),
      rowSelector: await promptForValue("rowSelector"),
      dlSelector: await promptForValue("dlSelector"),
      optionsSelector: await promptForValue("optionsSelector"),
      webFeaturesSelector: await promptForValue("webFeaturesSelector"),
      webFeaturesEval: await promptForValue("webFeaturesEval"),
      keyMappings: {},
    };

    // Save the new siteMappings object back to domainsMappings
    domainsMappings[secondLevelDomain] = siteMappings;
    saveDomainMappings(domainsMappings);
  }

  return siteMappings;
}
