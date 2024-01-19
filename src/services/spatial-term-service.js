import { houseCount } from '../data/index.js';

export function readSpatialTerms(areaId) {
  const output = houseCount[areaId];

  return output;
}
