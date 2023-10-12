import { executeRScript, getDayOfYear } from '../utils.js';
import PATHS from '../paths.js';

const houseTypeFunctions = {
  houseType1: temporalTerm_houseType1,
  houseType2: temporalTerm_houseType2,
  houseType3: temporalTerm_houseType3,
  houseType4: temporalTerm_houseType4
};

export async function calculateSpatialTerms(muniName) {
  try {
    const output = await executeRScript(PATHS.MUNICIPALITY_SCRIPT, muniName);
    return output.split(',').reduce(function (obj, value, index) {
      obj[`houseType${index + 1}`] = parseFloat(value.trim());
      return obj;
    }, {});
  } catch (error) {
    throw new Error('Failed to calculate spatial terms');
  }
}

export function calculateTemporalTerms({
  date,
  thetaValues,
  windChillArr,
  windSpeedArr
}) {
  const dayIndex = getDayOfYear(date);
  const windChill = windChillArr[dayIndex - 1];
  const windSpeed = windSpeedArr[dayIndex - 1];
  const piOver365TimesDayIndex = (Math.PI / 365) * dayIndex;

  const keys = Object.keys(thetaValues);
  const temporalTerms = {};

  for (const key of keys) {
    const params = {
      theta: thetaValues[key],
      windChill,
      windSpeed,
      piOver365TimesDayIndex
    };

    if (typeof houseTypeFunctions[key] === 'function') {
      temporalTerms[key] = houseTypeFunctions[key](params);
    } else {
      console.warn(`No function found for key: ${key}`);
    }
  }
  return temporalTerms;
}

function temporalTerm_houseType1({ theta, windChill, piOver365TimesDayIndex }) {
  const result = Math.exp(
    theta[0] +
      theta[1] * Math.cos(2 * piOver365TimesDayIndex) +
      theta[2] * Math.sin(2 * piOver365TimesDayIndex) +
      theta[3] * Math.cos(4 * piOver365TimesDayIndex) +
      theta[4] * Math.sin(4 * piOver365TimesDayIndex) +
      theta[5] * Math.cos(6 * piOver365TimesDayIndex) +
      theta[6] * Math.sin(6 * piOver365TimesDayIndex) +
      theta[7] * Math.cos(8 * piOver365TimesDayIndex) +
      theta[8] * Math.sin(8 * piOver365TimesDayIndex) +
      theta[9] * windChill +
      theta[10] * windChill ** 2
  );
  return result;
}

function temporalTerm_houseType2({ theta, windChill, piOver365TimesDayIndex }) {
  const result = Math.exp(
    theta[0] +
      theta[1] * Math.cos(2 * piOver365TimesDayIndex) +
      theta[2] * Math.sin(2 * piOver365TimesDayIndex) +
      theta[3] * Math.cos(4 * piOver365TimesDayIndex) +
      theta[4] * Math.sin(4 * piOver365TimesDayIndex) +
      theta[5] * Math.cos(6 * piOver365TimesDayIndex) +
      theta[6] * Math.sin(6 * piOver365TimesDayIndex) +
      theta[7] * windChill +
      theta[8] * windChill ** 2 +
      theta[9] * windChill ** 3 +
      theta[10] * windChill ** 4
  );
  return result;
}

function temporalTerm_houseType3({ theta, windChill, piOver365TimesDayIndex }) {
  const result = Math.exp(
    theta[0] +
      theta[1] * Math.cos(2 * piOver365TimesDayIndex) +
      theta[2] * Math.sin(2 * piOver365TimesDayIndex) +
      theta[3] * Math.cos(4 * piOver365TimesDayIndex) +
      theta[4] * Math.sin(4 * piOver365TimesDayIndex) +
      theta[5] * Math.cos(6 * piOver365TimesDayIndex) +
      theta[6] * Math.sin(6 * piOver365TimesDayIndex) +
      theta[7] * windChill
  );
  return result;
}

function temporalTerm_houseType4({
  theta,
  windChill,
  windSpeed,
  piOver365TimesDayIndex
}) {
  const result = Math.exp(
    theta[0] +
      theta[1] * Math.cos(2 * piOver365TimesDayIndex) +
      theta[2] * Math.sin(2 * piOver365TimesDayIndex) +
      theta[3] * Math.cos(4 * piOver365TimesDayIndex) +
      theta[4] * Math.sin(4 * piOver365TimesDayIndex) +
      theta[5] * Math.cos(6 * piOver365TimesDayIndex) +
      theta[6] * Math.sin(6 * piOver365TimesDayIndex) +
      theta[7] * Math.cos(8 * piOver365TimesDayIndex) +
      theta[8] * Math.sin(8 * piOver365TimesDayIndex) +
      theta[9] * windChill +
      theta[10] * windChill ** 2 +
      theta[11] * windChill ** 3 +
      theta[12] * windChill * windSpeed
  );
  return result;
}
