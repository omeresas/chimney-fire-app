import debugLib from 'debug';
import { readSpatialTerms } from './spatial-term-service.js';

const debug = debugLib('chimney-fire-app:model-terms');

export async function predictFires(areaId) {
  const spatialTerms = await readSpatialTerms(areaId);
  const predictedFiresArr = multiplyTermsMultipleDays(
    spatialTerms,
    global.temporalTerms
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
    numberOfFires: expectedFires.toFixed(6)
  };

  debug('Prediction for one day:');
  debug(prediction);

  return prediction;
}
