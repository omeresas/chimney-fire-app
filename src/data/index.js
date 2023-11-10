import { fileURLToPath } from 'url';
import { readJson } from '../utils.js';

export const thetaValues = await readJson(
  fileURLToPath(new URL('thetaValues.json', import.meta.url))
);

export const areaGeometry = await readJson(
  fileURLToPath(new URL('areaGeometry.json', import.meta.url))
);

export { default as areaCodes } from './areaCodes.js';
