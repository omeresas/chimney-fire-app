import express from 'express';
import createError from 'http-errors';
import { predictFires } from '../services/fire-prediction-service.js';
import { isValidCode } from '../services/area-code-validator.js';
import { convertStrToDate } from '../utils.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { areaCode, date: dateStr } = req.query;

    const date = convertStrToDate(dateStr);
    isValidCode(areaCode);
    const predictedFires = await predictFires(areaCode, date);

    res.json({
      areaCode,
      predictedFires
    });
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);

    if (
      error.message === 'Invalid date' ||
      error.message === 'Invalid area code'
    ) {
      return next(createError(400, error.message)); // Bad Request
    }

    return next(createError(500, 'Internal Server Error')); // Internal Server Error
  }
});

export default router;
