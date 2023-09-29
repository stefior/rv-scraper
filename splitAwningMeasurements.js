// For RVs that have multiple awning lengths
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
