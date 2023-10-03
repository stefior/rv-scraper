import feetInchesToInches from "./feetInchesToInches.js";
import strNumToNum from "./strNumToNum.js";
import { SentimentAnalyzer } from "node-nlp";

/**
 * Function to format the input value based on the specified type.
 * The function transforms the input value to a standard unit or format based on
 * the type specified in the standardizedValues object for the given property.
 *
 * @param {Object} property - An object representing the property to be formatted.
 * @param {string} property.key - The key representing the name of the property.
 * @param {any} property.value - The value of the property to be formatted.
 * @param {Object} standardizedValues - The object containing the keys mapped to their associated units or types.
 *
 * @returns {any} - The formatted value, converted to the specified type or unit, or the original value if no conversion is required.
 *
 * @throws Will throw an error if an unknown formatting type is encountered.
 *
 * @example
 *   const property = { key: 'Water heater tank capacity gl', value: '10 cu ft' };
 *   const standardizedValues = { 'Water heater tank capacity gl': 'gallons' };
 *   formatValue(property, standardizedValues);  // returns 748.1
 */
export default function formatValue(property, standardizedValues) {
  const type = standardizedValues[property.key];
  const value = property.value;

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
        `Unknown formatting type: ${type} for key: ${property.key}`
      );
    }
  }
}
