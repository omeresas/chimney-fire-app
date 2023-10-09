import { readFile } from 'fs/promises';

const municipalityCodes = await readJson('./data/municipalityCodes.json');

export async function readJson(path) {
  try {
    const data = await readFile(path, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`An error occurred while reading the file ${path}:`, err);
  }
}

export function convertMunCodeToName(code) {
  const municipalityName = municipalityCodes[code];

  if (!municipalityName) {
    throw new Error('Invalid municipality code');
  }

  return municipalityName;
}

export function convertStrToDate(dateStr) {
  if (!dateStr || isNaN(Date.parse(dateStr))) {
    throw new Error('Invalid date');
  }
  return new Date(dateStr);
}
