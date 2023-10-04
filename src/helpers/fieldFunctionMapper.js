import fs from "fs";
import backupFile from "./backupFile";

/**
 * Maps a function to each record in a JSON file.
 *
 * This function reads a JSON file, applies a specified function to each record in the JSON array,
 * and then writes the modified data back to the file, also creating a backup of the original file.
 *
 * @param {string} inputFile - The path to the input JSON file.
 * @param {Function} func - The function to apply to each record. This function should take a single
 * argument, which is an object representing a record, and modify it in-place.
 *
 * @throws {Error} If the input file does not exist or if the func argument is not a function.
 * @throws {Error} If there is an error while modifying the JSON data or while writing the data back to the file.
 *
 * @example
 * fieldFunctionMapper("input.json", (obj) => {
 *   obj["Name"] = `${obj.Year} ${obj.Make} ${obj.Model} ${obj.Trim}`;
 * });
 */
export default function fieldFunctionMapper(inputFile, func) {
  if (!fs.existsSync(inputFile)) throw new Error("Input file does not exist");
  if (typeof func !== "function")
    throw new Error("func needs to be a function");

  const jsonData = JSON.parse(fs.readFileSync(inputFile, "utf8"));

  try {
    jsonData.forEach((record) => {
      func(record);
    });
  } catch (err) {
    throw new Error(`Error editing JSON: ${err}`);
  }

  try {
    backupFile(inputFile, "./backups");
    fs.writeFileSync(inputFile, JSON.stringify(jsonData), "utf-8");
  } catch (err) {
    throw new Error(`Error backing up & writing to file: ${err}`);
  }
}
