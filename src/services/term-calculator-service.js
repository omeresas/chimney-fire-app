import fetch from 'node-fetch';
import { executeRScript, getDayOfYear } from '../utils.js';
import debugLib from 'debug';

const debug = debugLib('chimney-fire-app:spatial-terms');

const houseTypeFunctions = {
  houseType1: temporalTerm_houseType1,
  houseType2: temporalTerm_houseType2,
  houseType3: temporalTerm_houseType3,
  houseType4: temporalTerm_houseType4
};

export async function calculateSpatialTerms(areaCode) {
  try {
    const output = await executeRScript(
      `${process.env.MY_APP_PATH}/${process.env.SPATIAL_SCRIPT_PATH}`,
      areaCode
    );

    debug('Spatial terms are:\n' + output);

    return output.split(',').reduce(function (obj, value, index) {
      obj[`houseType${index + 1}`] = parseFloat(value.trim());
      return obj;
    }, {});
  } catch (error) {
    throw new Error('Failed to calculate spatial terms');
  }
}

export async function calculateTemporalTerms(thetaValues) {
  const weatherData = await fetchWeatherData();
  const dailyInputArr = calculateDailyInputs(weatherData);

  const keys = Object.keys(thetaValues);

  return dailyInputArr.map((eachDay) => {
    const temporalTerms = {};

    for (const key of keys) {
      const params = {
        theta: thetaValues[key],
        windSpeed: eachDay.windSpeed,
        windChill: eachDay.windChill,
        piOver365TimesDayIndex: eachDay.piOver365TimesDayIndex
      };

      if (typeof houseTypeFunctions[key] === 'function') {
        temporalTerms[key] = houseTypeFunctions[key](params);
      } else {
        console.warn(`No function found for key: ${key}`);
      }
    }

    return {
      date: eachDay.date,
      houseType1: temporalTerms.houseType1,
      houseType2: temporalTerms.houseType2,
      houseType3: temporalTerms.houseType3,
      houseType4: temporalTerms.houseType4
    };
  });
}

async function fetchWeatherData() {
  const apiKey = process.env.METEOSERVER_API_KEY;
  const url = `https://data.meteoserver.nl/api/dagverwachting.php?locatie=Lonneker&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    const weatherForecast = data.data.map((day) => ({
      date: day.dag,
      avg_temp: day.avg_temp,
      windkmh: day.windkmh
    }));

    return weatherForecast;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return null;
  }
}

function calculateDailyInputs(weatherData) {
  return weatherData.map((eachDay) => {
    const dayIndex = getDayOfYear(eachDay.date);
    const piOver365TimesDayIndex = (Math.PI / 365) * dayIndex;
    const windChill = calculateWindChill(
      parseFloat(eachDay.avg_temp),
      parseFloat(eachDay.windkmh)
    );

    return {
      date: eachDay.date,
      windSpeed: parseFloat(eachDay.windkmh),
      windChill: windChill,
      piOver365TimesDayIndex
    };
  });
}

function calculateWindChill(temperature, windSpeed) {
  const windChill =
    13.12 +
    0.6215 * temperature -
    11.37 * Math.pow(windSpeed, 0.16) +
    0.3965 * temperature * Math.pow(windSpeed, 0.16);
  return windChill.toFixed(2);
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
