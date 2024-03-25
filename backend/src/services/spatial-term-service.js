import { getLatestHouseCount } from '../data/index.js';

export function readSpatialTerms(areaId) {
  const houseCount = getLatestHouseCount();
  const output = houseCount[areaId];

  return output;
}
