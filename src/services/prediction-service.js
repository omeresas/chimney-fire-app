import {
  calculateSpatialTerms,
  calculateTemporalTerms
} from './term-calculator-service.js';
import { thetaValues, windChillArr, windSpeedArr } from '../data/index.js';

export async function predictFires(areaCode, date) {
  const temporalTerms = calculateTemporalTerms({
    date,
    thetaValues,
    windChillArr,
    windSpeedArr
  });
  const spatialTerms = await calculateSpatialTerms(areaCode);
  const expectedFires = multiplyTerms(spatialTerms, temporalTerms);
  return expectedFires;
}

function multiplyTerms(spatialTerms, temporalTerms) {
  let expectedFires = 0;
  for (const key in spatialTerms) {
    if (
      Object.prototype.hasOwnProperty.call(spatialTerms, key) &&
      Object.prototype.hasOwnProperty.call(temporalTerms, key)
    ) {
      expectedFires += spatialTerms[key] * temporalTerms[key];
    }
  }
  return expectedFires;
}
