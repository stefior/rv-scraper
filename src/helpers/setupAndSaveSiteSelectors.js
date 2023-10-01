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
          `Please enter a value for ${variableName}, or else undefined: `,
          (answer) => {
            if (answer.trim().includes("undefined")) {
              rl.close();
              resolve(undefined);
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
 * Fetches or prompts the user to provide site-specific selector
 * values for a given domain, which are used to scrape data from that domain.
 *
 * It first checks if the domain is already known by looking up the hostname in the provided
 * knownSiteMappings object. If found, it returns the known selectors for that domain.
 * If not found, it prompts the user to provide these selectors, saves them to knownSiteMappings,
 * and then returns them.
 *
 * @param {object} knownSiteMappings - An object where keys are hostnames and values are objects
 * containing site-specific selector strings.
 * @param {Window} window - A reference to the browser window object.
 *
 * @returns {Promise<Array<string|undefined>>} - A promise that resolves to an array of
 * site-specific selector strings or undefined values for the current domain.
 *
 * @example
 *
 * const knownMappings = {
 *   'example.com': {
 *     Make: 'div.make',
 *     typeSelector: 'div.type',
 *     modelSelector: 'div.model',
 *     trimSelector: 'div.trim',
 *     imageSelector: 'img.main'
 *   }
 * };
 *
 * setupAndSaveSiteSelectors(knownMappings, window)
 *   .then(selectors => {
 *     console.log(selectors);
 *   });
 */
export default async function setupAndSaveSiteSelectors(
  knownSiteMappings,
  window
) {
  const hostName = window.location.hostname
    .toLowerCase()
    .split(".")
    .reverse()[1];

  if (hostName in knownSiteMappings) {
    const siteMapping = knownSiteMappings[hostName];
    return [
      siteMapping["Make"],
      siteMapping.typeSelector,
      siteMapping.modelSelector,
      siteMapping.trimSelector,
      siteMapping.imageSelector,
    ];
  } else {
    console.log(`Enter site selectors for new domain (${window.origin})`);
    knownSiteMappings[hostName] = [];
    const newSiteMapping = knownSiteMappings[hostName];
    newSiteMapping["Make"] = await promptUser("Make");
    newSiteMapping.typeSelector = await promptUser("typeSelector");
    newSiteMapping.modelSelector = await promptUser("modelSelector");
    newSiteMapping.trimSelector = await promptUser("trimSelector");
    newSiteMapping.imageSelector = await promptUser("imageSelector");

    return [
      newSiteMapping.Make,
      newSiteMapping.typeSelector,
      newSiteMapping.modelSelector,
      newSiteMapping.trimSelector,
      newSiteMapping.imageSelector,
    ];
  }
}
