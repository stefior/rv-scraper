import fs from "fs";

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
