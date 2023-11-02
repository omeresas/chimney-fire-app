import express from 'express';
import createError from 'http-errors';
import validateArea from '../middlewares/validate-area.js';
import validateDate from '../middlewares/validate-date.js';
import { predictFires } from '../services/prediction-service.js';
import { areaGeometry } from '../data/index.js';

const router = express.Router();

router.get('/', validateDate, validateArea, async (req, res, next) => {
  const { areaCode } = req.query;
  const { date } = req;
  let predictedFires;
  try {
    predictedFires = await predictFires(areaCode, date);
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    return next(new createError.InternalServerError(error.message));
  }
  const geoInfo = areaGeometry[areaCode];

  return res.send({
    areaCode,
    date,
    predictedFires,
    geoInfo: {
      type: 'Feature',
      crs: {
        type: 'name',
        properties: {
          name: 'urn:ogc:def:crs:EPSG::28992'
        }
      },
      ...geoInfo
    }
  });
});

export default router;
