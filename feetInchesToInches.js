/**
 * Converts a string representing a measurement in feet and inches to just inches.
 *
 * @param {string} feetInches - The measurement to convert, formatted as a variation of X\' Y".
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
 * feetInchesToInches("8'")
 * // returns 96
 * 
 * This function is useful for when database's field only takes inches (e.g. Width).
 */
export default function feetInchesToInches(feetInches) {
  const pattern = /^(\d+\.?0?)'\s*(\.\d+|\d+\.?\d*)?(?:''|")?$/;
  const matches = feetInches.match(pattern);
  if (!matches) throw new Error("Invalid input format");

  const feet = parseInt(matches[1]);
  const inches = matches[2] ? parseFloat(matches[2]) : 0;

  return feet * 12 + inches;
}
