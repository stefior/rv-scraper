/**
 * @typedef {Object} TireData
 * @property {string} tireCode - The original tire code string.
 * @property {string} vehicleClass - The vehicle class or intended use of the tire.
 * @property {number} sectionWidthMM - The nominal section width of the tire in millimeters.
 * @property {number} sectionWidthIn - The nominal section width of the tire in inches.
 * @property {number} aspectRatio - The aspect ratio of the sidewall height as a decimal.
 * @property {string} construction - The construction type of the fabric carcass of the tire.
 * @property {number} wheelDiameterIn - The diameter of the wheel the tire is designed to fit, in inches.
 * @property {number} tireDiameterIn - The overall diameter of the tire, in inches.
 */

/**
 * Parses a given tire code string to extract and calculate tire dimensions and properties.
 *
 * @param {string} tireCode - The tire code string to be parsed.
 * @returns {TireData} An object containing the parsed and calculated tire properties.
 * @throws Will throw an error if the tire code format is invalid.
 *
 * @example
 *
 * parseTireCode('ST205/75R14D');
 * // Returns:
 * // {
 * //   tireCode: 'ST205/75R14D',
 * //   vehicleClass: 'ST',
 * //   sectionWidthMM: 205,
 * //   sectionWidthIn: 8.1,
 * //   aspectRatio: 0.75,
 * //   construction: 'R',
 * //   wheelDiameterIn: 14,
 * //   tireDiameterIn: 26.2
 * // }
 *
 * @see {@link https://stackoverflow.com/a/66211339 | StackOverflow Reference for the RegEx}
 */
export default function parseTireCode(tireCode) {
  const pattern = /(PT|LT|ST|T|)(\d{3})\/(\d{2,3})\s?(B|D|R|)(\d{1,2})/;
  let matches;
  try {
    matches = Array.from(pattern.exec(tireCode));
  } catch {
    throw new Error("Invalid tire code format");
  }

  const [
    ,
    vehicleClass,
    sectionWidthMM,
    aspectRatio,
    construction,
    wheelDiameterIn,
  ] = matches;

  const sectionWidthIn =
    Math.round((parseFloat(sectionWidthMM) / 25.4) * 10) / 10;

  const aspectRatioDecimal = parseFloat(aspectRatio) / 100;

  const tireDiameterIn =
    Math.round(
      (parseFloat(wheelDiameterIn) +
        2 * (sectionWidthIn * aspectRatioDecimal)) *
        10
    ) / 10;

  return {
    tireCode,
    vehicleClass,
    sectionWidthMM: Number(sectionWidthMM),
    sectionWidthIn,
    aspectRatio: aspectRatioDecimal,
    construction,
    wheelDiameterIn: Number(wheelDiameterIn),
    tireDiameterIn,
  };
}
