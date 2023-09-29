/**
 * Parses a string containing awning measurements for RVs that have multiple awning lengths,
 * and formats them in a human-readable format.
 *
 * The function can handle input strings that specify measurements in feet or feet and inches.
 * The input string can include multiple measurements separated by spaces, and the function will return a string
 * that separates these measurements with " & ".
 *
 * @param {string} input - The string containing the awning measurements to be parsed.
 * @returns {string} A formatted string containing the parsed awning measurements, separated by " & ".
 *
 * @example
 * splitAwningMeasurements("8' 10'2\"");
 * // returns "8' & 10' 2\""
 *
 * This is useful for RVs that have multiple awning lengths.
 */
export default function splitAwningMeasurements(input) {
  const regex = /(\d+')(?:\s*(\d*)")?(?:\s*(\d*)'')?/g;
  const measurements = [];

  let match;
  while ((match = regex.exec(input))) {
    let measurement = `${match[1]}`; // The feet part with the "'" symbol

    let inches = 0;
    if (match[2]) {
      // If there are inches with double quotes
      inches += parseInt(match[2], 10);
    }
    if (match[3]) {
      // If there are inches with single quotes
      inches += parseInt(match[3], 10);
    }

    if (inches > 0) {
      measurement += ` ${inches}"`;
    }
    measurements.push(measurement);
  }

  return measurements.join(" & ");
}
