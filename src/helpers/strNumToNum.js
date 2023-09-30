/**
 * Converts a string representation of a number to a number, while keeping the value unchanged if it's already a number.
 *
 * @param {string | number | undefined} value - The value to be converted. If it's a string, it should represent a number (e.g., "1,000" or "1000" would both convert to 1000). If it's a number or undefined, it remains unchanged.
 * @throws Will throw an error if the input is not a string, number, or undefined.
 * @returns {number | undefined} The converted number, or the original value if it was a number or undefined to begin with.
 *
 * @example
 * strNumToNum("1,000");  // returns 1000
 * strNumToNum(1000);     // returns 1000
 * strNumToNum(undefined);// returns undefined
 */
export default function strNumToNum(value) {
  if (typeof value == "number" || typeof value == "undefined") {
    return value;
  } else if (typeof value == "string") {
    return parseFloat(value.replace(",", ""));
  }

  throw new Error("Invalid type for strNumToNum input");
}
