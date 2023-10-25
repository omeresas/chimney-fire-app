import { fileURLToPath } from 'url';
import { readJson } from '../utils.js';

export const thetaValues = await readJson(
  fileURLToPath(new URL('thetaValues.json', import.meta.url))
);
export const windChillArr = await readJson(
  fileURLToPath(new URL('windChill.json', import.meta.url))
);
export const windSpeedArr = await readJson(
  fileURLToPath(new URL('windSpeed.json', import.meta.url))
);
export const buurtenGeo = await readJson(
  fileURLToPath(new URL('buurtenGeo.json', import.meta.url))
);

export { default as areaCodes } from './areaCodes.js';
