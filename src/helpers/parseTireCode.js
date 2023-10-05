/**
 * @typedef {Object} TireData
 * @property {string} tireCode - The original tire code string.
 * @property {string} vehicleClass - The vehicle class name or intended use of the tire.
 * @property {number} sectionWidthMM - The nominal section width of the tire in millimeters.
 * @property {number} sectionWidthIn - The nominal section width of the tire in inches.
 * @property {number} aspectRatio - The aspect ratio of the sidewall height as a decimal.
 * @property {string} construction - The construction type of the fabric carcass of the tire.
 * @property {number} wheelDiameterIn - The diameter of the wheel the tire is designed to fit, in inches.
 * @property {number} tireDiameterIn - The overall diameter of the tire, in inches.
 * @property {string} loadRange - The load range designation of the tire indicating its load carrying capacity and inflation limits.
 * @property {number} plyRating - The number of layers of rubber and fabric used in the construction of the tire.
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
 * //   vehicleClass: 'Special Trailer',
 * //   sectionWidthMM: 205,
 * //   sectionWidthIn: 8.1,
 * //   aspectRatio: 0.75,
 * //   construction: 'Radial',
 * //   wheelDiameterIn: 14,
 * //   tireDiameterIn: 26.2,
 * //   loadRange: 'D',
 * //   plyRating: 8
 * // }
 *
 * @see {@link https://stackoverflow.com/a/66211339 | StackOverflow Reference for the RegEx}
 */
export default function parseTireCode(tireCode) {
  const pattern =
    /(PT|LT|ST|T|)(\d{3})\/(\d{2,3})\/?\s?(B|D|R|)(\d{1,2})(?:LR)?([A-N]?)/;

     
  let matches = pattern.exec(tireCode);
  if (!matches) {
    console.error("ERROR: Invalid tire code format");
    return {
      tireCode,
      vehicleClass: null,
      sectionWidthMM: null,
      sectionWidthIn: null,
      aspectRatio: null,
      construction: null,
      wheelDiameterIn: null,
      tireDiameterIn: null,
      loadRange: null,
      plyRating: null,
    };
  }
  matches = Array.from(matches)

  const [
    ,
    vehicleClass,
    sectionWidthMM,
    aspectRatio,
    construction,
    wheelDiameterIn,
    loadRange,
  ] = matches;

  const vehicleClassMapping = {
    P: "Passenger Car",
    LT: "Light Truck",
    ST: "Special Trailer",
    T: "Temporary",
  };
  const vehicleClassTranslated = vehicleClassMapping[vehicleClass];

  const sectionWidthIn =
    Math.round((parseFloat(sectionWidthMM) / 25.4) * 10) / 10;

  const aspectRatioDecimal = parseFloat(aspectRatio) / 100;

  const loadRangeMapping = {
    B: "Bias belt",
    D: "Diagonal",
    R: "Radial",
    "": "Cross-ply",
  };
  const constructionTranslated = loadRangeMapping[construction];

  const loadRangeToPlyMapping = {
    A: 2,
    B: 4,
    C: 6,
    D: 8,
    E: 10,
    F: 12,
    G: 14,
    H: 16,
    J: 18,
    L: 20,
    M: 22,
    N: 24,
    "": undefined,
  };
  const plyRating = loadRangeToPlyMapping[loadRange];

  const tireDiameterIn =
    Math.round(
      (parseFloat(wheelDiameterIn) +
        2 * (sectionWidthIn * aspectRatioDecimal)) *
        10
    ) / 10;

  return {
    tireCode,
    vehicleClass: vehicleClassTranslated,
    sectionWidthMM: Number(sectionWidthMM),
    sectionWidthIn,
    aspectRatio: aspectRatioDecimal,
    construction: constructionTranslated,
    wheelDiameterIn: Number(wheelDiameterIn),
    tireDiameterIn,
    loadRange,
    plyRating,
  };
}
