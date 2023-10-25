import createError from 'http-errors';
import { predictFires } from '../services/prediction-service.js';

export default async function predictFiresMiddleware(req, res, next) {
  try {
    const { areaCode } = req.query;
    const { date } = req;
    const predictedFires = await predictFires(areaCode, date);
    req.predictedFires = predictedFires; // Save the predicted fires for the next middleware
    next();
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
    return next(createError(500, 'Internal Server Error')); // Internal Server Error
  }
}
