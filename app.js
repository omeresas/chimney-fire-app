import createError from 'http-errors';
import express from 'express';
import logger from 'morgan';
import apiRouter from './routes/api-router.js';
import 'dotenv/config';

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api', apiRouter);

// Create Not Found Error
app.use((req, res, next) => {
  next(createError(404));
});

// Error Handling Middleware
app.use((err, req, res) => {
  res.status(err.status || 500);
  res.json({
    message: err.message,
    // Provide stack trace in development mode
    error: app.get('env') === 'development' ? err.stack : {}
  });
});

export default app;
