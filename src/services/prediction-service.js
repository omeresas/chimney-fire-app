import debugLib from 'debug';
import {
  calculateTemporalTermsMultipleDays,
  readSpatialTerms
} from './term-calculator-service.js';
import { thetaValues } from '../data/index.js';

const debug = debugLib('chimney-fire-app:model-terms');

export async function predictFires(areaId) {
  const temporalTermsMultipleDays =
    await calculateTemporalTermsMultipleDays(thetaValues);
  const spatialTerms = await readSpatialTerms(areaId);
  const predictedFiresArr = multiplyTermsMultipleDays(
    spatialTerms,
    temporalTermsMultipleDays
  );
  return predictedFiresArr;
}

function multiplyTermsMultipleDays(spatialTermsArr, temporalTermsArr) {
  return temporalTermsArr.map((temporalTermsSingleDay) => {
    return multiplyTermsSingleDay(spatialTermsArr, temporalTermsSingleDay);
  });
}

function multiplyTermsSingleDay(spatialTermsArr, temporalTerms) {
  let expectedFires = 0;
  for (let houseTypeIndex = 0; houseTypeIndex <= 3; houseTypeIndex++) {
    expectedFires +=
      spatialTermsArr[houseTypeIndex] * temporalTerms.terms[houseTypeIndex];
  }

  const prediction = {
    date: temporalTerms.date,
    numberOfFires: expectedFires.toFixed(2)
  };

  debug('Prediction for one day:');
  debug(prediction);

  return prediction;
}
