import {
  calculateSpatialTerms,
  calculateTemporalTerms,
} from './term-calculator-service.js';
import { thetaValues, windChillArr, windSpeedArr } from '../data/index.js';

export async function predictFires(muniName, date) {
  const temporalTerms = calculateTemporalTerms({
    date,
    thetaValues,
    windChillArr,
    windSpeedArr,
  });
  const spatialTerms = await calculateSpatialTerms(muniName);
  const expectedFires = multiplyTerms(spatialTerms, temporalTerms);
  return expectedFires;
}

function multiplyTerms(spatialTerms, temporalTerms) {
  let expectedFires = 0;
  for (const key in spatialTerms) {
    if (spatialTerms.hasOwnProperty(key) && temporalTerms.hasOwnProperty(key)) {
      expectedFires += spatialTerms[key] * temporalTerms[key];
    }
  }
  return expectedFires;
}
