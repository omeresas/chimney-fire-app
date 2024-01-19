import debugLib from 'debug';
import { readSpatialTerms } from './spatial-term-service.js';
import { getTemporalState } from './temporal-state-store.js';
import { areaGeometry } from '../data/index.js';

const debugPred = debugLib('chimney-fire-app:prediction');

export function predictFires(areaId, includeGeoInfo) {
  const spatialTerms = readSpatialTerms(areaId);
  const { temporalTerms, scalingFactors } = getTemporalState();
  const predictedFiresArr = multiplyTermsForMultipleDays(
    spatialTerms,
    temporalTerms,
    scalingFactors
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

function multiplyTermsForMultipleDays(
  spatialTermsArr,
  temporalTermsArr,
  scalingFactorsArr
) {
  return temporalTermsArr.map((temporalTermsSingleDay, index) => {
    return multiplyTermsForASingleDay(
      spatialTermsArr,
      temporalTermsSingleDay,
      scalingFactorsArr[index]
    );
  });
}

function multiplyTermsForASingleDay(
  spatialTermsArr,
  temporalTerms,
  scalingFactors
) {
  let numberOfFires = 0;
  let lowerBoundOfFires = 0;
  let upperBoundOfFires = 0;

  Object.keys(temporalTerms).forEach((key, index) => {
    if (key.startsWith('houseType')) {
      const contribution = spatialTermsArr[index - 1] * temporalTerms[key];
      numberOfFires += contribution;
      lowerBoundOfFires += contribution * scalingFactors[key].lower;
      upperBoundOfFires += contribution * scalingFactors[key].upper;
    }
  });

  const prediction = {
    date: temporalTerms.date,
    numberOfFires: numberOfFires.toFixed(6),
    lowerBoundOfFires: lowerBoundOfFires.toFixed(6),
    upperBoundOfFires: upperBoundOfFires.toFixed(6)
  };

  debugPred('Prediction for one day:');
  debugPred(prediction);

  return prediction;
}
