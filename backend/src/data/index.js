import { fileURLToPath } from 'url';
import { readJson } from '../lib/utils.js';

export const THETA = await readJson(
  fileURLToPath(new URL('THETA.json', import.meta.url))
);

export const G_MATRIX = await readJson(
  fileURLToPath(new URL('G_MATRIX.json', import.meta.url))
);

export const areaGeometry = await readJson(
  fileURLToPath(new URL('areaGeometry.json', import.meta.url))
);

export const houseCount = await readJson(
  fileURLToPath(new URL('houseCount.json', import.meta.url))
);

export const mockWeatherData = await readJson(
  fileURLToPath(new URL('mockWeatherData.json', import.meta.url))
);

export { default as areaIds } from './areaId.js';
