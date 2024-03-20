import express from 'express';
import validateArea from '../middlewares/validate-area.js';
import { predictFires } from '../services/prediction-service.js';
import { getLastFetchTimestamp } from '../services/temporal-state-store.js';
import { areaIds } from '../data/index.js';

const router = express.Router();

router.get('/:areaType/:areaId?', validateArea, (req, res) => {
  const areaId = req.params.areaId;
  const areaType = req.params.areaType;
  const requestedAreaIds = areaId ? [areaId] : Array.from(areaIds[areaType]);

  const includeGeoInfo = req.query.includeGeoInfo === 'true';
  const predictions = requestedAreaIds.map((id) =>
    predictFires(id, includeGeoInfo)
  );

  const lastFetchTimestamp = getLastFetchTimestamp();

  const response = {
    lastWeatherFetchTimestamp: lastFetchTimestamp,
    data: areaId ? predictions[0] : predictions
  };

  return res.send(response);
});

export default router;
