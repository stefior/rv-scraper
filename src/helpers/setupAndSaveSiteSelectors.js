import readline from "readline";

/**
 * Prompts the user to input a value for a specified variable via the console.
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
function promptUser(variableName) {
  return new Promise((resolve, reject) => {
    try {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      function ask() {
        rl.question(
          `Please enter a value for ${variableName}, or else null: `,
          (answer) => {
            answer = answer.trim()
            
            if (answer.includes("null")) {
              rl.close();
              resolve(null);
            } else if (answer === "") {
              console.log("Input cannot be empty. Please try again.");
              ask();
            } else {
              rl.close();
              resolve(answer);
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
 * Sets up and saves site selectors for a specified domain. 
 * If the domain is known, the function retrieves the existing site selectors from the knownDomainMappings object.
 * If the domain is new, the function prompts the user to provide the necessary selectors and saves them to the knownDomainMappings object.
 *
 * @param {Object} knownDomainMappings - An object containing mappings of host names to site selectors.
 * @param {string} hostName - The host name of the domain for which to set up or retrieve site selectors.
 * @returns {Promise<Object>} A promise that resolves to an object containing the site selectors for the specified domain.
 * @throws Will throw an error if there is a problem during the user prompting process.
 *
 * @example
 * const siteSelectors = await setupAndSaveSiteSelectors(knownMappings, 'example.com');
 */
export default async function setupAndSaveSiteSelectors(knownDomainMappings, hostName) {
  let siteMapping;

  if (hostName in knownDomainMappings) {
    siteMapping = knownDomainMappings[hostName];
  } else {
    console.log(`\nEnter site selectors for new domain: "${hostName}"`);

    // Initialize a new object for this host
    siteMapping = {
      Make: await promptUser("Make"),
      typeSelector: await promptUser("typeSelector"),
      modelSelector: await promptUser("modelSelector"),
      trimSelector: await promptUser("trimSelector"),
      imageSelector: await promptUser("imageSelector"),
      descriptionSelector: await promptUser("descriptionSelector"),
      webFeaturesSelector: await promptUser("webFeaturesSelector"),
      knownKeyMappings: {},
    };

    // Save the new siteMapping object back to knownDomainMappings
    knownDomainMappings[hostName] = siteMapping;
  }

  return siteMapping
}
