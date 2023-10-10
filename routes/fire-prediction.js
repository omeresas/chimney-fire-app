import express from 'express';
import createError from 'http-errors';
import { predictFires } from '../services/fire-prediction-service.js';
import { convertMunCodeToName, convertStrToDate } from '../utils.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { muniCode, date: dateStr } = req.query;
    const muniName = convertMunCodeToName(muniCode);
    const date = convertStrToDate(dateStr);
    const predictedFires = await predictFires(muniName, date);

    res.json({
      muniCode,
      muniName,
      predictedFires,
    });
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);

    if (
      error.message === 'Invalid date' ||
      error.message === 'Invalid municipality code'
    ) {
      return next(createError(400, error.message)); // Bad Request
    }

    return next(createError(500, 'Internal Server Error')); // Internal Server Error
  }
});

export default router;
