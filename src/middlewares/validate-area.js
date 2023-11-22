import createError from 'http-errors';
import { areaIds } from '../data/index.js';

export default function createAreaValidator(areaType) {
  return function (req, res, next) {
    req.areaType = areaType;
    return validateArea(req, res, next);
  };
}

function validateArea(req, res, next) {
  const areaType = req.areaType;
  const areaId = req.params[`${areaType}Id`];

  const patterns = {
    gemeente: /^GM\d{4}$/,
    wijk: /^WK\d{6}$/,
    buurt: /^BU\d{8}$/,
    box: /^\d{1,5}$/
  };

  // Check if the areaId matches the pattern for its type
  if (!patterns[areaType].test(areaId) || !areaIds[areaType].has(areaId)) {
    return next(new createError.BadRequest('Invalid area code'));
  }

  next();
}
