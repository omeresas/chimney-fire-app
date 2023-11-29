import express from 'express';
import createError from 'http-errors';
import createAreaValidator from '../middlewares/validate-area.js';
import { predictFires } from '../services/prediction-service.js';
import { areaGeometry, areaIds } from '../data/index.js';

const router = express.Router();

function createIndividualHandler(areaType) {
  return async (req, res, next) => {
    const areaId = req.params[`${areaType}Id`];
    const includeGeoInfo = req.query.excludeGeoInfo !== 'true';
    let output;

    try {
      output = await createOutputFor(areaId, includeGeoInfo);
    } catch (error) {
      console.error(`An error occurred: ${error.message}`);
      return next(new createError.InternalServerError(error.message));
    }

    return res.send(output);
  };
}

function createBulkHandler(areaType) {
  return async (req, res, next) => {
    const includeGeoInfo = req.query.excludeGeoInfo !== 'true';
    let output;
    const outputArr = [];

    try {
      for (const areaId of areaIds[areaType]) {
        output = await createOutputFor(areaId, includeGeoInfo);
        outputArr.push(output);
      }
    } catch (error) {
      console.error(`An error occurred: ${error.message}`);
      return next(new createError.InternalServerError(error.message));
    }

    return res.send(outputArr);
  };
}

async function createOutputFor(areaId, includeGeoInfo) {
  const predictionArr = await predictFires(areaId);

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
    prediction: predictionArr,
    ...(includeGeoInfo && { geoInfo })
  };
}

router.get('/gemeente', createBulkHandler('gemeente'));

router.get('/wijk', createBulkHandler('wijk'));

router.get('/buurt', createBulkHandler('buurt'));

router.get('/box', createBulkHandler('box'));

router.get(
  '/gemeente/:gemeenteId',
  createAreaValidator('gemeente'),
  createIndividualHandler('gemeente')
);

router.get(
  '/wijk/:wijkId',
  createAreaValidator('wijk'),
  createIndividualHandler('wijk')
);

router.get(
  '/buurt/:buurtId',
  createAreaValidator('buurt'),
  createIndividualHandler('buurt')
);

router.get(
  '/box/:boxId',
  createAreaValidator('box'),
  createIndividualHandler('box')
);

export default router;
