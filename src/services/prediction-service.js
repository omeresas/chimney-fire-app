import {
  calculateSpatialTerms,
  calculateTemporalTerms
} from './term-calculator-service.js';
import { thetaValues } from '../data/index.js';

export async function predictFires(areaCode) {
  const temporalTermsArr = await calculateTemporalTerms(thetaValues);
  const spatialTerms = await calculateSpatialTerms(areaCode);
  const predictedFiresArr = multiplyTerms(spatialTerms, temporalTermsArr);
  return predictedFiresArr;
}

function multiplyTerms(spatialTerms, temporalTermsArr) {
  return temporalTermsArr.map((temporalTerms) => {
    let expectedFires = 0;
    for (const key in spatialTerms) {
      if (
        Object.prototype.hasOwnProperty.call(spatialTerms, key) &&
        Object.prototype.hasOwnProperty.call(temporalTerms, key)
      ) {
        expectedFires += spatialTerms[key] * temporalTerms[key];
      }
    }
    return {
      date: temporalTerms.date,
      numberOfFires: expectedFires.toFixed(2)
    };
  });
}
