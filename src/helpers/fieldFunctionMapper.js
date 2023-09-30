import fs from "fs";

/**
 * Applies a specified function to a specified key in each object within a JSON file, and writes the modified data back to the file.
 *
 * @param {string} inputFile - The path of the JSON file to be read and modified.
 * @param {string} keyToEdit - The key within each object that the provided function will be applied to.
 * @param {Function} func - The function to apply to the specified key in each object.
 *
 * @throws Will throw an error if the inputFile does not exist, if keyToEdit is not a string, if func is not a function, or if there are issues reading, editing, or writing the JSON data.
 *
 * @example
 *
 * // Assume `input.json` contains: [{ "age": "25" }, { "age": "30" }]
 * fieldFunctionMapper('input.json', 'age', age => parseInt(age, 10));
 * // `input.json` now contains: [{ "age": 25 }, { "age": 30 }]
 *
 */
export default function fieldFunctionMapper(inputFile, keyToEdit, func) {
  if (!fs.existsSync(inputFile)) throw new Error("Input file does not exist");
  if (typeof keyToEdit !== "string")
    throw new Error("keyToEdit needs to be a string");
  if (typeof func !== "function")
    throw new Error("func needs to be a function");

  const jsonData = JSON.parse(fs.readFileSync(inputFile, "utf8"));

  try {
    jsonData.forEach((record) => {
      record[keyToEdit] = func(record[keyToEdit]);
    });
  } catch (err) {
    throw new Error(`Error editing JSON: ${err}`);
  }

  try {
    fs.copyFileSync(inputFile, `${inputFile}.bak`);
    fs.writeFileSync(inputFile, JSON.stringify(jsonData), "utf-8");
  } catch (err) {
    throw new Error(`Error backing up & writing to file: ${err}`);
  }
}
