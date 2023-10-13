import { readJson } from '../utils.js';

export const thetaValues = await readJson('./data/thetaValues.json');
export const windChillArr = await readJson('./data/windChill.json');
export const windSpeedArr = await readJson('./data/windSpeed.json');
export { default as areaCodes } from './areaCodes.js';
