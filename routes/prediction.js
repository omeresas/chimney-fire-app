import express from 'express';
import predictFiresMiddleware from '../middlewares/predict-fires.js';
import validateArea from '../middlewares/validate-area.js';
import validateDate from '../middlewares/validate-date.js';
import { buurtenGeo } from '../data/index.js';

const router = express.Router();

router.get(
  '/',
  validateDate,
  validateArea,
  predictFiresMiddleware,
  (req, res, _next) => {
    const { areaCode } = req.query;
    const { predictedFires, date } = req;
    const geoInfo = buurtenGeo[areaCode];
    res.json({
      areaCode,
      date,
      predictedFires,
      geoInfo
    });
  }
);

export default router;
