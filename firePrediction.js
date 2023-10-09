import { calculateSpatialTerms } from './services/spatialTerm.js';
import { calculateTemporalTerms } from './services/temporalTerm.js';
import { thetaValues, windChillArr, windSpeedArr } from './data/index.js';

export async function predictFires(municipalityName, date) {
  const temporalTerms = calculateTemporalTerms({
    date,
    thetaValues,
    windChillArr,
    windSpeedArr,
  });
  const spatialTerms = await calculateSpatialTerms(
    'r/r-script/municipality.R',
    municipalityName
  );

  const expectedFires = multiplyTerms(spatialTerms, temporalTerms);

  console.log('Spatial Terms:');
  console.log(spatialTerms);
  console.log('Temporal Terms:');
  console.log(temporalTerms);
  console.log(
    `Expected Chimney Fires in ${municipalityName}: ${expectedFires}`
  );

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
