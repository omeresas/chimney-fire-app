import createError from 'http-errors';
import express from 'express';
import logger from 'morgan';
import 'dotenv/config';
import predictionRouter from './routes/prediction.js';
import { setTemporalTermsService } from './services/temporal-term-service.js';
import cors from 'cors';
import multer from 'multer';

const app = express();
app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/prediction', predictionRouter);

// TODO: Refactor Multer configuration and filter to a separate file
// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'src/data/uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

// File filter to validate file type
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'application/vnd.ms-excel' ||
    file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type, only Excel files are allowed!'), false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

app.post('/model/upload', upload.array('excelFiles', 5), (req, res, _next) => {
  if (req.files && req.files.length > 0) {
    // Process the files here
    res.json({
      message: `${req.files.length} File(s) uploaded successfully.`
    });
  } else {
    res.status(400).send('No files uploaded or wrong file type.');
  }
});

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
