import { areaCodes } from '../data/index.js';

export const isValidCode = (code) => {
  const patterns = {
    gemeente: /^GM\d{4}$/,
    wijk: /^WK\d{6}$/,
    buurt: /^BU\d{8}$/,
    box: /^\d{1,5}$/
  };

  // Identify the type of code
  const type = Object.keys(patterns).find((key) => patterns[key].test(code));

  // If type is unidentified or code is not in the set, throw an error
  if (!type || !areaCodes[type].has(code)) {
    throw new Error('Invalid area code');
  }

  return true;
};
