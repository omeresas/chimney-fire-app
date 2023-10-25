import { readFile } from 'fs/promises';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import debugLib from 'debug';

const debug = debugLib('chimney-fire-app:spatial-terms');

const filePathOfData = fileURLToPath(
  new URL('data/municipalityCodes.json', import.meta.url)
);
const municipalityCodes = await readJson(filePathOfData);

export async function readJson(path) {
  try {
    const data = await readFile(path, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`An error occurred while reading the file ${path}:`, err);
  }
}

export function convertMunCodeToName(code) {
  const muniName = municipalityCodes[code];

  if (!muniName) {
    throw new Error('Invalid municipality code');
  }

  return muniName;
}

export function convertStrToDate(dateStr) {
  if (!dateStr || isNaN(Date.parse(dateStr))) {
    throw new Error('Invalid date');
  }
  return new Date(dateStr);
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

export function getDayOfYear(date) {
  const timestamp1 = Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const timestamp2 = Date.UTC(date.getFullYear(), 0, 0);
  const differenceInMilliseconds = timestamp1 - timestamp2;
  const differenceInDays = differenceInMilliseconds / 1000 / 60 / 60 / 24;
  return differenceInDays;
}
