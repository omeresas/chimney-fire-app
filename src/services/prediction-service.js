import debugLib from 'debug';
import { readSpatialTerms } from './spatial-term-service.js';
import { getTemporalTerms } from './temporal-terms-store.js';
import { areaGeometry } from '../data/index.js';

const debug = debugLib('chimney-fire-app:model-terms');

export function predictFires(areaId, includeGeoInfo) {
  const spatialTerms = readSpatialTerms(areaId);
  const temporalTerms = getTemporalTerms();
  const predictedFiresArr = multiplyTermsForMultipleDays(
    spatialTerms,
    temporalTerms
  );

  const geoInfo = includeGeoInfo
    ? {
        type: 'Feature',
        crs: {
          type: 'name',
          properties: {
            name: 'urn:ogc:def:crs:EPSG::28992'
          }
        },
        ...areaGeometry[areaId]
      }
    : null;

  return {
    areaId,
    prediction: predictedFiresArr,
    ...(includeGeoInfo && { geoInfo })
  };
}

function multiplyTermsForMultipleDays(spatialTermsArr, temporalTermsArr) {
  return temporalTermsArr.map((temporalTermsSingleDay) => {
    return multiplyTermsForASingleDay(spatialTermsArr, temporalTermsSingleDay);
  });
}

function multiplyTermsForASingleDay(spatialTermsArr, temporalTerms) {
  const expectedFires = spatialTermsArr.reduce(
    (acc, spatialTerm, index) => acc + spatialTerm * temporalTerms.terms[index],
    0
  );

  const prediction = {
    date: temporalTerms.date,
    numberOfFires: expectedFires.toFixed(6)
  };

  debug('Prediction for one day:');
  debug(prediction);

  return prediction;
}
