import { readFile } from 'fs/promises';
import { exec } from 'child_process';
import debugLib from 'debug';

const debug = debugLib('chimney-fire-app:R-script');

export async function readJson(path) {
  try {
    const data = await readFile(path, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`An error occurred while reading the file ${path}:`, err);
  }
}

export function executeRScript(scriptPath, args) {
  return new Promise((resolve, reject) => {
    debug(`Executing R script: Rscript ${scriptPath} ${args}`);
    exec(`Rscript ${scriptPath} ${args}`, function (error, stdout) {
      if (error) {
        console.error(`Error executing R script: ${error}`);
        return reject(new Error('Internal Server Error'));
      }
      resolve(stdout);
    });
  });
}

export function getDayOfYear(dateStr) {
  // Parse the date string in the format 'DD-MM-YYYY'
  const [day, month, year] = dateStr.split('-').map((num) => parseInt(num, 10));
  // Create a Date object (month is 0-indexed in JavaScript Date)
  const date = new Date(Date.UTC(year, month - 1, day));
  const startOfYear = Date.UTC(date.getFullYear(), 0, 0);
  const differenceInMilliseconds = date - startOfYear;
  const differenceInDays = differenceInMilliseconds / 1000 / 60 / 60 / 24;
  return differenceInDays;
}
