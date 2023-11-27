import express from 'express';
import createError from 'http-errors';
import createAreaValidator from '../middlewares/validate-area.js';
import { predictFires } from '../services/prediction-service.js';
import { areaGeometry } from '../data/index.js';

const router = express.Router();

function createRouteHandler(areaType) {
  return async (req, res, next) => {
    const areaId = req.params[`${areaType}Id`];
    const includeGeoInfo = req.query.includeGeoInfo !== 'false';

    let predictionArr;
    try {
      predictionArr = await predictFires(areaId);
    } catch (error) {
      console.error(`An error occurred: ${error.message}`);
      return next(new createError.InternalServerError(error.message));
    }

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

    return res.send({
      areaId: areaId,
      prediction: predictionArr,
      ...(includeGeoInfo && { geoInfo })
    });
  };
}

router.get(
  '/gemeente/:gemeenteId',
  createAreaValidator('gemeente'),
  createRouteHandler('gemeente')
);

router.get(
  '/wijk/:wijkId',
  createAreaValidator('wijk'),
  createRouteHandler('wijk')
);

router.get(
  '/buurt/:buurtId',
  createAreaValidator('buurt'),
  createRouteHandler('buurt')
);

export default router;
