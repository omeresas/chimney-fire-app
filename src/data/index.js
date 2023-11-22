import { fileURLToPath } from 'url';
import { readJson } from '../utils.js';

export const thetaValues = await readJson(
  fileURLToPath(new URL('thetaValues.json', import.meta.url))
);

export const areaGeometry = await readJson(
  fileURLToPath(new URL('areaGeometry.json', import.meta.url))
);

export const houseCount = await readJson(
  fileURLToPath(new URL('houseCount.json', import.meta.url))
);

export { default as areaIds } from './areaId.js';
