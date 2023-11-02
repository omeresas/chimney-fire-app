import createError from 'http-errors';
import { convertStrToDate } from '../utils.js';

export default function validateDate(req, res, next) {
  const { date: dateStr } = req.query;
  try {
    req.date = convertStrToDate(dateStr);
    next();
  } catch (error) {
    if (error.message === 'Invalid date') {
      return next(new createError.BadRequest('Invalid date'));
    }
    return next(error); // Forward other errors to the next error handling middleware
  }
}
