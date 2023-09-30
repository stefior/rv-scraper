import readline from "readline";

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
 */
export default function waitForUserInput() {
  const rl = readline.createInterface(process.stdin, process.stdout);
  return askQuestion(rl);
}
