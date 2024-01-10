import cron from 'node-cron';
import fetch from 'node-fetch';
import debugLib from 'debug';
import { setTemporalTerms } from './temporal-terms-store.js';
import { getDayOfYear } from '../utils.js';
import { thetaValues } from '../data/index.js';

const debugModel = debugLib('chimney-fire-app:model-terms');
const debugWeather = debugLib('chimney-fire-app:weather-forecast');

export async function setTemporalTermsService() {
  if (!(await checkWeatherAPI())) {
    console.error(
      'Failed to fetch initial weather data. ' +
        'Check the API key and status of Meteoserver API. ' +
        'Shutting down the app.'
    );
    process.exit(1);
  }

  setCronJob();
  await updateTemporalTerms();
}

async function checkWeatherAPI() {
  const rawData = await fetchWeatherData();

  if (!rawData) {
    return false;
  }

  if (rawData.api_key_invalid) {
    // Specific check for invalid API key
    console.error('Invalid API Key:', rawData.api_key_invalid);
    return false;
  }

  return true;
}

async function fetchWeatherData() {
  const apiKey = process.env.METEOSERVER_API_KEY;
  const url = `https://data.meteoserver.nl/api/dagverwachting.php?locatie=Lonneker&key=${apiKey}`;

  try {
    const response = await fetch(url);

    if (response.status !== 200) {
      console.error(
        `Failed to fetch weather data. Status Code: ${response.status}`
      );
      return null;
    }

    return response.json();
  } catch (error) {
    console.error(
      'Network error or problem making the request to Meteoserver API:',
      error
    );
    return null;
  }
}

function setCronJob() {
  // Schedule the task to run at minute 0 of every hour
  cron.schedule(
    '0 * * * *',
    async () => {
      const success = await updateTemporalTerms();
      if (!success) {
        console.error('Scheduled update of temporal terms was unsuccessful.');
      }
    },
    {
      scheduled: true,
      timezone: 'Europe/Amsterdam'
    }
  );
}

async function updateTemporalTerms() {
  const rawData = await fetchWeatherData();

  if (rawData === null) {
    return false; // Return false to indicate no update was made
  }

  const weatherData = processWeatherData(rawData);
  const dailyInputs = calculateDailyInputs(weatherData);
  const temporalTerms = calculateTemporalTerms(thetaValues, dailyInputs);
  setTemporalTerms(temporalTerms, new Date());
  return true; // Return true to indicate successful update
}

function processWeatherData(rawData) {
  const weatherForecast = rawData.data.map((day) => ({
    date: day.dag,
    avg_temp: day.avg_temp,
    windkmh: day.windkmh
  }));

  debugWeather('Processed weather data:');
  debugWeather(weatherForecast);

  return weatherForecast;
}

function calculateDailyInputs(weatherData) {
  return weatherData.map((eachDay) => {
    const dayIndex = getDayOfYear(eachDay.date);
    const piOver365TimesDayIndex = (Math.PI / 365) * dayIndex;
    const windChill =
      13.12 +
      0.6215 * parseFloat(eachDay.avg_temp) -
      11.37 * Math.pow(parseFloat(eachDay.windkmh), 0.16) +
      0.3965 *
        parseFloat(eachDay.avg_temp) *
        Math.pow(parseFloat(eachDay.windkmh), 0.16);

    return {
      date: eachDay.date,
      windSpeed: parseFloat(eachDay.windkmh),
      windChill: windChill,
      piOver365TimesDayIndex
    };
  });
}

function calculateTemporalTerms(thetaValues, dailyInputs) {
  const keys = Object.keys(thetaValues);

  debugModel('Theta values of temporal terms calculation:');
  debugModel(thetaValues);

  const multipleDays = dailyInputs.map((eachDay) => {
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

    debugModel('Temporal terms for one day:');
    debugModel(oneDay);

    return oneDay;
  });

  return multipleDays;
}

const houseTypeFunctions = {
  houseType1: temporalTerm_houseType1,
  houseType2: temporalTerm_houseType2,
  houseType3: temporalTerm_houseType3,
  houseType4: temporalTerm_houseType4
};

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
