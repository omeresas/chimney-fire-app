import createError from 'http-errors';
import { areaIds } from '../data/index.js';

export default function validateArea(req, res, next) {
  const areaType = req.params.areaType;
  const areaId = req.params.areaId;

  const patterns = {
    gemeente: /^GM\d{4}$/,
    wijk: /^WK\d{6}$/,
    buurt: /^BU\d{8}$/,
    box: /^\d{1,5}$/
  };

  // Check if the areaType is valid
  if (!patterns[areaType]) {
    return next(new createError.BadRequest('Invalid area type'));
  }

  // If areaId is provided, validate it
  if (
    areaId &&
    (!patterns[areaType].test(areaId) || !areaIds[areaType].has(areaId))
  ) {
    return next(new createError.BadRequest('Invalid area code'));
  }

  next();
}
