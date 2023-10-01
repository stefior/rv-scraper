import readline from "readline";

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
            if (answer.trim().includes("null")) {
              rl.close();
              resolve(null);
            } else if (answer.trim() === "") {
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
 * Fetches or prompts the user to provide domain-specific selector
 * values for a given domain, which are used to scrape data from that domain.
 *
 * It first checks if the domain is already known by looking up the hostname in the provided
 * knownDomainMappings object. If found, it returns the known selectors for that domain.
 * If not found, it prompts the user to provide these selectors, saves them to knownDomainMappings,
 * and then returns them.
 *
 * @param {object} knownDomainMappings - An object where keys are hostnames and values are objects
 * containing domain-specific selector strings.
 * @param {Window} window - A reference to the browser window object.
 *
 * @returns {Promise<Array<string|null>>} - A promise that resolves to an array of
 * domain-specific selector strings or null values for the current domain.
 *
 * @example
 *
 * const knownMappings = {
 *   'example.com': {
 *     Make: 'div.make',
 *     typeSelector: 'div.type',
 *     modelSelector: 'div.model',
 *     trimSelector: 'div.trim',
 *     imageSelector: 'img.main',
 *     descriptionSelector: 'div.description'
 *     knownDomainMappings: {}
 *   }
 * };
 *
 * setupAndSaveSiteSelectors(knownMappings, window)
 *   .then(selectors => {
 *     console.log(selectors);
 *   });
 */
export default async function setupAndSaveSiteSelectors(
  knownDomainMappings,
  window
) {
  const hostName = window.location.hostname
    .toLowerCase()
    .split(".")
    .reverse()[1];

  let siteMapping;

  if (hostName in knownDomainMappings) {
    siteMapping = knownDomainMappings[hostName];
  } else {
    console.log(`Enter site selectors for new domain (${window.origin})`);

    // Initialize a new object for this host
    siteMapping = {
      Make: await promptUser("Make"),
      typeSelector: await promptUser("typeSelector"),
      modelSelector: await promptUser("modelSelector"),
      trimSelector: await promptUser("trimSelector"),
      imageSelector: await promptUser("imageSelector"),
      descriptionSelector: await promptUser("descriptionSelector"),
      knownKeyMappings: {},
    };

    // Save the new siteMapping object back to knownDomainMappings
    knownDomainMappings[hostName] = siteMapping;
  }

  return [
    siteMapping.Make,
    siteMapping.typeSelector,
    siteMapping.modelSelector,
    siteMapping.trimSelector,
    siteMapping.imageSelector,
    siteMapping.descriptionSelector,
  ];
}
