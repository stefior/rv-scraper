import strNumToNum from "./strNumToNum.js";

/**
 * Calculates and fills in missing values among the fields 'Dry weight lbs', 'Gvwr lbskgs', and 'CCC' in the given record.
 * This function modifies the input record directly.
 *
 * @param {Object} record - The input record containing the fields that may need to be calculated.
 * @property {(string|number|undefined)} record["Dry weight lbs"] - The dry weight in pounds, if available.
 * @property {(string|number|undefined)} record["Gvwr lbskgs"] - The GVWR in pounds, if available.
 * @property {(string|number|undefined)} record["CCC"] - The cargo carrying capacity in pounds, if available.
 * 
 * @returns {Object} The input record with the missing fields filled in, if possible.
 * 
 * @example
 * 
 * const inputRecord = {
 *   "Dry weight lbs": "4000",
 *   "Gvwr lbskgs": undefined,
 *   "CCC": "2000"
 * };
 * 
 * const updatedRecord = addMissingGvwrUvwCcc(inputRecord);
 * console.log(updatedRecord); // { "Dry weight lbs": 4000, "Gvwr lbskgs": 6000, "CCC": 2000 }
 */
export default function addMissingGvwrUvwCcc(record) {
  record["Dry weight lbs"] = strNumToNum(record["Dry weight lbs"]);
  record["Gvwr lbskgs"] = strNumToNum(record["Gvwr lbskgs"]);
  record["CCC"] = strNumToNum(record["CCC"]);

  // gvwr - ccc = dry weight
  if (record["Gvwr lbskgs"] && record["CCC"]) {
    record["Dry weight lbs"] = record["Gvwr lbskgs"] - record["CCC"];
  }
  // dry weight + ccc = gvwr
  if (record["Dry weight lbs"] && record["CCC"]) {
    record["Gvwr lbskgs"] = record["Dry weight lbs"] + record["CCC"];
  }

  // gvwr - dry weight = ccc
  if (record["Gvwr lbskgs"] && record["Dry weight lbs"]) {
    record["CCC"] = record["Gvwr lbskgs"] - record["Dry weight lbs"];
  }
}

const test1 = {
  "Dry weight lbs": "4,915",
  "Gvwr lbskgs": "6,995",
};
const test2 = {
 'testing': '2',
 'test': 1
};
const test3 = {
  CCC: 2080,
  "Gvwr lbskgs": "6,995",
};

console.log(test1);
addMissingGvwrUvwCcc(test1);
console.log(test1);
console.log("");

console.log(test2);
addMissingGvwrUvwCcc(test2);
console.log(test2);
console.log("");

console.log(test3);
addMissingGvwrUvwCcc(test3);
console.log(test3);
console.log("");
