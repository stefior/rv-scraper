import { spawn } from 'child_process';

// useful backup measure for leaving long slow scrapes to run, like 50k pages with rate limiting
function startScrapingWithRestart() {
    let attempts = 0;
    const maxAttempts = 2;

    const runScraper = (index) => new Promise((resolve, reject) => {
        const scraper = spawn('node', ['./src/scripts/rvDataScraper.js', index], {
            env: { ...process.env },
            stdio: 'inherit'
        });

        scraper.on('close', (code) => {
            if (code === 0) {
                resolve('success');
            } else {
                reject(`Exited with code ${code}`);
            }
        });
    });

    (async function loop() {
        while (attempts < maxAttempts) {
            try {
                await runScraper();
                break; // Exit the loop if successful
            } catch (error) {
                console.error(`Error occurred: ${error}. Restarting...`);
                attempts++;
                // Add a delay before restarting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        if (attempts === maxAttempts) {
            console.log('Max restart attempts reached. Exiting...');
        }
    })();
}

startScrapingWithRestart();
