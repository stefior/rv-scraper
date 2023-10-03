import feetInchesToInches from "./feetInchesToInches.js";
import strNumToNum from "./strNumToNum.js";
import { SentimentAnalyzer } from "node-nlp";

const standardizedValues = {
  Year: "number",
  Make: "string",
  Model: "string",
  Trim: "string",
  Type: "string",
  "Generic type primary": "string",
  Name: "string",
  "Floor plan": "string",
  "Main image url": "string",
  "Regional availability": "string",
  "Basic warranty months": "number",
  "Structure warranty monthsmiles": "string",
  "Powertrain warranty monthsmiles": "string",
  "Chassis warranty monthsmiles": "string",
  "Engine type": "string",
  "Engine brand name": "string",
  Cylinders: "number",
  "Displacement l": "number",
  Turbocharged: "boolean",
  Supercharged: "boolean",
  "Horsepower bhpkw": "string",
  "Torque ft lbsnm": "poundfeet",
  "Fuel type": "string",
  "Us miles per gallon hwycity": "number",
  "Transmission type": "string",
  "Number of speeds": "number",
  "Transmission brand": "string",
  Overdrive: "boolean",
  "Driveline type": "string",
  "Number of axles": "number",
  Wheels: "number",
  "Wheels composition": "string",
  "Front wheel width in": "inches",
  "Rear wheel width in": "inches",
  Tires: "number",
  "Rear tire diameter in": "inches",
  "Front tire diameter in": "inches",
  Brakes: "string",
  "Front brake type": "string",
  "Rear brake type": "string",
  "Anti lock brakes": "boolean",
  "Length ftft": "feet",
  "Length ftin": "feetinches",
  "Length closed inclosed ftclosed mmclosed m": "feetinches",
  "Width inmm": "inches",
  "Height in": "inches",
  "Height closed ftft": "feet",
  "Height closed ftin": "feetinches",
  "Interior height in": "inches",
  "Wheelbase inmm": "inches",
  "Gvwr lbskgs": "pounds",
  "Dry weight lbs": "pounds",
  "Fuel capacity gal": "gallons",
  "Number of fresh water holding tanks": "number",
  "Total fresh water tank capacity gall": "gallons",
  "Number of gray water holding tanks": "number",
  "Total gray water tank capacity gall": "gallons",
  "Number of black water holding tanks": "number",
  "Total black water tank capacity gall": "gallons",
  "Number of propane tanks": "number",
  "Total propane tank capacity gallbs": "gallons",
  "Water heater tank": "boolean",
  "Water heater tank capacity gl": "gallons",
  Layout: "string",
  "Chassis model": "string",
  "Chassis brand": "string",
  "Body material": "string",
  "Freeze proof insulation": "boolean",
  "Number of doors": "number",
  "Number of slideouts": "number",
  "Power retractable slideout": "boolean",
  "Sky light": "boolean",
  "Roof vents": "number",
  Gps: "boolean",
  "Gps brand": "string",
  "Cruise control": "boolean",
  "Rear video backup camera": "boolean",
  Heater: "boolean",
  "Heater type": "string",
  "Air conditioning": "boolean",
  "Air conditioning type": "string",
  "Water heater pump power mode": "string",
  "Water heater tank bypass": "boolean",
  "Washer dryer": "string",
  Dishwasher: "boolean",
  "Garbage disposal": "boolean",
  "Draw bar": "boolean",
  "Leveling jacks": "number",
  "Leveling jack type": "string",
  "Power retractable entry steps": "boolean",
  "Voltage meter": "boolean",
  "Fresh water holding tank gauge": "boolean",
  "Gray water holding tank gauge": "boolean",
  "Black water holding tank gauge": "boolean",
  "Water pump power display": "boolean",
  "Propane tank gauge": "boolean",
  "Trailer level gauge": "boolean",
  "Kitchen location": "string",
  "Kitchen living area flooring type": "string",
  "Kitchen table configuration": "string",
  "Overhead fan": "boolean",
  "Microwave oven": "boolean",
  "Refrigerator size": "cubic feet",
  "Refrigerator power mode": "string",
  "Number of oven burners": "number",
  "Oven depth in": "inches",
  "Oven size btu": "btu",
  "Living area location": "string",
  "Number of sofas": "number",
  "Sofa material": "string",
  "Reclining sofa": "boolean",
  "Number of seats": "number",
  "Seat material": "string",
  "Seat armrests": "boolean",
  "Reclining seats": "number",
  "Heated seat": "number",
  "Swivel seats": "number",
  "Recliners rockers": "number",
  "Max sleeping count": "number",
  Bunkhouse: "boolean",
  "Expandable bunk": "boolean",
  "Number of bunk beds": "number",
  "Number of double beds": "number",
  "Number of full size beds": "number",
  "Number of queen size beds": "number",
  "Number of king size beds": "number",
  "Number of convertible sofa beds": "number",
  "Master bedroom location": "string",
  "Master bedroom flooring type": "string",
  "Full size master bedroom closet": "boolean",
  "Number of bathrooms": "number",
  "Bathroom location": "string",
  Toilet: "boolean",
  "Toilet type": "string",
  Shower: "boolean",
  "Bathroom sink": "boolean",
  "Bathroom mirror": "boolean",
  "Bathroom medicine cabinet": "boolean",
  "Bathroom vent fan system": "boolean",
  "Bathroom flooring type": "string",
  Battery: "boolean",
  Generator: "boolean",
  "Battery power converter": "boolean",
  "Solar battery charger": "boolean",
  "Cargo area battery charger": "boolean",
  "Ground fault plugs": "boolean",
  "Heat prewiring": "boolean",
  "Air conditioning prewiring": "boolean",
  "Cable prewiring": "boolean",
  "Tv antenna prewiring": "boolean",
  "Satellite prewiring": "boolean",
  "Phone prewiring": "boolean",
  "Washer dryer prewiring": "boolean",
  "Security alarm": "boolean",
  "Smoke detector": "boolean",
  "Propane alarm": "boolean",
  "Carbon monoxide detector": "boolean",
  "Number of emergency exits": "number",
  Satellite: "boolean",
  "Number of televisions": "number",
  "Cd player": "boolean",
  "Dvd player": "boolean",
  "Number of discs": "number",
  Speakers: "number",
  "Surround sound": "boolean",
  "Number of radios": "number",
  "Cb radio": "boolean",
  "Exterior entertainment system": "boolean",
  "Retractable roof antenna": "boolean",
  "Number of awnings": "number",
  "Power retractable awning": "boolean",
  "Awning length ftm": "feetinches",
  "Slideout awning": "boolean",
  "Exterior plugs": "number",
  "Exterior ladder": "boolean",
  "Exterior shower": "boolean",
  "Exterior grille": "boolean",
  "Exterior kitchen": "boolean",
  "Exterior window shade cover": "boolean",
  "Exterior flood lights": "boolean",
  "Exterior patio deck": "boolean",
  "Exterior patio deck location": "string",
  "Interior wood finish": "string",
  Wallpaper: "string",
  "Curtains shades": "boolean",
  "Storage capacity cuftgall": "cubic feet",
  "Cargo area height inmm": "inches",
  "Cargo area width inmm": "inches",
  "Cargo area side door": "boolean",
  "Cargo area rear door": "boolean",
  "Cargo area sink": "boolean",
  "Cargo area floor drain plug": "boolean",
  "Exterior cargo deck": "boolean",
  "Exterior cargo deck length inmm": "inches",
  "Exterior cargo deck width inmm": "inches",
  "Web Features": "string",
  "Web Description": "string",
};

export default function formatValue(key, value) {
  const type = standardizedValues[key];

  switch (type) {
    case "number": {
      return strNumToNum(value);
    }
    case "string": {
      return typeof value === "string" ? value : value.toString();
    }
    case "boolean": {
      if (value) {
        const sentiment = new SentimentAnalyzer({ language: "en" });
        sentiment.getSentiment(value).then((result) => {
          if (result.vote !== "negative") {
            return true;
          }
          return false;
        });
      }
      return false;
    }
    case "poundfeet": {
      const pattern = /nm|newton.*meters/i;
      if (pattern.test(value)) {
        const NM_TO_LBFT_CONVERSION_FACTOR = 0.737562;
        return strNumToNum(value) * NM_TO_LBFT_CONVERSION_FACTOR;
      } else {
        return strNumToNum(value);
      }
    }
    case "inches": {
      return feetInchesToInches(value);
    }
    case "feetinches": {
      const pattern =
        /(\d+\.?\d*)\s*(?:'|ft|ft\.)\s*(?:(\d+\.?\d*)\s*(?:''|"|in|in\.)?)?/i;
      let result = value.match(pattern)[0];
      return result ? result : value;
    }
    case "feet": {
      return Math.round((feetInchesToInches(value) / 12) * 10) / 10;
    }
    case "gallons": {
      const pattern = /cu\.?\s*ft/i;
      if (pattern.test(value)) {
        const CUFT_TO_GAL_CONVERSION_FACTOR = 7.481;
        return strNumToNum(value) * CUFT_TO_GAL_CONVERSION_FACTOR;
      } else {
        return strNumToNum(value);
      }
    }
    case "cubic feet": {
      const pattern = /gal\.?/i;
      if (pattern.test(value)) {
        const GAL_TO_CUFT_CONVERSION_FACTOR = 0.133681;
        return strNumToNum(value) * GAL_TO_CUFT_CONVERSION_FACTOR;
      } else {
        return strNumToNum(value);
      }
    }
    case "btu": {
      const tonPattern = /ton/i;
      const kwPattern = /kw|kilowatt/i;

      if (tonPattern.test(value)) {
        const TON_TO_BTU_CONVERSION_FACTOR = 12000;
        return strNumToNum(value) * TON_TO_BTU_CONVERSION_FACTOR;
      }

      if (kwPattern.test(value)) {
        const KW_TO_BTU_CONVERSION_FACTOR = 3412;
        return strNumToNum(value) * KW_TO_BTU_CONVERSION_FACTOR;
      }

      return strNumToNum(value);
    }
    default: {
      throw new Error(
        `Unknown formatting type: ${type} for key: ${key}`
      );
    }
  }
}
