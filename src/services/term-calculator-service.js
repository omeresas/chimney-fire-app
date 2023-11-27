import fetch from 'node-fetch';
import debugLib from 'debug';
import { getDayOfYear } from '../utils.js';
import { houseCount } from '../data/index.js';

const debug = debugLib('chimney-fire-app:model-terms');

const houseTypeFunctions = {
  houseType1: temporalTerm_houseType1,
  houseType2: temporalTerm_houseType2,
  houseType3: temporalTerm_houseType3,
  houseType4: temporalTerm_houseType4
};

export function readSpatialTerms(areaId) {
  const output = houseCount[areaId];
  debug('Spatial terms:');
  debug(output);

  return output;
}

export async function calculateTemporalTermsMultipleDays(thetaValues) {
  const weatherData = await fetchWeatherData();
  const dailyInputArr = calculateDailyInputs(weatherData);

  const keys = Object.keys(thetaValues);

  debug('Theta values of temporal terms calculation:');
  debug(thetaValues);

  const multipleDays = dailyInputArr.map((eachDay) => {
    const oneDay = {
      date: eachDay.date,
      terms: []
    };

    for (const key of keys) {
      const params = {
        theta: thetaValues[key],
        windSpeed: eachDay.windSpeed,
        windChill: eachDay.windChill,
        piOver365TimesDayIndex: eachDay.piOver365TimesDayIndex
      };

      if (typeof houseTypeFunctions[key] === 'function') {
        // insertion should start with houseType1 and goes like this
        oneDay.terms.push(houseTypeFunctions[key](params));
      } else {
        console.warn(`No function found for key: ${key}`);
      }
    }

    debug('Temporal terms for one day:');
    debug(oneDay);

    return oneDay;
  });

  return multipleDays;
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
  return windChill;
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
