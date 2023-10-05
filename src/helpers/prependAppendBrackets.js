import fs from "fs";

/**
 * Reads the specified file, ensures the content is enclosed within brackets,
 * and writes the modified content back to the file. If there is a trailing comma
 * at the end of the content, it removes that before appending the closing bracket.
 *
 * @param {string} filePath - The path to the file to be modified.
 * @throws Will throw an error if unable to read or write to the specified file.
 *
 * @example
 * prependAppendBrackets('path/to/file.json');
 */
function prependAppendBrackets(filePath) {
  try {
    let data = fs.readFileSync(filePath, "utf8");

    if (!data.startsWith("[")) {
      data = "[" + data;
    }
    if (data.endsWith(",")) {
      data = data.slice(0, -1);
    }
    if (!data.endsWith("]")) {
      data = data + "]";
    }

    // Write the modified data back to the file
    fs.writeFileSync(filePath, data, "utf8");
  } catch (error) {
    console.error(
      "An error occurred while adding brackets to json file:",
      error.message
    );
  }
}
