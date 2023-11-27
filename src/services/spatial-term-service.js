import debugLib from 'debug';
import { houseCount } from '../data/index.js';

const debug = debugLib('chimney-fire-app:model-terms');

export function readSpatialTerms(areaId) {
  const output = houseCount[areaId];
  debug('Spatial terms:');
  debug(output);

  return output;
}
