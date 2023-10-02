/**
 * Converts a string to title case, capitalizing the first letter of each word.
 *
 * @param {string} str - The string to be converted to title case.
 * @returns {string} The string converted to title case.
 * 
 * @example
 * toTitleCase("hello world"); // returns "Hello World"
 */
export default function toTitleCase(str) {
  return str.replace(/\w\S*/g, function (txt) {
    return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
  });
}
