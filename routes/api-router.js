import express from 'express';
import firePredictionRouter from './fire-prediction.js';

const apiRouter = express.Router();

apiRouter.use('/fire-prediction', firePredictionRouter);

export default apiRouter;
