import readline from "readline";

/**
 * Prompts the user with a yes or no question using a Readline Interface instance.
 * If the user inputs 'y' or 'Y', the promise resolves to true.
 * If the user inputs 'n' or 'N', the promise resolves to false.
 * If the user inputs anything else, they are prompted again until a valid input is received.
 *
 * @param {Readline.Interface} rl - An instance of Node.js' Readline Interface.
 * @returns {Promise<boolean>} A promise that resolves to true if the user inputs 'y' or 'Y', and false if the user inputs 'n' or 'N'.
 *
 * @example
 * const readline = require('readline');
 * const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
 * const userResponse = await askQuestion(rl);
 */
function askQuestion(rl) {
  return new Promise((resolve, reject) => {
    rl.question("Continue? (y/n) ", (answer) => {
      if (/^[ynYN]$/.test(answer)) {
        rl.close();
        if (answer.toLowerCase() == "y") resolve(true);
        else resolve(false);
      } else {
        console.log("Invalid input. Please enter 'y' or 'n'.");
        resolve(askQuestion(rl));
      }
    });
  });
}

/**
 * Initiates a ReadLine interface and prompts the user with a question.
 *
 * @returns {Promise<boolean>} - Resolves to true if the user enters 'y' or 'Y', resolves to false if the user enters 'n' or 'N'.
 * The function will keep asking the question until a valid input is provided.
 *
 * @example
 * waitForUserInput().then((answer) => {
 *   if (answer) {
 *     console.log('User wants to continue.');
 *   } else {
 *     console.log('User does not want to continue.');
 *   }
 * });
 *
 * This is useful for debugging purposes.
 */
export default function waitForUserInput() {
  const rl = readline.createInterface(process.stdin, process.stdout);
  return askQuestion(rl);
}
