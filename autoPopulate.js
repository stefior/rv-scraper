import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";

const inputFile = "output.json";
const jsonData = JSON.parse(fs.readFileSync(inputFile, "utf8"));

(async () => {
  // It doesn't use a headless browser currently, so
  // I can verify visually that each was posted without issue
  const browser = await puppeteer.launch({ headless: false });
  let page = await browser.newPage();

  for (const dataObject of jsonData) {
    await page.goto("http://127.0.0.1:5500/testing.html");


    for (const [key, value] of Object.entries(dataObject)) {
      const trElements = await page.$$("tr");

      let found = false;
      for (const trElement of trElements) {
        const tdElements = await trElement.$$("td");

        for (const tdElement of tdElements) {
          const textContent = await page.evaluate(
            (el) => el.textContent,
            tdElement
          );

          if (textContent.includes(key)) {
            found = true;

            if (key === "Floor plan") {
              await page.waitForSelector("input[name=floor_plan][type=file]");
              const fileInputElement = await trElement.$(
                "input[name=floor_plan][type=file]"
              );
              if (fileInputElement) {
                const filePath = path.resolve("images", String(value));

                // Check if file exists
                if (fs.existsSync(filePath)) {
                  await fileInputElement.focus();
                  await fileInputElement.uploadFile(filePath);

                  // Manually trigger a change event
                  await page.evaluate((inputElement) => {
                    const changeEvent = new Event("change", { bubbles: true });
                    inputElement.dispatchEvent(changeEvent);
                  }, fileInputElement);
                } else {
                  console.error("File does not exist", filePath);
                }
              }
            } else {
              const inputElementHandle = await trElement.$(
                'input[type="text"]'
              );
              if (inputElementHandle) {
                await inputElementHandle.type(String(value));
              }
            }
            break;
          }
        }

        if (found) break;
      }

      if (!found) {
        console.error(`Key ${key} not found on the page.`);
      }
    }

    // Open a new tab for the next object, if needed
    if (jsonData.indexOf(dataObject) !== jsonData.length - 1) {
      page = await browser.newPage();
    }
  }
})();
