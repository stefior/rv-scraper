/**
 * Validates a given URL.
 *
 * This function checks if a given string is a valid URL. It uses the URL constructor
 * to parse the string and will return true if the string is a valid URL.
 * If the string is not a valid URL, it will throw an error indicating the invalid URL.
 * It will also throw an error if it is a URI instead of a URL.
 *
 *
 * @param {string} url - The URL string to validate.
 * @returns {boolean} - Returns true if the URL is valid, otherwise returns false.
 *
 * @example
 * isUrlValid('https://example.com'); // returns true
 * isUrlValid('invalid_url'); // throws Error
 */
export default function isUrlValid(url) {
  if (typeof url !== "string" || url.startsWith("data:")) {
    return false;
  }

  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}
