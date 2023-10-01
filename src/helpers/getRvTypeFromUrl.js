function checkIfValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    throw new Error(`Invalid URL: ${err}`);
  }
}

/**
 * Extracts the RV type from a given URL based on predefined patterns.
 *
 * @param {string} url - The URL from which to extract the RV type.
 *
 * @returns {(string|undefined)} The RV type extracted from the URL, or undefined if the RV type could not be determined.
 *
 * @throws Throws an error if the URL format is invalid.
 *
 * @example
 * const rvType = getRvTypeFromUrl("https://www.granddesignrv.com/travel-trailers/solitude");
 * console.log(rvType);  // Outputs: "Travel Trailer"
 */
export default function getRvTypeFromUrl(url) {
  checkIfValidUrl(url);
  const lowerCaseUrl = url.toLowerCase();

  const rvTypePatterns = {
    "Travel Trailer": /travel[^a-zA-Z]{0,2}trailer/,
    "Fifth Wheel": /fifth[^a-zA-Z]{0,2}wheel/,
    "Toy Hauler": /toy[^a-zA-Z]{0,2}hauler/,
  };

  let result = "";
  for (const [rvType, pattern] of Object.entries(rvTypePatterns)) {
    if (pattern.test(lowerCaseUrl)) {
      result = rvType === "Toy Hauler" ? result + " " + rvType : rvType;
    }
  }

  if (result === " Toy Hauler" || result === "") return undefined;
  return result;
}
