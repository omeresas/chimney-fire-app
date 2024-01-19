import {
  calculateScalingFactorsForCI,
  calculateStdDev
} from '../lib/math-utils.js';
import debugLib from 'debug';

const debugCov = debugLib('chimney-fire-app:covariates');
const debugStdDev = debugLib('chimney-fire-app:std-dev');
const debugScaling = debugLib('chimney-fire-app:scaling-factors');
const debugTempToday = debugLib('chimney-fire-app:temp-state-today');

let temporalState = {
  covariates: null,
  temporalTerms: null,
  standardDeviation: null,
  scalingFactors: {
    lowerBound: null,
    upperBound: null
  },
  lastFetchTimestamp: null
};

export function setTemporalState(newCovariates, newTerms, timestamp) {
  temporalState.covariates = newCovariates;
  temporalState.temporalTerms = newTerms;

  debugCov('Covariates:');
  debugCov(newCovariates);

  const stdDev = calculateStdDev(newCovariates);
  temporalState.standardDeviation = stdDev;

  debugStdDev('Standard Deviations:');
  debugStdDev(stdDev);

  temporalState.scalingFactors = calculateScalingFactorsForCI(stdDev);

  debugScaling('Scaling Factors for Confidence Intervals:');
  debugScaling(temporalState.scalingFactors);

  temporalState.lastFetchTimestamp = timestamp;

  debugTempToday('Temporal State of Today:');
  debugTempToday('First Covariate:', temporalState.covariates[0]);
  debugTempToday('First Temporal Term:', temporalState.temporalTerms[0]);
  debugTempToday('Standard Deviation:', temporalState.standardDeviation[0]);
  debugTempToday('Scaling Factors:', temporalState.scalingFactors[0]);
}

export function getTemporalState() {
  return temporalState;
}

export function getLastFetchTimestamp() {
  return temporalState.lastFetchTimestamp;
}
