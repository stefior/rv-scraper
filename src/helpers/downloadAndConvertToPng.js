import path from "path";
import fs from "fs";
import axios from "axios";
import crypto from "crypto";
import https from "https";
import util from "node:util";
import { exec } from "child_process";
const execAsync = util.promisify(exec);

async function handleError(promise, errorMessage) {
  try {
    await promise;
  } catch (err) {
    throw new Error(`${errorMessage}: ${err}`);
  }
}

/**
 * Downloads an image from a given URL, saves it to the specified directory,
 * and converts it to PNG format if it's not already a PNG.
 *
 * @param {string} url - The URL of the image to download.
 * @param {string} fileName - The name to use when saving the image file (without extension).
 * @param {string} outputFolder [outputFolder='./output/images/'] - The folder to save the image to.
 *
 * @throws Will throw an error if there's a problem fetching the image or writing to disk.
 *
 * @returns {Promise<void>} A promise that resolves when the image has been downloaded,
 * saved, and possibly converted to PNG.
 *
 * @example
 *
 * downloadAndConvertImage('https://example.com/image.jpg', 'exampleImage', '/images')
 *   .then(() => console.log('Image downloaded and converted successfully'))
 *   .catch(error => console.error('Error:', error));
 */
export default async function downloadAndConvertImage(
  url,
  fileName,
  const allowLegacyRenegotiationforNodeJsOptions = {
    httpsAgent: new https.Agent({
      secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
    }),
  };
  let response;
  try {
    response = await axios({
      ...allowLegacyRenegotiationforNodeJsOptions,
      url,
      method: "GET",
      responseType: "stream",
    });
  } catch (err) {
    throw new Error(`Failed to fetch image: ${err}`);
  }
  const buffer = await response.data;
  const ext = path.extname(url).toLowerCase().split("?")[0];

  await handleError(
    fs.promises.mkdir(outputFolder, { recursive: true }),
    "Error while making specified output folder"
  );

  const savePath = path.join(outputFolder, `${fileName}${ext}`);
  await handleError(
    fs.promises.writeFile(savePath, buffer),
    "Failed to write original image"
  );

  if (ext !== ".png") {
    const pngPath = path.join(outputFolder, `${fileName}.png`);

    await handleError(
      execAsync(`magick "${savePath}" "${pngPath}"`),
      "Error converting image to PNG"
    );

    await handleError(
      fs.promises.unlink(savePath),
      "Error deleting original image"
    );
  }
}
