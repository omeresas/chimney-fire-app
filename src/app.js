import createError from 'http-errors';
import express from 'express';
import logger from 'morgan';
import 'dotenv/config';
import cors from 'cors';

import predictionRouter from './routes/prediction.js';
import modelRouter from './routes/model.js';
import { setTemporalTermsService } from './services/temporal-term-service.js';

const app = express();
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/prediction', predictionRouter);
app.use('/model', modelRouter);

app.get('/health', (req, res) => {
  res.status(200).send('Healthy');
});

// Create Not Found Error
app.use((req, res, next) => {
  next(new createError.NotFound());
});

// Error Handling Middleware
app.use((err, req, res, _next) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    // Provide stack trace in development mode
    error: app.get('env') === 'development' ? err.stack : {}
  });
});

// Set cron job and update weather info and resulting temporal terms
await setTemporalTermsService();

export default app;
