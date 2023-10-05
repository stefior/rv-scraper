import fs from "fs";

/**
 * Saves the domain mappings to a JSON file. This function attempts to write the `domainsMappings`
 * object to a file named `domain-mappings.json`. If the write operation fails, an error is thrown.
 *
 * @param {Object} domainsMappings - The object containing domain mappings to be saved.
 * @throws Will throw an error if it fails to write the domain mappings to the file.
 *
 * @example
 * const domainsMappings = { "example.com": { Make: "make-selector", Model: "model-selector" } };
 * saveDomainMappings(domainsMappings);
 * // The known domain mappings are now saved to a file named `domain-mappings.json`.
 */
export default function saveDomainMappings(domainsMappings) {
  try {
    fs.writeFileSync(
      "domains-mappings.json",
      JSON.stringify(domainsMappings, null, 2)
    );
  } catch (err) {
    throw new Error(
      `Failed to write new known domain mappings to file: ${err.message}`
    );
  }
}
