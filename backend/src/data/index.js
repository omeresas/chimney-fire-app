import { fileURLToPath } from 'url';
import { readJson } from '../lib/utils.js';

let THETA_CACHE = null;
let HOUSECOUNT_CACHE = null;

export function getLatestTheta() {
  return THETA_CACHE;
}

export async function refreshThetaCache() {
  THETA_CACHE = await readJson(
    fileURLToPath(new URL('THETA.json', import.meta.url))
  );
}

export function getLatestHouseCount() {
  return HOUSECOUNT_CACHE;
}

export async function refreshHouseCountCache() {
  HOUSECOUNT_CACHE = await readJson(
    fileURLToPath(new URL('houseCount.json', import.meta.url))
  );
}

export const G_MATRIX = await readJson(
  fileURLToPath(new URL('G_MATRIX.json', import.meta.url))
);

export const areaGeometry = await readJson(
  fileURLToPath(new URL('areaGeometry.json', import.meta.url))
);

export const mockWeatherData = await readJson(
  fileURLToPath(new URL('mockWeatherData.json', import.meta.url))
);

export { default as areaIds } from './areaId.js';
