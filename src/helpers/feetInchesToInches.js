/**
 * Converts a string representing a measurement in feet and inches to just inches.
 *
 * @param {string} feetInches - The measurement to convert, formatted as a variation of X' Y" with optional text following.
 *
 * @throws Will throw an error if the input format is invalid.
 *
 * @returns {number} The measurement in inches.
 *
 * @example
 *
 * feetInchesToInches("8' 4\"")
 * // returns 100
 *
 * feetInchesToInches("8 ft 4 in")
 * // returns 100
 *
 * feetInchesToInches("8'")
 * // returns 96
 *
 * feetInchesToInches("8 ft.")
 * // returns 96
 *
 * feetInchesToInches("5' 1\" w/A/C")
 * // returns 61
 *
 * This function is useful for when a database's field only takes inches (e.g. Width).
 */
export default function feetInchesToInches(feetInches) {
  const pattern =
    /^(\d+\.?\d*)\s*(?:'|ft|ft\.)\s*(?:(\d+\.?\d*)\s*(?:''|"|in|in\.)?)?/i;
  const matches = feetInches.match(pattern);
  if (!matches) throw new Error("Invalid input format");

  const feet = parseFloat(matches[1]);
  const inches = matches[2] ? parseFloat(matches[2]) : 0;

  return feet * 12 + inches;
}
