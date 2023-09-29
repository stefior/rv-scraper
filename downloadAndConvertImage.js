export default async function downloadAndConvertImage(url, filename) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const ext = path.extname(url).toLowerCase();

  // Ensure 'images' directory exists
  if (!fs.existsSync("images")) {
    fs.mkdirSync("images");
  }

  const savePath = path.join("images", `${filename}${ext}`);
  fs.writeFileSync(savePath, buffer);

  // Convert to PNG if not PNG
  if (ext !== ".png") {
    const pngPath = path.join("images", `${filename}`);
    exec(`magick ${savePath} ${pngPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error converting image to PNG: ${error}`);
        return;
      }
      // Delete the original non-PNG image
      fs.unlinkSync(savePath);
    });
  }
}
