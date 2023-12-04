import parseTireCode from "../helpers/parseTireCode";

describe("parseTireCode", () => {
  it("should parse a valid tire code and return the correct data", () => {
    const tireCode = "ST205/75R15";
    const result = parseTireCode(tireCode);
    expect(result).toEqual({
      tireCode,
      vehicleClass: "ST",
      sectionWidthMM: 205,
      sectionWidthIn: 8.1,
      aspectRatio: 0.75,
      construction: "R",
      wheelDiameterIn: 15,
      tireDiameterIn: 27.2,
    });
  });

  it("should throw an error for an invalid tire code", () => {
    const invalidTireCode = "InvalidCode123";
    expect(() => parseTireCode(invalidTireCode)).toThrow(
      "Invalid tire code format"
    );
  });

  it("should handle tire codes without a vehicle class", () => {
    const tireCode = "205/75R15";
    const result = parseTireCode(tireCode);
    expect(result).toEqual({
      tireCode,
      vehicleClass: "",
      sectionWidthMM: 205,
      sectionWidthIn: 8.1,
      aspectRatio: 0.75,
      construction: "R",
      wheelDiameterIn: 15,
      tireDiameterIn: 27.2,
    });
  });

  it("should handle tire codes with an optional space", () => {
    const tireCode = "ST205/75 R15";
    const result = parseTireCode(tireCode);
    expect(result).toEqual({
      tireCode,
      vehicleClass: "ST",
      sectionWidthMM: 205,
      sectionWidthIn: 8.1,
      aspectRatio: 0.75,
      construction: "R",
      wheelDiameterIn: 15,
      tireDiameterIn: 27.2,
    });
  });

  it("should handle tire codes with a two-digit aspect ratio", () => {
    const tireCode = "ST205/70R15";
    const result = parseTireCode(tireCode);
    expect(result).toEqual({
      tireCode,
      vehicleClass: "ST",
      sectionWidthMM: 205,
      sectionWidthIn: 8.1,
      aspectRatio: 0.7,
      construction: "R",
      wheelDiameterIn: 15,
      tireDiameterIn: 26.3,
    });
  });

  it("should handle tire codes with no construction type specified", () => {
    const tireCode = "ST205/75R15";
    const result = parseTireCode(tireCode);
    expect(result).toEqual({
      tireCode,
      vehicleClass: "ST",
      sectionWidthMM: 205,
      sectionWidthIn: 8.1,
      aspectRatio: 0.75,
      construction: "R",
      wheelDiameterIn: 15,
      tireDiameterIn: 27.2,
    });
  });

  it("should handle tire codes with different vehicle class", () => {
    const tireCode = "LT205/75R15";
    const result = parseTireCode(tireCode);
    expect(result).toEqual({
      tireCode,
      vehicleClass: "LT",
      sectionWidthMM: 205,
      sectionWidthIn: 8.1,
      aspectRatio: 0.75,
      construction: "R",
      wheelDiameterIn: 15,
      tireDiameterIn: 27.2,
    });
  });

  it("should handle tire codes with three-digit aspect ratio", () => {
    const tireCode = "ST205/100R15";
    const result = parseTireCode(tireCode);
    expect(result).toEqual({
      tireCode,
      vehicleClass: "ST",
      sectionWidthMM: 205,
      sectionWidthIn: 8.1,
      aspectRatio: 1,
      construction: "R",
      wheelDiameterIn: 15,
      tireDiameterIn: 31.2,
    });
  });

  it("should handle only the first part of tire codes", () => {
    const tireCode = "ST205";
    const result = parseTireCode(tireCode);
    expect(result).toEqual({
      tireCode,
      vehicleClass: "ST",
      sectionWidthMM: 205,
      sectionWidthIn: 8.1,
      aspectRatio: 1,
      construction: "R",
      wheelDiameterIn: 15,
      tireDiameterIn: 31.2,
    });
  });
});
