import express from 'express';
import predictFiresMiddleware from '../middlewares/predict-fires.js';
import validateArea from '../middlewares/validate-area.js';
import validateDate from '../middlewares/validate-date.js';
import { areaGeometry } from '../data/index.js';

const router = express.Router();

router.get(
  '/',
  validateDate,
  validateArea,
  predictFiresMiddleware,
  (req, res, _next) => {
    const { areaCode } = req.query;
    const { predictedFires, date } = req;
    const geoInfo = areaGeometry[areaCode];
    res.json({
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
  }
);

export default router;
