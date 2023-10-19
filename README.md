# RV Data Scraper

A set of scripts for scraping RV data from sites, formatting it, and uploading it to the database.

Workflow: extractAllSelectorLinks.js -> rvDataScraper.js -> autoPopulate.js

## Tips for Success

- **Selector Accuracy**: When choosing a selector for scraping data, ensure that it matches on at least two different pages to verify its accuracy. The selector should be specific enough to avoid matching unwanted elements, as `document.querySelector()` does not always return what would seem to be the first match. It's advisable to test your selector on a couple pages to ensure consistency. Also, use an incognito window for this so no extensions affect the copied selectors.

- **Dev Tools Positioning**: While working, keep the Dev Tools at the bottom of your screen. This prevents the site from altering its styles due to a narrower screen width, which might happen if it mistakes the situation for a mobile view.

- **Post-Scraping Review**: After running the `rvDataScraper` script, it's prudent to skim through the scraped data for each site to catch any inconsistencies or errors. This step helps ensure the accuracy and quality of the data before it's uploaded to the database.
