import fs from "fs";
import path from "path";

/**
 * Backs up a specified file to a specified folder.
 * If the output folder doesn't exist, it will be created.
 * If the output folder path is not provided, it defaults to a folder named "backups".
 *
 * @param {string} filePath - The path to the file to be backed up.
 * @param {string} [outputFolderPath="backups"] - The path to the folder where the file will be backed up.
 * @throws Will throw an error if the file at filePath does not exist.
 *
 * @example
 * backupFile('source-file.txt', 'backup-folder');
 */
export default function backupFile(filePath, outputFolderPath = "backups") {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  if (!fs.existsSync(outputFolderPath)) {
    fs.mkdirSync(outputFolderPath, { recursive: true });
  }

  const fileName = path.basename(filePath);
  const backupFilePath = path.join(outputFolderPath, fileName);

  fs.copyFileSync(filePath, backupFilePath);

  console.log(`Backup of ${fileName} completed to ${backupFilePath}`);
}
