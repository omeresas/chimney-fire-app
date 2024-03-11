import { readFile } from 'fs/promises';

export async function readJson(path) {
  try {
    const data = await readFile(path, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`An error occurred while reading the file ${path}:`, err);
  }
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
