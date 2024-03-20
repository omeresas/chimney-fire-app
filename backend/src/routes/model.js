import express from 'express';
import {
  handleFileUpload,
  updateHouseCount,
  refitModel
} from '../services/model-refit-service.js';

const router = express.Router();

router.put('/upload', handleFileUpload);
router.post('/update', updateHouseCount);
router.post('/refit', refitModel);

export default router;
