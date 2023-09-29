/*
regex from: https://stackoverflow.com/questions/66210684/extracting-tire-sizes-using-regex-c-sharp
(PT|LT|ST|T|) - An optional letter (or letters) indicating the intended use or vehicle class for the tire
\d{3} - 3-digit number: The "nominal section width" of the tire in millimeters
/ - Slash character for character separation.
\d{2,3} - 2- or 3-digit number: The "aspect ratio" of the sidewall height as a percentage of the nominal section width of the tire
\s? - optional space
(B|D|R|) - An optional letter indicating the construction of the fabric carcass of the tire
\d{1,2} - 1- or 2-digit number: Diameter in inches of the wheel that the tires are designed to fit
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

console.log(parseTireCode("ST205/75R14D"));
