/**
 * Retrieves the last segment of the URL path.
 *
 * @param {string} url - The URL from which to extract the last segment.
 * @returns {string} - Returns the last segment of the URL path.
 */
export default function getLastUrlSegment(url) {
  const urlObj = new URL(url);
  const pathSegments = urlObj.pathname
    .split("/")
    .filter((segment) => segment !== "");
  const urlTail = pathSegments.slice(-1)[0];
  return urlTail;
}
