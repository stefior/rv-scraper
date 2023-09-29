// convert value from ft or from ft and inches to just inches
// e.g. 8' 4" to 100" or 8' to 96"
// use case: the database's width field only takes inches
export default function feetInchesToInches(feetInches) {
  const pattern = /^(\d+\.?0?)'\s*(\d*\.?\d+"|\d+\.?\d*"?)?$/
  const matches = feetInches.match(pattern)
  if (!matches) throw new Error("Invalid input format");
  
  const feet = parseInt(matches[1])
  const inches = matches[2] ? parseFloat(matches[2]) : 0;

  return feet * 12 + inches
}
