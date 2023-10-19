import isUrlValid from "./isUrlValid.js"

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
export default function getRvTypeFromUrl(url, rvTypePatterns) {
  isUrlValid(url);
  const lowerCaseUrl = url.toLowerCase();

  let result = "";
  let isToyHauler = false;
  for (const [rvType, pattern] of Object.entries(rvTypePatterns)) {
    if (pattern.test(lowerCaseUrl)) {
      if (rvType === "Toy Hauler") {
        isToyHauler = true;
        continue;
      }
      result = rvType;
    }
  }

  if (!isToyHauler) return result;
  if (result !== "") return `${result} Toy Hauler`;
}
