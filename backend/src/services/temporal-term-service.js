import cron from 'node-cron';
import axios from 'axios';
import debugLib from 'debug';
import { setTemporalState } from './temporal-state-store.js';
import { getDayOfYear, getCurrentTimeInNetherlands } from '../lib/utils.js';
import {
  getLatestTheta,
  refreshHouseCountCache,
  refreshThetaCache
} from '../data/index.js';

const debugWeather = debugLib('chimney-fire-app:weather');

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
  await refreshHouseCountCache();
  await refreshThetaCache();
  await updateTemporalTerms();
}

async function checkWeatherAPI() {
  const rawData = await fetchWeatherData();

  if (!rawData) {
    return false;
  }

  if (rawData.no_license) {
    console.error(
      `Failed to fetch weather data due to "No license" error during API checking process.`
    );
    return false;
  }

  if (rawData.api_key_invalid) {
    // Specific check for invalid API key
    console.error('Invalid API Key:', rawData.api_key_invalid);
    return false;
  }

  return true;
}

function setCronJob() {
  // Schedule the task to run at 0:35, 7:35, 12:35, and 18:35 every day
  cron.schedule(
    '35 0,7,12,18 * * *',
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
  const covariates = calculateCovariates(dailyInputs);
  const latestTheta = getLatestTheta();
  const temporalTerms = calculateTemporalTerms(latestTheta, covariates);
  setTemporalState(covariates, temporalTerms, getCurrentTimeInNetherlands());
  return true; // Return true to indicate successful update
}

async function fetchWeatherData() {
  const apiKey = process.env.METEOSERVER_API_KEY;
  const url = `https://data.meteoserver.nl/api/dagverwachting.php?locatie=Lonneker&key=${apiKey}`;

  try {
    const response = await axios.get(url);

    if (response.status !== 200) {
      console.error(
        `Failed to fetch weather data. Status Code: ${response.status}`
      );
      return null;
    }

    if (response.data.no_license) {
      console.error(`Failed to fetch weather data due to "No license" error.`);
      return null;
    }

    return response.data;
  } catch (error) {
    console.error(
      'Network error or problem making the request to Meteoserver API:',
      error
    );
    return null;
  }
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

function calculateTemporalTerms(theta, covariates) {
  const multipleDays = covariates.map((eachDay) => {
    const oneDay = {
      date: eachDay.date,
      houseType1: Math.exp(
        theta.houseType1.reduce(
          (acc, thetaValue, index) =>
            acc + thetaValue * eachDay.houseType1[index],
          0
        )
      ),
      houseType2: Math.exp(
        theta.houseType2.reduce(
          (acc, thetaValue, index) =>
            acc + thetaValue * eachDay.houseType2[index],
          0
        )
      ),
      houseType3: Math.exp(
        theta.houseType3.reduce(
          (acc, thetaValue, index) =>
            acc + thetaValue * eachDay.houseType3[index],
          0
        )
      ),
      houseType4: Math.exp(
        theta.houseType4.reduce(
          (acc, thetaValue, index) =>
            acc + thetaValue * eachDay.houseType4[index],
          0
        )
      )
    };

    return oneDay;
  });

  return multipleDays;
}

function calculateCovariates(dailyInputs) {
  return dailyInputs.map((eachDay) => {
    return {
      date: eachDay.date,
      houseType1: covariatesHouseType1(eachDay),
      houseType2: covariatesHouseType2(eachDay),
      houseType3: covariatesHouseType3(eachDay),
      houseType4: covariatesHouseType4(eachDay)
    };
  });
}

function covariatesHouseType1({ windChill, piOver365TimesDayIndex }) {
  return [
    1, // for theta[0]
    Math.cos(2 * piOver365TimesDayIndex),
    Math.sin(2 * piOver365TimesDayIndex),
    Math.cos(4 * piOver365TimesDayIndex),
    Math.sin(4 * piOver365TimesDayIndex),
    Math.cos(6 * piOver365TimesDayIndex),
    Math.sin(6 * piOver365TimesDayIndex),
    Math.cos(8 * piOver365TimesDayIndex),
    Math.sin(8 * piOver365TimesDayIndex),
    windChill,
    windChill ** 2
  ];
}

function covariatesHouseType2({ windChill, piOver365TimesDayIndex }) {
  return [
    1, // for theta[0]
    Math.cos(2 * piOver365TimesDayIndex),
    Math.sin(2 * piOver365TimesDayIndex),
    Math.cos(4 * piOver365TimesDayIndex),
    Math.sin(4 * piOver365TimesDayIndex),
    Math.cos(6 * piOver365TimesDayIndex),
    Math.sin(6 * piOver365TimesDayIndex),
    windChill,
    windChill ** 2,
    windChill ** 3,
    windChill ** 4
  ];
}

function covariatesHouseType3({ windChill, piOver365TimesDayIndex }) {
  return [
    1, // for theta[0]
    Math.cos(2 * piOver365TimesDayIndex),
    Math.sin(2 * piOver365TimesDayIndex),
    Math.cos(4 * piOver365TimesDayIndex),
    Math.sin(4 * piOver365TimesDayIndex),
    Math.cos(6 * piOver365TimesDayIndex),
    Math.sin(6 * piOver365TimesDayIndex),
    windChill
  ];
}

function covariatesHouseType4({
  windChill,
  windSpeed,
  piOver365TimesDayIndex
}) {
  return [
    1, // for theta[0]
    Math.cos(2 * piOver365TimesDayIndex),
    Math.sin(2 * piOver365TimesDayIndex),
    Math.cos(4 * piOver365TimesDayIndex),
    Math.sin(4 * piOver365TimesDayIndex),
    Math.cos(6 * piOver365TimesDayIndex),
    Math.sin(6 * piOver365TimesDayIndex),
    Math.cos(8 * piOver365TimesDayIndex),
    Math.sin(8 * piOver365TimesDayIndex),
    windChill,
    windChill ** 2,
    windChill ** 3,
    windChill * windSpeed
  ];
}
